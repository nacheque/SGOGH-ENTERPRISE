import { Pool, PoolClient } from 'pg';
import { PadronImportItemDTO } from '../types/padronImport.types';

export class PadronImportRepository {
  constructor(private pool: Pool) {}

  /**
   * Obtiene todas las claves de clientes registradas para una obra
   */
  async findClavesExistentesByObraId(idObra: number): Promise<Set<string>> {
    const query = `
      SELECT clave_cliente 
      FROM inmuebles 
      WHERE id_obra = $1;
    `;
    const res = await this.pool.query(query, [idObra]);
    return new Set(res.rows.map((r) => String(r.clave_cliente).trim()));
  }

  /**
   * Importación en bloque bajo una única transacción ACID
   */
  async importarLoteInmuebles(idObra: number, items: PadronImportItemDTO[]): Promise<number> {
    const client: PoolClient = await this.pool.connect();

    try {
      await client.query('BEGIN');

      let insertados = 0;

      for (const item of items) {
        // a) Resolver Titular (si no viene, toma frentista_nombre)
        const nombreTitular = (item.titular_nombre || item.frentista_nombre || '').trim();

        const idTitular = await this.resolverPersona(client, {
          nombre_completo: nombreTitular,
          dni: item.titular_dni,
          cuit: item.titular_cuit,
          telefono: item.titular_telefono,
          email: item.titular_email,
          domicilio_particular: item.titular_domicilio || null,
        });

        // b) Resolver Frentista
        let idFrentista = idTitular;
        const nombreFrentista = (item.frentista_nombre || '').trim();
        const tieneFrentistaDiferenciado =
          nombreFrentista !== '' &&
          nombreFrentista.toUpperCase() !== nombreTitular.toUpperCase();

        if (tieneFrentistaDiferenciado) {
          idFrentista = await this.resolverPersona(client, {
            nombre_completo: nombreFrentista,
            dni: null,
            cuit: null,
            telefono: null,
            email: null,
            domicilio_particular: null,
          });
        }

        // c) Inserción del Inmueble
        const queryInmueble = `
          INSERT INTO inmuebles (
            clave_cliente,
            id_obra,
            id_titular,
            id_frentista,
            manzana,
            lote_catast_muni,
            lote_catast_provincia,
            calle,
            numero,
            metros_frente,
            conexion_gabinete,
            gabinete_colocado,
            observacion
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
        `;

        await client.query(queryInmueble, [
          item.clave_cliente,
          idObra,
          idTitular,
          idFrentista,
          item.manzana,
          item.lote_catast_muni,
          item.lote_catast_provincia,
          item.calle,
          item.numero,
          item.metros_frente,
          item.conexion_gabinete,
          item.gabinete_colocado,
          item.observacion,
        ]);

        insertados++;
      }

      await client.query('COMMIT');
      return insertados;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Resuelve persona reutilizando por CUIT/DNI o insertando una nueva
   */
  private async resolverPersona(
    client: PoolClient,
    data: {
      nombre_completo: string;
      dni: string | null;
      cuit: string | null;
      telefono: string | null;
      email: string | null;
      domicilio_particular: string | null;
    }
  ): Promise<number> {
    const dni = data.dni ? data.dni.trim() : null;
    const cuit = data.cuit ? data.cuit.trim() : null;

    if (cuit || dni) {
      const searchRes = await client.query(
        `SELECT id_persona, telefono, email FROM personas WHERE (cuit IS NOT NULL AND cuit = $1) OR (dni IS NOT NULL AND dni = $2) LIMIT 1;`,
        [cuit, dni]
      );

      if (searchRes.rows.length > 0) {
        const existente = searchRes.rows[0];
        // Actualización no destructiva de contacto si estaban en NULL
        if ((!existente.telefono && data.telefono) || (!existente.email && data.email)) {
          await client.query(
            `UPDATE personas SET 
              telefono = COALESCE(telefono, $1), 
              email = COALESCE(email, $2) 
             WHERE id_persona = $3;`,
            [data.telefono, data.email, existente.id_persona]
          );
        }
        return existente.id_persona;
      }
    }

    const insertRes = await client.query(
      `
      INSERT INTO personas (
        nombre_completo,
        dni,
        cuit,
        telefono,
        email,
        domicilio_particular
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_persona;
      `,
      [
        data.nombre_completo,
        dni,
        cuit,
        data.telefono ? data.telefono.trim() : null,
        data.email ? data.email.trim() : null,
        data.domicilio_particular ? data.domicilio_particular.trim() : null,
      ]
    );

    return insertRes.rows[0].id_persona;
  }
}