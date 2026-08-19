import axios from 'axios';

// Instancia base apuntando al prefijo de la API REST de CECSA
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout de 10 segundos para no bloquear la UI si el VPS no responde
});

// Interceptor de respuesta para unificar el manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend envió un mensaje JSON de error estructurado, lo priorizamos
    const customMessage = error.response?.data?.message;
    const fallbackMessage = error.message || 'Error de conexión con el servidor CECSA';
    return Promise.reject(new Error(customMessage || fallbackMessage));
  }
);

export default api;