import { pool } from '../config/database';
import {CreateInmuebleDTO, InmuebleResponseDTO} from '../types/inmueble.repository';

export class InmueblesRepository {
  // Consultar inmuebles uniendo los datos de obra, titular y frentista
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
        i.observacion
      FROM inmuebles i
      INNER JOIN obras o ON i.id_obra = o.id_obra
      LEFT JOIN personas pf ON i.id_frentista = pf.id_persona
      LEFT JOIN personas pt ON i.id_titular = pt.id_persona
      ORDER BY i.id_inmueble DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Alta de nuevo inmueble / lote
  async create(data: CreateInmuebleDTO): Promise<any> {
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
}