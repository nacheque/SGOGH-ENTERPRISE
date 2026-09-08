import { PoolClient } from 'pg';
import { pool } from '../config/database';
import {
  CreateInmuebleDTO,
  InmuebleResponseDTO,
  CreateInmuebleConPersonasDTO,
  PersonaInputDTO,
  InmuebleCompletoResponseDTO,
} from '../types/inmueble.types'; // Ajustar a 'inmueble.types' según corresponda

export class InmueblesRepository {
  /**
   * Consultar inmuebles uniendo obra, personas y la información del contrato emitido
   */
  async getAll(): Promise<InmuebleResponseDTO[]> {
    const query = `
      SELECT 
        i.id_inmueble,
        i.clave_cliente,
        i.id_obra,
        o.nombre_obra,
        o.precio_x_metro,
        o.costo_gabinete,
        i.id_frentista,
        pf.nombre_completo AS frentista_nombre,
        pf.dni AS frentista_dni,
        i.id_titular,
        pt.nombre_completo AS titular_nombre,
        pt.dni AS titular_dni,
        i.calle,
        i.numero,
        i.manzana,
        i.lote_catast_muni,
        i.lote_catast_provincia,
        i.metros_frente,
        i.conexion_gabinete,
        COALESCE(i.gabinete_colocado, FALSE) AS gabinete_colocado,
        i.observacion,
        
        -- Datos del Contrato Real
        c.id_contrato,
        c.plan_cuotas_obra,
        c.plan_cuotas_gabinete,
        c.tipo_indexacion,
        (
          SELECT cu.monto_base 
          FROM cuotas cu 
          WHERE cu.id_contrato = c.id_contrato AND cu.concepto = 'RED_OBRA' 
          ORDER BY cu.nro_cuota ASC 
          LIMIT 1
        ) AS cuota_base_obra,
        (
          SELECT cu.monto_base 
          FROM cuotas cu 
          WHERE cu.id_contrato = c.id_contrato AND cu.nro_cuota = 0 AND cu.concepto = 'ANTICIPO' 
          LIMIT 1
        ) AS monto_anticipo
      FROM inmuebles i
      INNER JOIN obras o ON i.id_obra = o.id_obra
      LEFT JOIN personas pf ON i.id_frentista = pf.id_persona
      LEFT JOIN personas pt ON i.id_titular = pt.id_persona
      LEFT JOIN contratos c ON c.id_inmueble = i.id_inmueble
      ORDER BY i.id_inmueble DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Alta básica de lote / inmueble
   */
  async create(data: CreateInmuebleDTO): Promise<InmuebleResponseDTO> {
    const query = `
      INSERT INTO inmuebles (
        clave_cliente,
        id_obra,
        id_frentista,
        id_titular,
        calle,
        numero,
        manzana,
        lote_catast_muni,
        lote_catast_provincia,
        metros_frente,
        conexion_gabinete,
        gabinete_colocado,
        observacion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const values = [
      data.clave_cliente,
      data.id_obra,
      data.id_frentista ?? null,
      data.id_titular ?? null,
      data.calle,
      data.numero ?? null,
      data.manzana ?? null,
      data.lote_catast_muni ?? null,
      data.lote_catast_provincia ?? null,
      data.metros_frente,
      data.conexion_gabinete ?? false,
      data.gabinete_colocado ?? false,
      data.observacion ?? null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Resuelve o inserta una persona dentro de la transacción activa
   */
  private async resolverPersonaTx(client: PoolClient, persona: PersonaInputDTO): Promise<number> {
    if (persona.dni || persona.cuit) {
      const checkQuery = `
        SELECT id_persona 
        FROM personas 
        WHERE ($1::varchar IS NOT NULL AND dni = $1)
           OR ($2::varchar IS NOT NULL AND cuit = $2)
        LIMIT 1;
      `;
      const res = await client.query(checkQuery, [persona.dni ?? null, persona.cuit ?? null]);
      if (res.rows.length > 0) {
        return res.rows[0].id_persona;
      }
    }

    const insertPersonaQuery = `
      INSERT INTO personas (
        nombre_completo,
        dni,
        cuit,
        telefono,
        email,
        domicilio_particular
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_persona;
    `;
    const values = [
      persona.nombre_completo.trim(),
      persona.dni?.trim() ?? null,
      persona.cuit?.trim() ?? null,
      persona.telefono?.trim() ?? null,
      persona.email?.trim() ?? null,
      persona.domicilio_particular?.trim() ?? null,
    ];

    const insertRes = await client.query(insertPersonaQuery, values);
    return insertRes.rows[0].id_persona;
  }

  /**
   * Alta atómica del inmueble con frentista y titular
   */
  async crearInmuebleCompleto(
    idObra: number,
    data: CreateInmuebleConPersonasDTO
  ): Promise<InmuebleCompletoResponseDTO> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const idFrentista = await this.resolverPersonaTx(client, data.frentista);

      let idTitular: number | null = null;
      if (data.titular?.es_mismo_frentista) {
        idTitular = idFrentista;
      } else if (data.titular?.datos && data.titular.datos.nombre_completo) {
        idTitular = await this.resolverPersonaTx(client, data.titular.datos);
      }

      const claveClienteFinal =
        data.clave_cliente?.trim() ||
        `OB${idObra}-MZ${data.manzana ? data.manzana.replace(/\s+/g, '') : '0'}-L${
          data.lote_catast_muni ? data.lote_catast_muni.replace(/\s+/g, '') : Date.now().toString().slice(-4)
        }`;

      const insertInmuebleQuery = `
        INSERT INTO inmuebles (
          id_obra,
          id_titular,
          id_frentista,
          clave_cliente,
          calle,
          numero,
          manzana,
          lote_catast_muni,
          lote_catast_provincia,
          metros_frente,
          conexion_gabinete,
          gabinete_colocado,
          observacion
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
      `;

      const valuesInmueble = [
        idObra,
        idTitular,
        idFrentista,
        claveClienteFinal,
        data.calle.trim(),
        data.numero?.trim() ?? null,
        data.manzana?.trim() ?? null,
        data.lote_catast_muni?.trim() ?? null,
        data.lote_catast_provincia?.trim() ?? null,
        data.metros_frente,
        data.conexion_gabinete ?? false,
        data.gabinete_colocado ?? false,
        data.observacion?.trim() ?? null,
      ];

      const resInmueble = await client.query(insertInmuebleQuery, valuesInmueble);

      await client.query('COMMIT');

      return resInmueble.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}