import api from './axios';
import type { Obra, CreateObraDTO, PadronInmuebleDTO } from '../types/obras.types';

export const getObras = async (): Promise<Obra[]> => {
  const { data } = await api.get('/obras');
  return Array.isArray(data) ? data : data.data || [];
};

export const createObra = async (payload: CreateObraDTO): Promise<Obra> => {
  const { data } = await api.post('/obras', payload);
  return data.data || data;
};

export const getPadronByObra = async (idObra: number): Promise<PadronInmuebleDTO[]> => {
  const { data } = await api.get(`/obras/${idObra}/padron`);
  return Array.isArray(data) ? data : data.data || [];
};