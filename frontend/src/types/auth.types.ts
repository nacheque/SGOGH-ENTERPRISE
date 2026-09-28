export type RolUsuario = 'ADMIN' | 'OPERADOR';

export interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  token: string;
  usuario: Usuario;
}

export interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  tieneRol: (rolesPermitidos: RolUsuario[]) => boolean;
}