import api from './axios';
import type { 
  CreateIndiceDTO, 
  IndiceActualizacionResponseDTO, 
  RegistroIndiceResultadoDTO 
} from '../types';

/**
 * Consulta el índice registrado para una obra y período específicos
 */
export const getIndiceByObraYPeriodo = async (
  idObra: number,
  periodo: string
): Promise<IndiceActualizacionResponseDTO> => {
  const { data } = await api.get<any>(`/indices/obra/${idObra}/periodo/${periodo}`);
  if (data && data.data) return data.data;
  return data;
};

/**
 * Registra o aplica un índice de actualización a una obra (Manual o ICC)
 */
export const registrarIndice = async (
  payload: CreateIndiceDTO
): Promise<RegistroIndiceResultadoDTO> => {
  const { data } = await api.post('/indices', payload);
  return data;
};