import { pool } from '../config/database';
import { ObraDTO, CreateObraDTO, PadronInmuebleDTO } from '../types/obras.types';

export class ObrasRepository {
  async getAll(): Promise<ObraDTO[]> {
    const query = `
      SELECT 
        id_obra,
        nombre_obra,
        ubicacion,
        precio_x_metro,
        costo_gabinete,
        anio,
        estado
      FROM obras
      ORDER BY id_obra ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getById(id_obra: number): Promise<ObraDTO | null> {
    const query = `
      SELECT 
        id_obra,
        nombre_obra,
        ubicacion,
        precio_x_metro,
        costo_gabinete,
        anio,
        estado
      FROM obras
      WHERE id_obra = $1;
    `;
    const result = await pool.query(query, [id_obra]);
    return result.rows[0] || null;
  }

  async create(data: CreateObraDTO): Promise<ObraDTO> {
    const query = `
      INSERT INTO obras (
        nombre_obra,
        ubicacion,
        precio_x_metro,
        costo_gabinete,
        anio,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      data.nombre_obra,
      data.ubicacion ?? null,
      data.precio_x_metro,
      data.costo_gabinete,
      data.anio ?? null,
      data.estado || 'EN_PROGRESO'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtiene la grilla consolidada de inmuebles de una obra con sus frentistas y titulares asociados.
   */
  async getPadronByObraId(idObra: number): Promise<PadronInmuebleDTO[]> {
    const query = `
      SELECT 
        i.id_inmueble,
        i.clave_cliente,
        i.calle,
        i.numero,
        i.manzana,
        i.lote_catast_muni,
        i.lote_catast_provincia,
        i.metros_frente,
        i.conexion_gabinete,
        i.gabinete_colocado,
        i.observacion,
        
        -- Datos del Frentista
        pf.nombre_completo AS frentista_nombre,
        pf.dni AS frentista_dni,
        pf.cuit AS frentista_cuit,
        pf.telefono AS frentista_telefono,
        pf.email AS frentista_email,
        
        -- Datos del Titular
        pt.nombre_completo AS titular_nombre,
        pt.dni AS titular_dni,
        pt.cuit AS titular_cuit,
        pt.telefono AS titular_telefono,
        pt.email AS titular_email,
        pt.domicilio_particular AS titular_domicilio
      FROM inmuebles i
      LEFT JOIN personas pf ON i.id_frentista = pf.id_persona
      LEFT JOIN personas pt ON i.id_titular = pt.id_persona
      WHERE i.id_obra = $1
      ORDER BY i.manzana ASC NULLS LAST, i.numero ASC NULLS LAST, i.id_inmueble ASC;
    `;
    const result = await pool.query(query, [idObra]);
    return result.rows;
  }
}