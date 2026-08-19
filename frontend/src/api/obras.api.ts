import api from './axios';
import type { Obra, CreateObraDTO } from '../types';

export const getObras = async (): Promise<Obra[]> => {
  const { data } = await api.get<any>('/obras');
  // Si el backend responde un array directo lo usa; si lo devuelve dentro de { data: [...] } 
  // extrae la propiedad data
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export const createObra = async (payload: CreateObraDTO): Promise<Obra> => {
  const { data } = await api.post<Obra>('/obras', payload);
  return data;
};