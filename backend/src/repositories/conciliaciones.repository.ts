import { pool } from '../config/database';
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
    monto_actualizado: string | number;
    saldo_remanente: string | number;
    estado: EstadoCuota;
    concepto: string;
    periodo: string;
    id_contrato: number;
  }>> {
    const query = `
      SELECT 
        c.id_cuota, 
        c.nro_cuota, 
        c.monto_actualizado, 
        c.saldo_remanente,
        c.estado,
        c.concepto,
        c.periodo,
        c.id_contrato
      FROM cuotas c
      INNER JOIN contratos ct ON c.id_contrato = ct.id_contrato
      WHERE ct.id_inmueble = $1
        AND c.estado IN ('PENDIENTE', 'PAGO_PARCIAL')
      ORDER BY c.fecha_vencimiento ASC, c.nro_cuota ASC, c.id_cuota ASC;
    `;
    const res = await pool.query(query, [idInmueble]);
    return res.rows;
  }

  /**
   * Ejecuta la imputación atómica de pagos con bloqueo pesimista y arrastre futuro
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
        // Bloqueo pesimista sobre la cuota incluyendo saldo_remanente
        const cuotaQuery = `
          SELECT id_cuota, id_contrato, concepto, periodo, estado, monto_actualizado, saldo_remanente
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
        const saldoExigible = Number(cuota.saldo_remanente);
        const nuevoSaldo = Number(Math.max(0, saldoExigible - montoPagado).toFixed(2));

        if (montoPagado > saldoExigible + 0.01) {
          throw new Error(
            `El monto a imputar ($${montoPagado}) excede el saldo remanente de la cuota #${item.id_cuota} ($${saldoExigible}).`
          );
        }

        // Registro del pago
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

        // Estado según saldo remanente
        const nuevoEstado: EstadoCuota = nuevoSaldo <= 0.01 ? 'PAGADA' : 'PAGO_PARCIAL';

        // Actualización atómica de cuota (monto_actualizado NO se toca)
        await client.query(
          `UPDATE cuotas 
           SET saldo_remanente = $1, 
               estado = $2
           WHERE id_cuota = $3;`,
          [nuevoSaldo, nuevoEstado, item.id_cuota]
        );

        // Se eliminó la propagación a períodos futuros para no alterar cuotas subsiguientes

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
}