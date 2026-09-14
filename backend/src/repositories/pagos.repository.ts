import { pool } from '../config/database';
import { CreatePagoDTO, PagoResponseDTO, CuotaConPagoDTO } from '../types/pagos.types';
import { EstadoCuota } from '../types/contratos.types';

export class PagosRepository {
  async registrarPagoTransaccional(data: CreatePagoDTO): Promise<PagoResponseDTO> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Obtener cuota con bloqueo concurrente (FOR UPDATE)
      const cuotaQuery = `
        SELECT id_cuota, id_contrato, concepto, periodo, estado, monto_actualizado, saldo_remanente 
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

      const montoAPagar = Number(data.monto);
      if (isNaN(montoAPagar) || montoAPagar <= 0) {
        throw new Error('El importe de pago debe ser superior a 0.');
      }

      // La exigibilidad real de cobro es el saldo_remanente
      const saldoExigible = Number(cuota.saldo_remanente);
      const nuevoSaldo = Number(Math.max(0, saldoExigible - montoAPagar).toFixed(2));

      if (montoAPagar > saldoExigible + 0.01) {
        throw new Error(
          `El monto ingresado ($${montoAPagar.toFixed(2)}) supera el saldo remanente ($${saldoExigible.toFixed(2)}).`
        );
      }

      // 2. Insertar comprobante de pago
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
        data.medio_pago,
        data.comprobante ?? null,
      ]);

      // 3. Determinar nuevo estado según el saldo remanente
      const nuevoEstado: EstadoCuota = nuevoSaldo <= 0.01 ? 'PAGADA' : 'PAGO_PARCIAL';

      // 4. Actualizar ÚNICAMENTE saldo_remanente y estado
      // monto_actualizado permanece intacto como valor nominal contractual
      const updateCuotaQuery = `
        UPDATE cuotas 
        SET 
          saldo_remanente = $1,
          estado = $2
        WHERE id_cuota = $3;
      `;
      await client.query(updateCuotaQuery, [nuevoSaldo, nuevoEstado, data.id_cuota]);

      // NOTA: Se eliminó definitivamente la propagación de montos a cuotas futuras.
      // Los cobros no deben alterar los períodos subsiguientes.

      await client.query('COMMIT');

      return pagoRes.rows[0];
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