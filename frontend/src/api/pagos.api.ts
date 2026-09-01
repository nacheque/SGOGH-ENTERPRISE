import api from './axios';
import type { CreatePagoDTO, PagoResponseDTO } from '../types';

export const registrarPago = async (payload: CreatePagoDTO): Promise<PagoResponseDTO> => {
  const { data } = await api.post('/pagos', payload);
  return data;
};