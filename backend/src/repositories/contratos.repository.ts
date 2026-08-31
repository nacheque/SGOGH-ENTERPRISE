import { pool } from '../config/database';
import { ContratoResponseDTO, CuotaInsertDTO } from '../types/contratos.types';

export class ContratosRepository {
  /**
   * Obtiene datos del inmueble y su obra asociada para el cálculo base
   */
  async getInmuebleConObra(id_inmueble: number): Promise<{
    id_inmueble: number;
    metros_frente: string | number;
    conexion_gabinete: boolean;
    precio_x_metro: string | number;
    costo_gabinete: string | number;
  } | null> {
    const query = `
      SELECT 
        i.id_inmueble,
        i.metros_frente,
        i.conexion_gabinete,
        o.precio_x_metro,
        o.costo_gabinete
      FROM inmuebles i
      INNER JOIN obras o ON i.id_obra = o.id_obra
      WHERE i.id_inmueble = $1;
    `;
    const result = await pool.query(query, [id_inmueble]);
    return result.rows[0] || null;
  }

  /**
   * Inserta contrato y genera cuotas masivamente dentro de una transacción SQL
   */
  async emitirContratoConCuotas(
    contratoData: {
      id_inmueble: number;
      plan_cuotas_obra: number;
      monto_total_obra: number;
      plan_cuotas_gabinete: number | null;
      monto_total_gabinete: number | null;
      fecha_alta: string;
      tipo_indexacion: string;
    },
    cuotas: CuotaInsertDTO[]
  ): Promise<ContratoResponseDTO> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insertar Contrato
      const insertContratoQuery = `
        INSERT INTO contratos (
          id_inmueble,
          plan_cuotas_obra,
          monto_total_obra,
          plan_cuotas_gabinete,
          monto_total_gabinete,
          fecha_alta,
          tipo_indexacion
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const contratoRes = await client.query(insertContratoQuery, [
        contratoData.id_inmueble,
        contratoData.plan_cuotas_obra,
        contratoData.monto_total_obra,
        contratoData.plan_cuotas_gabinete,
        contratoData.monto_total_gabinete,
        contratoData.fecha_alta,
        contratoData.tipo_indexacion,
      ]);

      const contratoCreado: ContratoResponseDTO = contratoRes.rows[0];
      const idContrato = contratoCreado.id_contrato;

      // 2. Insert Masivo de Cuotas
      if (cuotas.length > 0) {
        const valuePlaceholders: string[] = [];
        const flatValues: any[] = [];
        let paramIndex = 1;

        for (const cuota of cuotas) {
          valuePlaceholders.push(
            `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`
          );
          flatValues.push(
            idContrato,
            cuota.concepto,
            cuota.nro_cuota,
            cuota.periodo,
            cuota.monto_base,
            cuota.monto_actualizado,
            cuota.fecha_vencimiento,
            cuota.estado
          );
          paramIndex += 8;
        }

        const insertCuotasQuery = `
          INSERT INTO cuotas (
            id_contrato,
            concepto,
            nro_cuota,
            periodo,
            monto_base,
            monto_actualizado,
            fecha_vencimiento,
            estado
          )
          VALUES ${valuePlaceholders.join(', ')};
        `;

        await client.query(insertCuotasQuery, flatValues);
      }

      await client.query('COMMIT');

      return {
        ...contratoCreado,
        cuotas_generadas: cuotas.length,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getById(id_contrato: number): Promise<any> {
    const query = `
      SELECT 
        c.*,
        i.clave_cliente,
        i.calle,
        i.numero
      FROM contratos c
      INNER JOIN inmuebles i ON c.id_inmueble = i.id_inmueble
      WHERE c.id_contrato = $1;
    `;
    const result = await pool.query(query, [id_contrato]);
    return result.rows[0] || null;
  }
}