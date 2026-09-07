import { pool } from '../config/database';
import { CreatePagoDTO, PagoResponseDTO, CuotaConPagoDTO } from '../types/pagos.types';

export class PagosRepository {
  async registrarPagoTransaccional(data: CreatePagoDTO): Promise<PagoResponseDTO> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Validar y obtener datos completos de la cuota con bloqueo FOR UPDATE
      const cuotaQuery = `
        SELECT id_cuota, id_contrato, concepto, periodo, estado 
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

      // 2. Insertar pago en la tabla pagos
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
        data.monto,
        fechaPagoFinal,
        data.medio_pago,
        data.comprobante ?? null,
      ]);

      // 3. Actualizar estado y monto_actualizado de la cuota pagada
      const updateCuotaQuery = `
        UPDATE cuotas 
        SET 
          estado = 'PAGADA',
          monto_actualizado = $2
        WHERE id_cuota = $1;
      `;
      await client.query(updateCuotaQuery, [data.id_cuota, data.monto]);

      // 4. Propagar arrastre acumulativo: actualizar monto_actualizado a cuotas PENDIENTES futuras
      const updateCuotasFuturasQuery = `
        UPDATE cuotas 
        SET monto_actualizado = $1 
        WHERE id_contrato = $2 
          AND concepto = $3 
          AND periodo > $4 
          AND estado = 'PENDIENTE';
      `;
      await client.query(updateCuotasFuturasQuery, [
        data.monto,
        cuota.id_contrato,
        cuota.concepto,
        cuota.periodo,
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
        c.fecha_vencimiento,
        c.estado,
        p.id_pago,
        p.monto,
        p.fecha_pago,
        p.medio_pago,
        p.comprobante
      FROM cuotas c
      INNER JOIN contratos ct ON c.id_contrato = ct.id_contrato
      INNER JOIN inmuebles i ON ct.id_inmueble = i.id_inmueble
      LEFT JOIN pagos p ON c.id_cuota = p.id_cuota
      WHERE i.id_inmueble = $1
      ORDER BY c.fecha_vencimiento ASC, c.concepto ASC;
    `;
    const result = await pool.query(query, [id_inmueble]);
    return result.rows;
  }
}