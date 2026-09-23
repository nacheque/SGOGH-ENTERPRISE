import api from './axios';
import type { 
  PreviewPlanesImportResponse, 
  ConfirmarPlanesImportPayload, 
  ConfirmarPlanesImportResponse 
} from '../types';

export const previewImportacionPlanes = async (
  obraId: number, 
  archivo: File
): Promise<PreviewPlanesImportResponse> => {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const res = await api.post<{ status: string; data: PreviewPlanesImportResponse }>(
    `/obras/${obraId}/planes/importar/preview`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return res.data.data;
};

export const confirmarImportacionPlanes = async (
  obraId: number,
  payload: ConfirmarPlanesImportPayload
): Promise<ConfirmarPlanesImportResponse> => {
  const res = await api.post<ConfirmarPlanesImportResponse>(
    `/obras/${obraId}/planes/importar/confirmar`,
    payload
  );

  return res.data;
};