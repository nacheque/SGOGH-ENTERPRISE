import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '../services/authService';
import type { AuthContextType, LoginCredentials, RolUsuario, Usuario } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(authService.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    authService.logout();
    setToken(null);
    setUsuario(null);
  }, []);

  // Bootstrap inicial: verifica sesión activa contra /auth/me si existe token
  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const storedToken = authService.getToken();
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const usuarioValido = await authService.getMe();
        if (isMounted) {
          setUsuario(usuarioValido);
          setToken(storedToken);
        }
      } catch {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrapAuth();

    // Listener para eventos de sesión caducada disparados por Axios interceptor
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const { token: nuevoToken, usuario: nuevoUsuario } = await authService.login(credentials);
      setToken(nuevoToken);
      setUsuario(nuevoUsuario);
    } finally {
      setIsLoading(false);
    }
  };

  const tieneRol = useCallback(
    (rolesPermitidos: RolUsuario[]): boolean => {
      if (!usuario) return false;
      return rolesPermitidos.includes(usuario.rol);
    },
    [usuario]
  );

  const value: AuthContextType = {
    usuario,
    token,
    isAuthenticated: Boolean(usuario && token),
    isLoading,
    login,
    logout,
    tieneRol,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};