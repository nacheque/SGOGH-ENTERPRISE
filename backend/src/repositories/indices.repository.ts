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

    const coeficiente = Number((1 + data.porcentaje_variacion / 100).toFixed(6));

    // 1. Guardar o actualizar el índice del período
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

    // 2. Período anterior
    const [yearStr, monthStr] = data.periodo.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const prevDate = new Date(year, month - 2, 1);
    const prevPeriodo = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // 3. Paso A: Actualizar la cuota exacta del período con el índice nuevo
    const updateCuotaPeriodoQuery = `
      WITH base_calculo AS (
        SELECT 
          c.id_cuota,
          c.id_contrato,
          c.concepto,
          ROUND(
            (COALESCE(c_prev.monto_actualizado, c.monto_base) * $4)::numeric, 
            2
          ) AS nuevo_monto
        FROM cuotas c
        INNER JOIN contratos ct ON c.id_contrato = ct.id_contrato
        INNER JOIN inmuebles i ON ct.id_inmueble = i.id_inmueble
        LEFT JOIN cuotas c_prev ON c_prev.id_contrato = c.id_contrato 
                              AND c_prev.concepto = c.concepto
                              AND c_prev.periodo = $2
        WHERE i.id_obra = $1
          AND c.periodo = $3
          AND c.estado = 'PENDIENTE'
          AND c.concepto = 'RED_OBRA'
      )
      UPDATE cuotas c
      SET monto_actualizado = bc.nuevo_monto
      FROM base_calculo bc
      WHERE c.id_cuota = bc.id_cuota
      RETURNING c.id_contrato, c.concepto, c.monto_actualizado;
    `;

    const cuotasPeriodoRes = await client.query(updateCuotaPeriodoQuery, [
      data.id_obra,
      prevPeriodo,
      data.periodo,
      coeficiente,
    ]);

    // 4. Paso B: Arrastre en cascada hacia todas las cuotas PENDIENTES futuras
    // Las cuotas futuras (periodo > actual) heredan este nuevo valor actualizado como su base
    const updateCuotasFuturasQuery = `
      WITH valores_actualizados AS (
        SELECT DISTINCT ON (c.id_contrato, c.concepto)
          c.id_contrato,
          c.concepto,
          c.monto_actualizado AS nuevo_piso
        FROM cuotas c
        INNER JOIN contratos ct ON c.id_contrato = ct.id_contrato
        INNER JOIN inmuebles i ON ct.id_inmueble = i.id_inmueble
        WHERE i.id_obra = $1
          AND c.periodo = $2
          AND c.concepto = 'RED_OBRA'
      )
      UPDATE cuotas c
      SET monto_actualizado = va.nuevo_piso
      FROM valores_actualizados va
      WHERE c.id_contrato = va.id_contrato
        AND c.concepto = va.concepto
        AND c.periodo > $2
        AND c.estado = 'PENDIENTE'
      RETURNING c.id_cuota;
    `;

    const cuotasFuturasRes = await client.query(updateCuotasFuturasQuery, [
      data.id_obra,
      data.periodo,
    ]);

    await client.query('COMMIT');

    const totalAfectadas = (cuotasPeriodoRes.rowCount || 0) + (cuotasFuturasRes.rowCount || 0);

    return {
      indice: indiceGuardado,
      cuotas_actualizadas: totalAfectadas,
      mensaje: `Índice aplicado exitosamente. Se recalcularon ${totalAfectadas} cuotas pendientes (período actual y arrastre futuro).`,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
}