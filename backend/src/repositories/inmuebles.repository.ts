import { PoolClient } from 'pg';
import { pool } from '../config/database';
import {
  CreateInmuebleDTO,
  InmuebleResponseDTO,
  CreateInmuebleConPersonasDTO,
  PersonaInputDTO,
  InmuebleCompletoResponseDTO,
  UpdateInmuebleDTO,
  UpdateInmuebleResponseDTO,
} from '../types/inmueble.types';

export class AppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = 'AppError';
  }
}

export class InmueblesRepository {
  /**
   * Generación de clave_cliente según planilla real de cobranzas:
   * Si es manual: se respeta sin espacios.
   * Si es automática: Manzana limpia + Correlativo (COUNT + 1)
   */
  private async resolverClaveCliente(
    claveManual: string | null | undefined,
    idObra: number,
    manzana: string | null | undefined,
    client: PoolClient
  ): Promise<string> {
    // 1. Si el operador cargó la clave manual, se limpia y se respeta tal cual
    if (claveManual && claveManual.trim().length > 0) {
      return claveManual.trim().replace(/\s+/g, '');
    }

    // 2. Normalizar la manzana (solo dígitos numéricos limpios)
    const mzLimpia = manzana ? manzana.replace(/\D/g, '') : '';
    const prefijoManzana = mzLimpia.length > 0 ? mzLimpia : String(idObra);

    // 3. Obtener el número correlativo siguiente para esa manzana dentro de la obra
    const queryCorrelativo = `
      SELECT COUNT(*)::int + 1 AS proximo 
      FROM inmuebles 
      WHERE id_obra = $1 
        ${mzLimpia ? "AND REPLACE(manzana, ' ', '') = $2" : ''}
    `;
    const params = mzLimpia ? [idObra, manzana?.trim() ?? null] : [idObra];
    const res = await client.query(queryCorrelativo, params);
    const nroCorrelativo = res.rows[0].proximo;

    // 4. Concatenación pura según planilla real: MZA + N° (Ej: "47" + "1" -> "471", "47" + "12" -> "4712")
    return `${prefijoManzana}${nroCorrelativo}`;
  }

  /**
   * Resuelve o inserta una persona dentro de la transacción activa (para altas de inmuebles)
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
   * Resuelve la búsqueda, actualización in-place o inserción de una persona en el flujo de edición
   */
  private async resolverPersonaUpdateTx(
    client: PoolClient,
    personaData: PersonaInputDTO,
    idPersonaActual: number | null
  ): Promise<number> {
    const dni = personaData.dni?.trim() || null;
    const cuit = personaData.cuit?.trim() || null;
    const nombreCompleto = personaData.nombre_completo.trim();
    const telefono = personaData.telefono?.trim() || null;
    const email = personaData.email?.trim() || null;
    const domicilio = personaData.domicilio_particular?.trim() || null;

    // a) Si tiene DNI o CUIT, buscar si ya existe alguien con ese documento
    if (dni || cuit) {
      const { rows } = await client.query(
        `SELECT id_persona, telefono, email, domicilio_particular 
         FROM personas 
         WHERE (cuit IS NOT NULL AND cuit = $1) OR (dni IS NOT NULL AND dni = $2) 
         LIMIT 1;`,
        [cuit, dni]
      );

      if (rows.length > 0) {
        const encontrada = rows[0];
        await client.query(
          `UPDATE personas SET
            telefono = COALESCE($1, telefono),
            email = COALESCE($2, email),
            domicilio_particular = COALESCE($3, domicilio_particular)
           WHERE id_persona = $4;`,
          [telefono, email, domicilio, encontrada.id_persona]
        );
        return encontrada.id_persona;
      }
    }

    // b) Si no existe nadie con ese documento:
    // Si ya tenía asignada una persona previa, verificar si se trata de una corrección in-place
    if (idPersonaActual) {
      const { rows: personaActualRows } = await client.query(
        `SELECT id_persona, dni, cuit FROM personas WHERE id_persona = $1;`,
        [idPersonaActual]
      );

      if (personaActualRows.length > 0) {
        const actual = personaActualRows[0];
        const mismoDni = (!dni && !actual.dni) || dni === actual.dni;
        const mismoCuit = (!cuit && !actual.cuit) || cuit === actual.cuit;

        // Si los documentos coinciden o no estaban seteados, es una corrección directa
        if (mismoDni && mismoCuit) {
          await client.query(
            `UPDATE personas SET
              nombre_completo = $1,
              dni = COALESCE($2, dni),
              cuit = COALESCE($3, cuit),
              telefono = COALESCE($4, telefono),
              email = COALESCE($5, email),
              domicilio_particular = COALESCE($6, domicilio_particular)
             WHERE id_persona = $7;`,
            [nombreCompleto, dni, cuit, telefono, email, domicilio, idPersonaActual]
          );
          return idPersonaActual;
        }
      }
    }

    // c) Si el DNI/CUIT es nuevo o no tenía persona previa asignada, crear nuevo registro
    const { rows: insertRows } = await client.query(
      `INSERT INTO personas (
        nombre_completo,
        dni,
        cuit,
        telefono,
        email,
        domicilio_particular
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_persona;`,
      [nombreCompleto, dni, cuit, telefono, email, domicilio]
    );

    return insertRows[0].id_persona;
  }

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
   * Alta básica individual de lote / inmueble
   */
  async create(data: CreateInmuebleDTO): Promise<InmuebleResponseDTO> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const claveFinal = await this.resolverClaveCliente(
        data.clave_cliente,
        data.id_obra,
        data.manzana,
        client
      );

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
        claveFinal,
        data.id_obra,
        data.id_frentista ?? null,
        data.id_titular ?? null,
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

      const result = await client.query(query, values);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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

      // 1. Resolver Frentista
      const idFrentista = await this.resolverPersonaTx(client, data.frentista);

      // 2. Resolver Titular
      let idTitular: number | null = null;
      if (data.titular?.es_mismo_frentista) {
        idTitular = idFrentista;
      } else if (data.titular?.datos && data.titular.datos.nombre_completo) {
        idTitular = await this.resolverPersonaTx(client, data.titular.datos);
      }

      // 3. Resolver clave_cliente consistente con la planilla real
      const claveClienteFinal = await this.resolverClaveCliente(
        data.clave_cliente,
        idObra,
        data.manzana,
        client
      );

      // 4. Insertar Inmueble
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

  /**
   * Actualización transaccional y atómica de datos catastrales y titulares del inmueble
   */
  async updateInmueble(idInmueble: number, data: UpdateInmuebleDTO): Promise<UpdateInmuebleResponseDTO> {
    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');

      // Paso 1: Bloqueo pesimista y verificación de existencia
      const { rows: inmuebleRows } = await client.query(
        `SELECT id_inmueble, id_obra, clave_cliente, id_titular, id_frentista
         FROM inmuebles 
         WHERE id_inmueble = $1 
         FOR UPDATE;`,
        [idInmueble]
      );

      if (inmuebleRows.length === 0) {
        throw new AppError('Inmueble no encontrado', 404);
      }

      const inmuebleActual = inmuebleRows[0];
      const idObra = inmuebleActual.id_obra;

      // Paso 2: Validación de clave_cliente
      const nuevaClave = data.clave_cliente?.trim();
      if (nuevaClave && nuevaClave !== inmuebleActual.clave_cliente) {
        // Verificar existencia de contratos
        const { rows: contratoRows } = await client.query(
          `SELECT COUNT(*)::int AS total FROM contratos WHERE id_inmueble = $1;`,
          [idInmueble]
        );

        if (contratoRows[0].total > 0) {
          throw new AppError('No se puede cambiar la clave de un lote con contratos o pagos asociados', 400);
        }

        // Verificar colisión con otro inmueble de la misma obra
        const { rows: duplicadoRows } = await client.query(
          `SELECT 1 FROM inmuebles 
           WHERE id_obra = $1 AND clave_cliente = $2 AND id_inmueble != $3 
           LIMIT 1;`,
          [idObra, nuevaClave, idInmueble]
        );

        if (duplicadoRows.length > 0) {
          throw new AppError('La clave cliente ya pertenece a otro lote de esta obra', 400);
        }
      }

      // Paso 3: Resolución de Persona Titular (Llama a resolverPersonaUpdateTx)
      let nuevoIdTitular = inmuebleActual.id_titular;
      if (data.titular) {
        nuevoIdTitular = await this.resolverPersonaUpdateTx(
          client,
          data.titular,
          inmuebleActual.id_titular
        );
      }

      // Paso 4: Resolución de Persona Frentista (Llama a resolverPersonaUpdateTx)
      let nuevoIdFrentista = inmuebleActual.id_frentista;
      if (data.mismo_frentista_que_titular) {
        nuevoIdFrentista = nuevoIdTitular;
      } else if (data.frentista) {
        nuevoIdFrentista = await this.resolverPersonaUpdateTx(
          client,
          data.frentista,
          inmuebleActual.id_frentista
        );
      }

      // Paso 5: UPDATE sobre inmuebles
      await client.query(
        `UPDATE inmuebles SET
          clave_cliente = COALESCE($1, clave_cliente),
          id_titular = $2,
          id_frentista = $3,
          manzana = COALESCE($4, manzana),
          lote_catast_muni = COALESCE($5, lote_catast_muni),
          lote_catast_provincia = COALESCE($6, lote_catast_provincia),
          calle = COALESCE($7, calle),
          numero = CASE WHEN $8::boolean THEN $9 ELSE numero END,
          metros_frente = COALESCE($10, metros_frente),
          conexion_gabinete = COALESCE($11, conexion_gabinete),
          gabinete_colocado = COALESCE($12, gabinete_colocado),
          observacion = CASE WHEN $13::boolean THEN $14 ELSE observacion END
         WHERE id_inmueble = $15;`,
        [
          nuevaClave || null,
          nuevoIdTitular,
          nuevoIdFrentista,
          data.manzana !== undefined ? data.manzana : null,
          data.lote_catast_muni !== undefined ? data.lote_catast_muni : null,
          data.lote_catast_provincia !== undefined ? data.lote_catast_provincia : null,
          data.calle !== undefined ? data.calle : null,
          data.numero !== undefined,
          data.numero !== undefined ? data.numero : null,
          data.metros_frente !== undefined ? data.metros_frente : null,
          data.conexion_gabinete !== undefined ? data.conexion_gabinete : null,
          data.gabinete_colocado !== undefined ? data.gabinete_colocado : null,
          data.observacion !== undefined,
          data.observacion !== undefined ? data.observacion : null,
          idInmueble,
        ]
      );

      await client.query('COMMIT');

      return {
        ok: true,
        mensaje: 'Inmueble y datos de titulares actualizados con éxito',
        id_inmueble: idInmueble,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}