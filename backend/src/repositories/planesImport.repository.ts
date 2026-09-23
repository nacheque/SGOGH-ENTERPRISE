import { Pool, PoolClient } from 'pg';
import { FilaPlanConfirmarDTO, ConfirmarPlanesResponseDTO } from '../types/planesImport.type';

export interface InmueblePreviewRow {
  id_inmueble: number;
  calle: string | null;
  numero: string | null;
  manzana: string | null;
  metros_frente: number;
  conexion_gabinete: boolean;
  titular_nombre: string | null;
  precio_x_metro: number;
  costo_gabinete: number;
}

export class PlanesImportRepository {
  constructor(private pool: Pool) {}

  /**
   * Obtiene datos del lote, titular y costos de obra para el preview
   */
  async obtenerInmuebleParaPreview(idObra: number, claveCliente: string): Promise<InmueblePreviewRow | null> {
    const query = `
      SELECT 
        i.id_inmueble, 
        i.calle, 
        i.numero, 
        i.manzana, 
        i.metros_frente, 
        i.conexion_gabinete,
        p.nombre_completo AS titular_nombre,
        o.precio_x_metro, 
        o.costo_gabinete
      FROM inmuebles i
      JOIN obras o ON o.id_obra = i.id_obra
      LEFT JOIN personas p ON p.id_persona = i.id_titular
      WHERE i.id_obra = $1 AND i.clave_cliente = $2
      LIMIT 1;
    `;
    const { rows } = await this.pool.query(query, [idObra, claveCliente]);
    return rows[0] || null;
  }

  /**
   * Chequea si el inmueble ya posee un contrato activo o previo
   */
  async existeContratoParaInmueble(idInmueble: number): Promise<boolean> {
    const query = `SELECT 1 FROM contratos WHERE id_inmueble = $1 LIMIT 1;`;
    const { rows } = await this.pool.query(query, [idInmueble]);
    return rows.length > 0;
  }

  /**
   * Ejecuta la confirmación atómica bajo una única transacción ACID
   */
  async confirmarPlanesTx(
    idObra: number,
    filas: FilaPlanConfirmarDTO[],
    calcularVencimientoFn: (fechaBase: string, mesesASumar: number) => string
  ): Promise<ConfirmarPlanesResponseDTO> {
    const client: PoolClient = await this.pool.connect();
    let totalContratos = 0;
    let totalCuotas = 0;

    try {
      await client.query('BEGIN');

      for (const fila of filas) {
        // 1. Bloqueo pesimista y verificación de pertenencia a la obra
        const { rows: inmRows } = await client.query(
          `SELECT id_inmueble, conexion_gabinete 
            FROM inmuebles 
            WHERE id_inmueble = $1 AND id_obra = $2 
            FOR UPDATE;`,
          [fila.id_inmueble, idObra]
        );

        if (inmRows.length === 0) {
          throw new Error(`El inmueble con ID ${fila.id_inmueble} no pertenece a la obra o no existe.`);
        }

        const inm = inmRows[0];
        const tieneConexionGabinete = Boolean(inm.conexion_gabinete);
        const cuotasGabinete = Number(fila.plan_cuotas_gabinete) || 0;

        if (tieneConexionGabinete && cuotasGabinete <= 0) {
          throw new Error(
            `Inmueble clave ${fila.clave_cliente}: Requiere conexión a gabinete: las cuotas de gabinete deben ser al menos 1.`
          );
        }

        if (!tieneConexionGabinete && cuotasGabinete > 0) {
          throw new Error(
            `Inmueble clave ${fila.clave_cliente}: El inmueble no posee conexión a gabinete configurada en el padrón.`
          );
        }

        // 2. Control anti-concurrencia de contrato
        const { rows: contratoExistente } = await client.query(
          `SELECT id_contrato FROM contratos WHERE id_inmueble = $1;`,
          [fila.id_inmueble]
        );

        if (contratoExistente.length > 0) {
          throw new Error(`El inmueble clave ${fila.clave_cliente} ya tiene un contrato generado.`);
        }

        // 3. Inserción de Contrato
        const insertContratoQuery = `
          INSERT INTO contratos (
            id_inmueble,
            plan_cuotas_obra,
            monto_total_obra,
            plan_cuotas_gabinete,
            monto_total_gabinete,
            fecha_alta,
            tipo_indexacion
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6)
          RETURNING id_contrato;
        `;
        const { rows: resContrato } = await client.query(insertContratoQuery, [
          fila.id_inmueble,
          fila.plan_cuotas_obra,
          fila.monto_total_obra,
          fila.plan_cuotas_gabinete,
          fila.monto_total_gabinete,
          fila.tipo_contrato, // guarda 'VARIABLE_ICC' o 'FIJO'
        ]);

        const idContrato = resContrato[0].id_contrato;
        totalContratos++;

        // 4. Generación y Acumulación de Cuotas para Bulk Insert
        const cuotasValues: any[] = [];
        const cuotasPlaceholders: string[] = [];
        let paramIdx = 1;

        // Anticipo (Cuota 0) si corresponde
        if (fila.monto_anticipo > 0) {
          const periodoAnticipo = fila.fecha_inicio.substring(0, 7); // 'YYYY-MM'
          cuotasPlaceholders.push(
            `($${paramIdx++}, 0, 'ANTICIPO', $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, 0, 'PENDIENTE')`
          );
          cuotasValues.push(
            idContrato,
            periodoAnticipo,
            fila.fecha_inicio,
            fila.monto_anticipo,
            fila.monto_anticipo,
            fila.monto_anticipo
          );
          totalCuotas++;
        }

        // Cuotas mensuales de obra
        const capitalAFinanciar = Math.max(0, fila.monto_total_obra - fila.monto_anticipo);
        const valorCuotaObra = Number((capitalAFinanciar / fila.plan_cuotas_obra).toFixed(2));

        for (let c = 1; c <= fila.plan_cuotas_obra; c++) {
          const fechaVenc = calcularVencimientoFn(fila.fecha_inicio, c - 1);
          const periodoCuota = fechaVenc.substring(0, 7); // 'YYYY-MM'
          cuotasPlaceholders.push(
            `($${paramIdx++}, $${paramIdx++}, 'RED_OBRA', $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, 0, 'PENDIENTE')`
          );
          cuotasValues.push(
            idContrato,
            c,
            periodoCuota,
            fechaVenc,
            valorCuotaObra,
            valorCuotaObra,
            valorCuotaObra
          );
          totalCuotas++;
        }

        // 5. Cuotero: GABINETE
        if (fila.plan_cuotas_gabinete > 0 && fila.monto_total_gabinete > 0) {
          const valorCuotaGabinete = Number((fila.monto_total_gabinete / fila.plan_cuotas_gabinete).toFixed(2));
          for (let g = 1; g <= fila.plan_cuotas_gabinete; g++) {
            const fechaVencGab = calcularVencimientoFn(fila.fecha_inicio, g - 1);
            const periodoGab = fechaVencGab.substring(0, 7); // 'YYYY-MM'
            cuotasPlaceholders.push(
              `($${paramIdx++}, $${paramIdx++}, 'GABINETE', $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, 0, 'PENDIENTE')`
            );
            cuotasValues.push(
              idContrato,
              g,
              periodoGab,
              fechaVencGab,
              valorCuotaGabinete,
              valorCuotaGabinete,
              valorCuotaGabinete
            );
            totalCuotas++;
          }
        }

        // Ejecución en un ÚNICO viaje a PostgreSQL
        if (cuotasPlaceholders.length > 0) {
          const bulkInsertCuotasQuery = `
            INSERT INTO cuotas (
              id_contrato,
              nro_cuota,
              concepto,
              periodo,
              fecha_vencimiento,
              monto_base,
              monto_actualizado,
              saldo_remanente,
              porcentaje_actualizacion,
              estado
            ) VALUES ${cuotasPlaceholders.join(', ')};
          `;
          await client.query(bulkInsertCuotasQuery, cuotasValues);
        }
      }

      await client.query('COMMIT');

      return {
        ok: true,
        mensaje: 'Planes de financiación y cuoteros importados exitosamente.',
        total_contratos_creados: totalContratos,
        total_cuotas_generadas: totalCuotas,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}