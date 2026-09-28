import { pool } from '../config/database';
import { Usuario, UsuarioSinPassword, RolUsuario } from '../types/auth.types';

export class UsuariosRepository {
  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const query = `
      SELECT 
        id_usuario,
        nombre,
        email,
        password_hash,
        rol,
        activo,
        creado_en
      FROM usuarios
      WHERE LOWER(email) = LOWER($1);
    `;
    const { rows } = await pool.query<Usuario>(query, [email.trim().toLowerCase()]);
    return rows[0] || null;
  }

  async buscarPorId(id_usuario: number): Promise<UsuarioSinPassword | null> {
    const query = `
      SELECT 
        id_usuario,
        nombre,
        email,
        rol,
        activo,
        creado_en
      FROM usuarios
      WHERE id_usuario = $1;
    `;
    const { rows } = await pool.query<UsuarioSinPassword>(query, [id_usuario]);
    return rows[0] || null;
  }

  async crearUsuario(datos: {
    nombre: string;
    email: string;
    password_hash: string;
    rol: RolUsuario;
  }): Promise<UsuarioSinPassword> {
    const query = `
      INSERT INTO usuarios (
        nombre,
        email,
        password_hash,
        rol,
        activo
      ) VALUES ($1, $2, $3, $4, true)
      RETURNING id_usuario, nombre, email, rol, activo, creado_en;
    `;
    const values = [
      datos.nombre.trim(),
      datos.email.trim().toLowerCase(),
      datos.password_hash,
      datos.rol,
    ];
    const { rows } = await pool.query<UsuarioSinPassword>(query, values);
    return rows[0];
  }

  async contarUsuarios(): Promise<number> {
    const query = 'SELECT COUNT(*)::int AS total FROM usuarios;';
    const { rows } = await pool.query<{ total: number }>(query);
    return rows[0]?.total || 0;
  }
}