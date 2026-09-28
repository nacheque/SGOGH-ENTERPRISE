export type RolUsuario = 'ADMIN' | 'OPERADOR';

export interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: RolUsuario;
  activo: boolean;
  creado_en: Date;
}

export type UsuarioSinPassword = Omit<Usuario, 'password_hash'>;

export interface LoginDTO {
  email: string;
  password: string;
}

export interface JWTPayload {
  id_usuario: number;
  email: string;
  rol: RolUsuario;
  nombre: string;
}

export interface AuthResponseDTO {
  token: string;
  usuario: UsuarioSinPassword;
}

// Extensión de Express Request para inyectar usuario verificado
declare global {
  namespace Express {
    interface Request {
      usuario?: JWTPayload;
    }
  }
}