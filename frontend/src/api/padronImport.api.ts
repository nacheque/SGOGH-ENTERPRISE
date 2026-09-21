import api from './axios';
import type { 
  PadronPreviewResponseData, 
  ConfirmarPadronResponseData, 
  PadronImportItemDTO 
} from '../types/padronImport.types';

export const padronImportApi = {
  previewPadronExcel: async (obraId: number, file: File): Promise<PadronPreviewResponseData> => {
    const formData = new FormData();
    formData.append('archivo', file);

    const res = await api.post<{ status: string; message: string; data: PadronPreviewResponseData }>(
      `/obras/${obraId}/padron/importar/preview`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    // Retornamos res.data.data para entregar directamente { total_filas, validos, con_errores, items }
    return res.data.data;
  },

  confirmarImportacionPadron: async (
    obraId: number, 
    items: PadronImportItemDTO[]
  ): Promise<ConfirmarPadronResponseData> => {
    const res = await api.post<{ status: string; message: string; data: ConfirmarPadronResponseData }>(
      `/obras/${obraId}/padron/importar/confirmar`,
      {
        inmueblesAImputar: items,
      }
    );
    // Si confirmar también viene envuelto en .data retornamos res.data.data, o res.data como fallback
    return (res.data as any).data || res.data;
  },
};

export const previewPadronExcel = padronImportApi.previewPadronExcel;
export const confirmarImportacionPadron = padronImportApi.confirmarImportacionPadron;