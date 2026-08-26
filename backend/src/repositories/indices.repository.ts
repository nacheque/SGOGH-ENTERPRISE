import { pool } from '../config/database';
import {
  CreateIndiceDTO,
  IndiceActualizacionResponseDTO,
  RegistroIndiceResultadoDTO,
} from '../types/indices.types';

export class IndicesRepository {
  /**
   * Obtiene el histórico de índices de actualización asociados a una obra.
   */
  async getByObra(id_obra: number): Promise<IndiceActualizacionResponseDTO[]> {
    const query = `
      SELECT 
        id_indice,
        id_obra,
        periodo,
        coeficiente_incremento
      FROM indice_actualizacion
      WHERE id_obra = $1
      ORDER BY periodo ASC;
    `;
    const result = await pool.query(query, [id_obra]);
    return result.rows;
  }

  /**
   * Registra el índice del período y recalcula en cascada las cuotas pendientes de la obra.
   * Ejecutado atómicamente con BEGIN / COMMIT / ROLLBACK.
   */
  async createAndApplyIndice(data: CreateIndiceDTO): Promise<RegistroIndiceResultadoDTO> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Calcular el multiplicador del coeficiente (Ej: 1.99% -> 1.0199)
      const coeficiente = Number((1 + data.porcentaje_variacion / 100).toFixed(6));

      // 2. Insertar o actualizar el índice del período para la obra
      const insertIndiceQuery = `
        INSERT INTO indice_actualizacion (
          id_obra,
          periodo,
          coeficiente_incremento
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (id_obra, periodo)
        DO UPDATE SET 
          coeficiente_incremento = EXCLUDED.coeficiente_incremento
        RETURNING *;
      `;
      const indiceResult = await client.query(insertIndiceQuery, [
        data.id_obra,
        data.periodo,
        coeficiente,
      ]);
      const indiceGuardado: IndiceActualizacionResponseDTO = indiceResult.rows[0];

      // 3. Obtener el periodo anterior en formato 'YYYY-MM'
      const [yearStr, monthStr] = data.periodo.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      
      const prevDate = new Date(year, month - 2, 1);
      const prevPeriodo = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      // 4. Actualizar las cuotas 'PENDIENTES' del período de la obra en base a:
      //    - El monto actualizado del período anterior (si existe), o
      //    - El monto base original de la cuota.
      const updateCuotasQuery = `
        WITH cuotas_target AS (
          SELECT 
            c.id_cuota,
            c.id_contrato,
            c.monto_base,
            c_prev.monto_actualizado AS monto_previo
          FROM cuotas c
          INNER JOIN contratos ct ON c.id_contrato = ct.id_contrato
          INNER JOIN inmuebles i ON ct.id_inmueble = i.id_inmueble
          LEFT JOIN cuotas c_prev ON c_prev.id_contrato = c.id_contrato 
                                AND c_prev.concepto = c.concepto
                                AND c_prev.periodo = $2
          WHERE i.id_obra = $1
            AND c.periodo = $3
            AND c.estado = 'PENDIENTE'
        )
        UPDATE cuotas c
        SET monto_actualizado = ROUND(
          (COALESCE(ct.monto_previo, c.monto_base) * $4)::numeric, 
          2
        )
        FROM cuotas_target ct
        WHERE c.id_cuota = ct.id_cuota
        RETURNING c.id_cuota;
      `;

      const updateResult = await client.query(updateCuotasQuery, [
        data.id_obra,
        prevPeriodo,
        data.periodo,
        coeficiente,
      ]);

      await client.query('COMMIT');

      return {
        indice: indiceGuardado,
        cuotas_actualizadas: updateResult.rowCount || 0,
        mensaje: `Índice aplicado exitosamente. Se recalcularon ${updateResult.rowCount || 0} cuotas pendientes.`,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}