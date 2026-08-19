import api from './axios';
import type { Persona, CreatePersonaDTO } from '../types';

export const getPersonas = async (search?: string): Promise<Persona[]> => {
  const { data } = await api.get<any>('/personas', {
    params: search ? { search } : undefined,
  });
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export const createPersona = async (payload: CreatePersonaDTO): Promise<Persona> => {
  const { data } = await api.post<Persona>('/personas', payload);
  return data;
};