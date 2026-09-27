import api from './axios';
import type { CreatePagoDTO, PagoResponseDTO, ReciboDatosDTO } from '../types';

export const registrarPago = async (payload: CreatePagoDTO): Promise<PagoResponseDTO> => {
  const { data } = await api.post('/pagos', payload);
  return data;
};

export const getReciboDatos = async (idPago: number): Promise<ReciboDatosDTO> => {
  const { data } = await api.get(`/pagos/${idPago}/recibo-datos`);
  return data?.data || data;
};