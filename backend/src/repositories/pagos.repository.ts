import { pool } from '../config/database';
import { PoolClient } from 'pg';
import { CreatePagoDTO, PagoResponseDTO, CuotaConPagoDTO } from '../types/pagos.types';
import { EstadoCuota } from '../types/contratos.types';

export class PagosRepository {
  /**
   * Obtiene el piso base encadenado (monto_actualizado de la cuota inmediata anterior del mismo contrato y concepto).
   */
  private async obtenerPisoBase(
    client: PoolClient,
    idContrato: number,
    concepto: string,
    nroCuota: number,
    montoBaseActual: number
  ): Promise<number> {
    if (nroCuota <= 1) {
      return montoBaseActual;
    }

    const prevQuery = `
      SELECT monto_actualizado 
      FROM cuotas 
      WHERE id_contrato = $1 
        AND concepto = $2 
        AND nro_cuota < $3 
      ORDER BY nro_cuota DESC 
      LIMIT 1;
    `;
    const res = await client.query(prevQuery, [idContrato, concepto, nroCuota]);

    if (res.rows.length > 0 && res.rows[0].monto_actualizado !== null) {
      return Number(res.rows[0].monto_actualizado);
    }

    return montoBaseActual;
  }

  async registrarPagoTransaccional(data: CreatePagoDTO): Promise<PagoResponseDTO> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Bloqueo exclusivo de la cuota (SIN agregaciones ni GROUP BY)
      const cuotaQuery = `
        SELECT 
          id_cuota, 
          id_contrato, 
          concepto, 
          nro_cuota, 
          periodo, 
          monto_base, 
          monto_actualizado, 
          saldo_remanente, 
          COALESCE(porcentaje_actualizacion, 0.00) AS porcentaje_actualizacion, 
          estado 
        FROM cuotas 
        WHERE id_cuota = $1 
        FOR UPDATE;
      `;
      const cuotaRes = await client.query(cuotaQuery, [data.id_cuota]);

      if (cuotaRes.rows.length === 0) {
        throw new Error(`No se encontró la cuota con ID ${data.id_cuota}.`);
      }

      const cuota = cuotaRes.rows[0];

      if (cuota.estado === 'PAGADA') {
        throw new Error(`La cuota #${data.id_cuota} ya se encuentra registrada como PAGADA.`);
      }

      // 2. Obtener acumulado histórico abonado en consulta separada
      const pagosRes = await client.query(
        `SELECT COALESCE(SUM(monto), 0) AS total_pagado 
         FROM pagos 
         WHERE id_cuota = $1;`,
        [data.id_cuota]
      );
      const totalHistoricoAbonado = Number(pagosRes.rows[0].total_pagado);

      let montoActualizado = Number(cuota.monto_actualizado);
      let porcentajeActualizacion = Number(cuota.porcentaje_actualizacion);

      // 3. Recalcular piso base si se actualizó el porcentaje
      if (data.porcentaje_actualizacion !== undefined && data.porcentaje_actualizacion !== null) {
        porcentajeActualizacion = Number(data.porcentaje_actualizacion);

        const pisoBase = await this.obtenerPisoBase(
          client,
          cuota.id_contrato,
          cuota.concepto,
          Number(cuota.nro_cuota),
          Number(cuota.monto_base)
        );

        montoActualizado = Number((pisoBase * (1 + porcentajeActualizacion / 100)).toFixed(2));
      }

      const montoAPagar = Number(data.monto);
      if (isNaN(montoAPagar) || montoAPagar <= 0) {
        throw new Error('El importe de pago debe ser superior a 0.');
      }

      const nuevoTotalAbonado = Number((totalHistoricoAbonado + montoAPagar).toFixed(2));
      const nuevoSaldo = Number(Math.max(0, montoActualizado - nuevoTotalAbonado).toFixed(2));

      if (nuevoTotalAbonado > montoActualizado + 0.01) {
        throw new Error(
          `El total acumulado ($${nuevoTotalAbonado.toFixed(2)}) supera el monto actualizado de la cuota ($${montoActualizado.toFixed(2)}).`
        );
      }

      // 4. Insertar comprobante de pago
      const fechaPagoFinal = data.fecha_pago || new Date().toISOString().split('T')[0];
      const insertPagoQuery = `
        INSERT INTO pagos (
          id_cuota,
          monto,
          fecha_pago,
          medio_pago,
          comprobante
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const pagoRes = await client.query(insertPagoQuery, [
        data.id_cuota,
        montoAPagar,
        fechaPagoFinal,
        data.medio_pago || 'TRANSFERENCIA',
        data.comprobante ?? null,
      ]);

      // 5. Determinar estado y actualizar cuota
      const nuevoEstado: EstadoCuota = nuevoSaldo <= 0.01 ? 'PAGADA' : 'PAGO_PARCIAL';

      const updateCuotaQuery = `
        UPDATE cuotas 
        SET 
          porcentaje_actualizacion = $1,
          monto_actualizado = $2,
          saldo_remanente = $3,
          estado = $4
        WHERE id_cuota = $5;
      `;
      await client.query(updateCuotaQuery, [
        porcentajeActualizacion,
        montoActualizado,
        nuevoSaldo,
        nuevoEstado,
        data.id_cuota,
      ]);

      await client.query('COMMIT');
      return pagoRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // PATCH puntual del índice
  async actualizarIndiceCuota(idCuota: number, porcentaje: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Bloqueo limpio de la cuota
      const cuotaQuery = `
        SELECT 
          id_cuota, 
          id_contrato, 
          concepto, 
          nro_cuota, 
          monto_base, 
          monto_actualizado, 
          saldo_remanente, 
          estado 
        FROM cuotas 
        WHERE id_cuota = $1 
        FOR UPDATE;
      `;
      const resCuota = await client.query(cuotaQuery, [idCuota]);

      if (resCuota.rows.length === 0) {
        throw new Error(`No se encontró la cuota con ID ${idCuota}.`);
      }

      const cuota = resCuota.rows[0];

      // 2. Obtener acumulado de pagos en query independiente
      const resPagos = await client.query(
        `SELECT COALESCE(SUM(monto), 0) AS total_pagado 
         FROM pagos 
         WHERE id_cuota = $1;`,
        [idCuota]
      );
      const totalAbonado = Number(resPagos.rows[0].total_pagado);

      // 3. Obtener piso base encadenado
      const pisoBase = await this.obtenerPisoBase(
        client,
        cuota.id_contrato,
        cuota.concepto,
        Number(cuota.nro_cuota),
        Number(cuota.monto_base)
      );

      const nuevoMontoActualizado = Number((pisoBase * (1 + porcentaje / 100)).toFixed(2));
      const nuevoSaldo = Number(Math.max(0, nuevoMontoActualizado - totalAbonado).toFixed(2));

      let nuevoEstado: EstadoCuota;
      if (nuevoSaldo <= 0.01) {
        nuevoEstado = 'PAGADA';
      } else if (totalAbonado > 0) {
        nuevoEstado = 'PAGO_PARCIAL';
      } else {
        nuevoEstado = 'PENDIENTE';
      }

      const updateQuery = `
        UPDATE cuotas 
        SET 
          porcentaje_actualizacion = $1,
          monto_actualizado = $2,
          saldo_remanente = $3,
          estado = $4
        WHERE id_cuota = $5;
      `;
      await client.query(updateQuery, [
        porcentaje,
        nuevoMontoActualizado,
        nuevoSaldo,
        nuevoEstado,
        idCuota,
      ]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getCuotasByInmueble(id_inmueble: number): Promise<CuotaConPagoDTO[]> {
    const query = `
      SELECT 
        c.id_cuota,
        c.id_contrato,
        ct.id_inmueble,
        i.clave_cliente,
        c.concepto,
        c.nro_cuota,
        c.periodo,
        c.monto_base,
        c.monto_actualizado,
        c.saldo_remanente,
        CAST(COALESCE(c.porcentaje_actualizacion, 0.00) AS FLOAT) AS porcentaje_actualizacion,
        c.fecha_vencimiento,
        c.estado,
        COALESCE(SUM(p.monto), 0) AS total_abonado,
        MAX(p.fecha_pago) AS ultima_fecha_pago,
        MAX(p.comprobante) AS ultimo_comprobante
      FROM cuotas c
      INNER JOIN contratos ct ON c.id_contrato = ct.id_contrato
      INNER JOIN inmuebles i ON ct.id_inmueble = i.id_inmueble
      LEFT JOIN pagos p ON c.id_cuota = p.id_cuota
      WHERE i.id_inmueble = $1
      GROUP BY 
        c.id_cuota, 
        c.id_contrato, 
        ct.id_inmueble, 
        i.clave_cliente,
        c.saldo_remanente
      ORDER BY c.fecha_vencimiento ASC, c.concepto ASC;
    `;
    const result = await pool.query(query, [id_inmueble]);
    return result.rows;
  }
}