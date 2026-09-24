import { pool } from '../config/database';
import { PoolClient } from 'pg';
import { CreatePagoDTO, PagoResponseDTO, CuotaConPagoDTO, ChequeCarteraDTO } from '../types/pagos.types';
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
          comprobante,
          numero_cheque,
          banco_emisor,
          cuit_librador,
          fecha_emision,
          fecha_cobro
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;

      const values = [
        data.id_cuota,               // $1
        montoAPagar,                 // $2
        fechaPagoFinal,              // $3
        data.medio_pago,             // $4
        data.comprobante ?? null,    // $5
        data.numero_cheque ?? null,  // $6
        data.banco_emisor ?? null,   // $7
        data.cuit_librador ?? null,  // $8
        data.fecha_emision ?? null,  // $9
        data.fecha_cobro ?? null,    // $10
      ];

      const pagoRes = await client.query(insertPagoQuery, values);

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
        c.monto_base::float AS monto_base,
        c.monto_actualizado::float AS monto_actualizado,
        c.saldo_remanente::float AS saldo_remanente,
        CAST(COALESCE(c.porcentaje_actualizacion, 0.00) AS FLOAT) AS porcentaje_actualizacion,
        TO_CHAR(c.fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento,
        c.estado,
        COALESCE(SUM(p.monto), 0)::float AS total_abonado,
        MAX(TO_CHAR(p.fecha_pago, 'YYYY-MM-DD')) AS ultima_fecha_pago,
        MAX(p.comprobante) AS ultimo_comprobante,
        COALESCE(
          json_agg(
            json_build_object(
              'id_pago', p.id_pago,
              'id_cuota', p.id_cuota,
              'monto', p.monto::float,
              'fecha_pago', TO_CHAR(p.fecha_pago, 'YYYY-MM-DD'),
              'medio_pago', p.medio_pago,
              'comprobante', p.comprobante
            ) ORDER BY p.fecha_pago ASC, p.id_pago ASC
          ) FILTER (WHERE p.id_pago IS NOT NULL),
          '[]'::json
        ) AS pagos
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
        c.concepto,
        c.nro_cuota,
        c.periodo,
        c.monto_base,
        c.monto_actualizado,
        c.saldo_remanente,
        c.porcentaje_actualizacion,
        c.fecha_vencimiento,
        c.estado
      ORDER BY c.fecha_vencimiento ASC, c.concepto ASC;
    `;
    const result = await pool.query(query, [id_inmueble]);
    return result.rows;
  }

 async listarCarteraCheques(idObra?: number | null, estadoCustodia?: string | null): Promise<ChequeCarteraDTO[]> {
    let query = `
      SELECT 
        p.id_pago,
        p.id_cuota,
        p.monto::float AS monto,
        TO_CHAR(p.fecha_pago, 'YYYY-MM-DD') AS fecha_pago,
        p.medio_pago,
        p.numero_cheque,
        p.banco_emisor,
        p.cuit_librador,
        TO_CHAR(p.fecha_emision, 'YYYY-MM-DD') AS fecha_emision,
        TO_CHAR(p.fecha_cobro, 'YYYY-MM-DD') AS fecha_cobro,
        p.comprobante,
        c.nro_cuota,
        c.concepto,
        i.id_inmueble,
        i.clave_cliente,
        i.calle,
        i.numero,
        i.manzana,
        i.lote_catast_muni AS lote,
        i.lote_catast_muni,
        i.lote_catast_provincia,
        o.id_obra,
        o.nombre_obra AS obra_nombre,
        per.nombre_completo AS titular_nombre,
        per.cuit AS titular_cuit,
        CASE 
          WHEN p.fecha_cobro > CURRENT_DATE THEN 'EN_CARTERA'
          WHEN CURRENT_DATE <= (p.fecha_cobro + INTERVAL '30 days') THEN 'DISPONIBLE'
          ELSE 'VENCIDO'
        END AS estado_custodia,
        (p.fecha_cobro - CURRENT_DATE)::int AS dias_para_cobro
      FROM pagos p
      JOIN cuotas c ON c.id_cuota = p.id_cuota
      JOIN contratos con ON con.id_contrato = c.id_contrato
      JOIN inmuebles i ON i.id_inmueble = con.id_inmueble
      JOIN obras o ON o.id_obra = i.id_obra
      LEFT JOIN personas per ON per.id_persona = i.id_titular
      WHERE p.medio_pago IN ('CHEQUE', 'ECHEQ')
        AND ($1::int IS NULL OR o.id_obra = $1)
    `;

    const params: any[] = [idObra || null];

    if (estadoCustodia && estadoCustodia !== 'TODOS') {
      params.push(estadoCustodia);
      query += `
        AND (
          CASE 
            WHEN p.fecha_cobro > CURRENT_DATE THEN 'EN_CARTERA'
            WHEN CURRENT_DATE <= (p.fecha_cobro + INTERVAL '30 days') THEN 'DISPONIBLE'
            ELSE 'VENCIDO'
          END
        ) = $${params.length}
      `;
    }

    query += ` ORDER BY p.fecha_cobro ASC, p.id_pago ASC;`;

    const { rows } = await pool.query(query, params);
    return rows;
  }
}