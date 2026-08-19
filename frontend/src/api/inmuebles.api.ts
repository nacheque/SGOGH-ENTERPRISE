import api from './axios';
import type { Inmueble, CreateInmuebleDTO } from '../types';

export const getInmuebles = async (): Promise<Inmueble[]> => {
  const { data } = await api.get<any>('/inmuebles');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export const createInmueble = async (payload: CreateInmuebleDTO): Promise<Inmueble> => {
  const { data } = await api.post<Inmueble>('/inmuebles', payload);
  return data;
};