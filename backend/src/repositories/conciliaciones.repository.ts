import { pool } from '../config/database';
import { PoolClient } from 'pg';
import { EstadoCuota } from '../types/contratos.types';
import { PagoConfirmarDTO } from '../types/conciliaciones.types';

export class ConciliacionesRepository {
  /**
   * Busca inmueble y frentista por clave_cliente (Solo lectura)
   */
  async findInmuebleByClave(claveCliente: string): Promise<{ id_inmueble: number; frentista: string | null } | null> {
    const query = `
      SELECT i.id_inmueble, pf.nombre_completo AS frentista
      FROM inmuebles i
      LEFT JOIN personas pf ON i.id_frentista = pf.id_persona
      WHERE i.clave_cliente = $1
      LIMIT 1;
    `;
    const res = await pool.query(query, [claveCliente]);
    return res.rows[0] || null;
  }

  /**
   * Verifica existencia previa del pago exacto para evitar duplicidad
   */
  async existePagoDuplicado(idInmueble: number, fechaPago: string, monto: number): Promise<boolean> {
    const query = `
      SELECT p.id_pago 
      FROM pagos p
      INNER JOIN cuotas c ON p.id_cuota = c.id_cuota
      INNER JOIN contratos ct ON c.id_contrato = ct.id_contrato
      WHERE ct.id_inmueble = $1
        AND p.fecha_pago = $2
        AND p.monto = $3
      LIMIT 1;
    `;
    const res = await pool.query(query, [idInmueble, fechaPago, monto]);
    return res.rows.length > 0;
  }

  /**
   * Obtiene todas las cuotas exigibles ordenadas cronológicamente para cascada
   */
  async findCuotasExigiblesByInmueble(idInmueble: number): Promise<Array<{
    id_cuota: number;
    nro_cuota: number;
    monto_base: string | number;
    monto_actualizado: string | number;
    saldo_remanente: string | number;
    porcentaje_actualizacion: number;
    estado: EstadoCuota;
    concepto: string;
    periodo: string;
    id_contrato: number;
  }>> {
    const query = `
      SELECT 
      c.id_cuota, 
      c.nro_cuota, 
      c.monto_base,
      c.monto_actualizado, 
      c.saldo_remanente,
      CAST(COALESCE(c.porcentaje_actualizacion, 0.00) AS FLOAT) AS porcentaje_actualizacion,
      c.estado,
      c.concepto,
      c.periodo,
      c.id_contrato
    FROM cuotas c
    INNER JOIN contratos ct ON c.id_contrato = ct.id_contrato
    WHERE ct.id_inmueble = $1
      AND c.concepto = 'RED_OBRA'
      AND c.estado IN ('PENDIENTE', 'PAGO_PARCIAL')
    ORDER BY c.fecha_vencimiento ASC, c.nro_cuota ASC, c.id_cuota ASC;
    `;
    const res = await pool.query(query, [idInmueble]);
    return res.rows;
  }

  /**
   * Obtiene el piso base encadenado (monto_actualizado de la cuota anterior inmediata del mismo concepto).
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

  /**
   * Ejecuta la imputación atómica de pagos respetando la inferencia de índices y remanentes
   */
  async imputarLoteTransaccional(pagos: PagoConfirmarDTO[]): Promise<Array<{
    id_pago: number;
    id_cuota: number;
    monto: number;
    nuevo_estado: EstadoCuota;
  }>> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const resultados = [];

      for (const item of pagos) {
        // 1. Bloqueo pesimista sobre la cuota
        const cuotaQuery = `
          SELECT 
            id_cuota, 
            id_contrato, 
            concepto, 
            nro_cuota,
            periodo, 
            estado, 
            monto_base,
            monto_actualizado, 
            saldo_remanente,
            COALESCE(porcentaje_actualizacion, 0.00) AS porcentaje_actualizacion
          FROM cuotas
          WHERE id_cuota = $1
          FOR UPDATE;
        `;
        const resCuota = await client.query(cuotaQuery, [item.id_cuota]);

        if (resCuota.rows.length === 0) {
          throw new Error(`La cuota #${item.id_cuota} no existe.`);
        }

        const cuota = resCuota.rows[0];

        if (cuota.estado === 'PAGADA') {
          throw new Error(`La cuota #${item.id_cuota} ya se encuentra totalmente abonada.`);
        }

        const montoPagado = Number(item.monto);
        let porcentajeFinal = Number(cuota.porcentaje_actualizacion);
        let montoActualizadoFinal = Number(cuota.monto_actualizado);
        let nuevoSaldo = 0;
        let nuevoEstado: EstadoCuota = 'PAGADA';

        // 2. Lógica contable e inferencia de índice
        if (cuota.estado === 'PAGO_PARCIAL') {
          // El índice ya se fijó previamente; imputamos directo contra saldo_remanente
          const remanenteActual = Number(cuota.saldo_remanente);
          if (montoPagado > remanenteActual + 0.01) {
            throw new Error(
              `El monto ($${montoPagado}) excede el saldo remanente ($${remanenteActual}) de la cuota #${item.id_cuota}.`
            );
          }
          nuevoSaldo = Number(Math.max(0, remanenteActual - montoPagado).toFixed(2));
          nuevoEstado = nuevoSaldo <= 0.01 ? 'PAGADA' : 'PAGO_PARCIAL';
        } else {
          // Cuota PENDIENTE: buscar piso base encadenado
          const pisoBase = await this.obtenerPisoBase(
            client,
            cuota.id_contrato,
            cuota.concepto,
            Number(cuota.nro_cuota),
            Number(cuota.monto_base)
          );

          if (montoPagado >= pisoBase) {
            // Se infiere el índice por el excedente sobre el piso base
            porcentajeFinal = Number((((montoPagado / pisoBase) - 1) * 100).toFixed(2));
            montoActualizadoFinal = montoPagado;
            nuevoSaldo = 0;
            nuevoEstado = 'PAGADA';
          } else {
            // Cobro parcial inferior al piso base
            porcentajeFinal = 0.00;
            montoActualizadoFinal = pisoBase;
            nuevoSaldo = Number((pisoBase - montoPagado).toFixed(2));
            nuevoEstado = 'PAGO_PARCIAL';
          }
        }

        // 3. Registrar el comprobante en tabla pagos
        const comprobanteRef = `SIRO-${item.clave_cliente}-${item.fecha_pago.replace(/-/g, '')}`;
        const insertPagoQuery = `
          INSERT INTO pagos (
            id_cuota,
            monto,
            fecha_pago,
            medio_pago,
            comprobante
          )
          VALUES ($1, $2, $3, 'SIRO_ROELA', $4)
          RETURNING id_pago;
        `;
        const resPago = await client.query(insertPagoQuery, [
          item.id_cuota,
          montoPagado,
          item.fecha_pago,
          comprobanteRef,
        ]);
        const idPago = resPago.rows[0].id_pago;

        // 4. Actualización atómica de la cuota
        await client.query(
          `UPDATE cuotas 
           SET porcentaje_actualizacion = $1,
               monto_actualizado = $2,
               saldo_remanente = $3, 
               estado = $4
           WHERE id_cuota = $5;`,
          [porcentajeFinal, montoActualizadoFinal, nuevoSaldo, nuevoEstado, item.id_cuota]
        );

        resultados.push({
          id_pago: idPago,
          id_cuota: item.id_cuota,
          monto: montoPagado,
          nuevo_estado: nuevoEstado,
        });
      }

      await client.query('COMMIT');
      return resultados;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
 * Obtiene el piso base encadenado para una cuota de RED_OBRA
 */
async findPisoBaseCuota(idContrato: number, nroCuota: number, montoBaseActual: number): Promise<number> {
  if (nroCuota <= 1) {
    return montoBaseActual;
  }

  const query = `
    SELECT monto_actualizado 
    FROM cuotas 
    WHERE id_contrato = $1 
      AND concepto = 'RED_OBRA' 
      AND nro_cuota < $2 
    ORDER BY nro_cuota DESC 
    LIMIT 1;
  `;
  const res = await pool.query(query, [idContrato, nroCuota]);

  if (res.rows.length > 0 && res.rows[0].monto_actualizado !== null) {
    return Number(res.rows[0].monto_actualizado);
  }

  return montoBaseActual;
}
}