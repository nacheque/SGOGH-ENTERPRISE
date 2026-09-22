import api from './axios';
import type { Inmueble, CreateInmuebleDTO, UpdateInmuebleDTO, UpdateInmuebleResponse } from '../types';

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

// Helper para limpiar strings vacíos a null
const cleanNull = (val?: string | null): string | null =>
  val && val.trim() !== '' ? val.trim() : null;

export const updateInmueble = async (
  idInmueble: number,
  data: UpdateInmuebleDTO
): Promise<UpdateInmuebleResponse> => {
  const payload: UpdateInmuebleDTO = {
    ...data,
    clave_cliente: data.clave_cliente.trim(),
    manzana: data.manzana.trim(),
    calle: data.calle.trim(),
    numero: cleanNull(data.numero),
    lote_catast_muni: cleanNull(data.lote_catast_muni),
    lote_catast_provincia: cleanNull(data.lote_catast_provincia),
    observacion: cleanNull(data.observacion),
    metros_frente: Number(data.metros_frente),
    titular: {
      nombre_completo: data.titular.nombre_completo.trim(),
      dni: cleanNull(data.titular.dni),
      cuit: cleanNull(data.titular.cuit),
      telefono: cleanNull(data.titular.telefono),
      email: cleanNull(data.titular.email),
      domicilio_particular: cleanNull(data.titular.domicilio_particular),
    },
    mismo_frentista_que_titular: data.mismo_frentista_que_titular,
    frentista: data.mismo_frentista_que_titular
      ? null
      : {
          nombre_completo: data.frentista?.nombre_completo?.trim() || '',
          dni: cleanNull(data.frentista?.dni),
          cuit: cleanNull(data.frentista?.cuit),
          telefono: cleanNull(data.frentista?.telefono),
          email: cleanNull(data.frentista?.email),
          domicilio_particular: cleanNull(data.frentista?.domicilio_particular),
        },
  };

  const res = await api.put<UpdateInmuebleResponse>(`/inmuebles/${idInmueble}`, payload);
  return res.data;
};