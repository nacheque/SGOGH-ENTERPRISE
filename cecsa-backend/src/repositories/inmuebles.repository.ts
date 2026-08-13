import { pool } from '../config/database';

export class InmueblesRepository {
  // Consultar inmuebles uniendo los datos de obra, titular y frentista
  async findAll() {
    const query = `
      SELECT 
        i.*, 
        o.nombre_obra,
        p_titular.nombre_completo AS titular_nombre,
        p_frentista.nombre_completo AS frentista_nombre
      FROM inmuebles i
      JOIN obras o ON i.id_obra = o.id_obra
      LEFT JOIN personas p_titular ON i.id_titular = p_titular.id_persona
      LEFT JOIN personas p_frentista ON i.id_frentista = p_frentista.id_persona
      ORDER BY i.id_inmueble DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // Alta de nuevo inmueble / lote
  async create(data: {
    clave_cliente?: string;
    id_obra: number;
    id_titular?: number;
    id_frentista?: number;
    manzana?: string;
    lote_catast_muni?: string;
    lote_catast_provincia?: string;
    calle?: string;
    numero?: string;
    metros_frente: number;
    conexion_gabinete?: boolean;
    gabinete_colocado?: boolean;
    observacion?: string;
  }) {
    const query = `
      INSERT INTO inmuebles (
        clave_cliente, id_obra, id_titular, id_frentista, manzana, 
        lote_catast_muni, lote_catast_provincia, calle, numero, 
        metros_frente, conexion_gabinete, gabinete_colocado, observacion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, FALSE), COALESCE($12, FALSE), $13)
      RETURNING *;
    `;
    const values = [
      data.clave_cliente || null,
      data.id_obra,
      data.id_titular || null,
      data.id_frentista || null,
      data.manzana || null,
      data.lote_catast_muni || null,
      data.lote_catast_provincia || null,
      data.calle || null,
      data.numero || null,
      data.metros_frente,
      data.conexion_gabinete,
      data.gabinete_colocado,
      data.observacion || null,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}