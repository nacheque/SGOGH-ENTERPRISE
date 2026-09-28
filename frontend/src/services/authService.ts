import api, { AUTH_TOKEN_KEY } from '../api/axios';
import type { AuthResponseDTO, LoginCredentials, Usuario } from '../types/auth.types';

interface ApiResponse<T> {
  status?: string;
  data?: T;
  message?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponseDTO> {
    const response = await api.post<ApiResponse<AuthResponseDTO> | AuthResponseDTO>(
      '/auth/login',
      credentials
    );

    // Soporte tolerante tanto a payloads directos como envueltos en { data: ... }
    const resData = (response.data as ApiResponse<AuthResponseDTO>).data || (response.data as AuthResponseDTO);

    if (!resData?.token || !resData?.usuario) {
      throw new Error('Respuesta de autenticación inválida del servidor');
    }

    localStorage.setItem(AUTH_TOKEN_KEY, resData.token);
    return resData;
  },

  async getMe(): Promise<Usuario> {
    const response = await api.get<ApiResponse<Usuario> | Usuario>('/auth/me');
    const usuario = (response.data as ApiResponse<Usuario>).data || (response.data as Usuario);
    
    if (!usuario?.id_usuario || !usuario?.rol) {
      throw new Error('No se pudo verificar el perfil del usuario');
    }

    return usuario;
  },

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
};