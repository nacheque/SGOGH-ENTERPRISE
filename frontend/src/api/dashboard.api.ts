import api from './axios';
import type {
  DashboardKpisDTO,
  CurvaRecaudacionItemDTO,
  AgingMoraResponseDTO,
} from '../types';

export const dashboardService = {
  /**
   * Obtiene las 6 tarjetas de KPIs analíticos
   */
  getKpis: async (idObra?: number | null): Promise<DashboardKpisDTO> => {
    const res = await api.get('/dashboard/kpis', {
      params: { id_obra: idObra || undefined },
    });
    return res.data?.data || res.data;
  },

  /**
   * Obtiene los puntos de la curva proyectado vs. real acumulado
   */
  getCurvaRecaudacion: async (idObra?: number | null): Promise<CurvaRecaudacionItemDTO[]> => {
    const res = await api.get('/dashboard/curva-recaudacion', {
      params: { id_obra: idObra || undefined },
    });
    return Array.isArray(res.data?.data) ? res.data.data : res.data || [];
  },

  /**
   * Obtiene la distribución de deuda por antigüedad y tipo de plan
   */
  getAgingMora: async (idObra?: number | null): Promise<AgingMoraResponseDTO> => {
    const res = await api.get('/dashboard/aging-mora', {
      params: { id_obra: idObra || undefined },
    });
    return res.data?.data || res.data;
  },
};