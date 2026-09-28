import axios from 'axios';

export const AUTH_TOKEN_KEY = 'cecsa_token';

// Instancia base apuntando al prefijo de la API REST de CECSA
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout de 10 segundos para no bloquear la UI si el VPS no responde
});

// Interceptor de petición para inyectar automáticamente el Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta para unificar el manejo de errores y ciclo de vida de sesión
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el servidor responde 401 Unauthorized y no es el endpoint de login
    if (error.response?.status === 401) {
      const esRutaLogin = error.config?.url?.includes('/auth/login');
      if (!esRutaLogin) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    // Si el backend envió un mensaje JSON de error estructurado, lo priorizamos
    const customMessage = error.response?.data?.message;
    const fallbackMessage = error.message || 'Error de conexión con el servidor CECSA';
    return Promise.reject(new Error(customMessage || fallbackMessage));
  }
);

export default api;