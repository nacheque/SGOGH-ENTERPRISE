import { pool } from '../config/database';

export class ObrasRepository {
  // 1. Consultar todas las obras ordenadas por ID descendente
  async findAll() {
    const query = 'SELECT * FROM obras ORDER BY id_obra DESC;';
    const { rows } = await pool.query(query);
    return rows;
  }

  // 2. Dar de alta una nueva obra de red
  async create(data: {
    nombre_obra: string;
    descripcion?: string;
    precio_x_metro: number;
    costo_gabinete?: number;
    fecha_inicio?: string;
  }) {
    const query = `
      INSERT INTO obras (nombre_obra, descripcion, precio_x_metro, costo_gabinete, fecha_inicio)
      VALUES ($1, $2, $3, COALESCE($4, 300000.00), $5)
      RETURNING *;
    `;
    const values = [
      data.nombre_obra,
      data.descripcion || null,
      data.precio_x_metro,
      data.costo_gabinete,
      data.fecha_inicio || null,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}