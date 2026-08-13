import { pool } from '../config/database';

export class PersonasRepository {
  // Consultar personas con opción de filtro por nombre, DNI o CUIT
  async findAll(search?: string) {
    let query = 'SELECT * FROM personas';
    const values: any[] = [];

    if (search) {
      query += ' WHERE nombre_completo ILIKE $1 OR dni ILIKE $1 OR cuit ILIKE $1';
      values.push(`%${search}%`);
    }

    query += ' ORDER BY id_persona DESC;';
    const { rows } = await pool.query(query, values);
    return rows;
  }

  // Alta de nueva persona / vecino
  async create(data: {
    nombre_completo: string;
    dni?: string;
    cuit?: string;
    telefono?: string;
    email?: string;
    domicilio_particular?: string;
  }) {
    const query = `
      INSERT INTO personas (nombre_completo, dni, cuit, telefono, email, domicilio_particular)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      data.nombre_completo,
      data.dni || null,
      data.cuit || null,
      data.telefono || null,
      data.email || null,
      data.domicilio_particular || null,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}