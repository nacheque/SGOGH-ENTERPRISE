import api from './axios';
import type { PreviewRoelaResponse, ConciliacionItemDTO } from '../types/conciliaciones.types';

export const conciliacionesApi = {
  previewRoela: async (file: File): Promise<PreviewRoelaResponse> => {
    const formData = new FormData();
    formData.append('archivo', file);

    const res = await api.post<PreviewRoelaResponse>(
      '/conciliaciones/roela/preview',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data;
  },

  confirmarRoela: async (pagosValidos: ConciliacionItemDTO[]): Promise<void> => {
    // Envía el JSON con la propiedad exacta que desestructura el controller
    await api.post('/conciliaciones/roela/confirmar', {
      pagosAImputar: pagosValidos,
    });
  },
};