import api from './axios';
import type { CuotaConPagoDTO } from '../types';

export const getCuotasByInmueble = async (idInmueble: number): Promise<CuotaConPagoDTO[]> => {
  const { data } = await api.get<any>(`/cuotas/inmueble/${idInmueble}`);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};