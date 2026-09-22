import type { PersonaInmuebleDTO, TitularInputDTO } from './personas.types';

// ==========================================
// MÓDULO DE INMUEBLES (Catastro y Lotes)
// ==========================================
export interface Inmueble {
  id_inmueble: number;
  nombre_obra?: string | null;
  id_obra: number;
  clave_cliente?: string;
  calle: string;
  numero?: string;
  manzana?: string;
  lote_catast_muni?: string;
  lote_catast_provincia?: string;
  metros_frente: number;
  conexion_gabinete?: boolean;
  gabinete_colocado?: boolean;
  observacion?: string;
  frentista_nombre?: string;
  titular_nombre?: string;
  titular_dni?: string;
  // Campos del contrato
  id_contrato?: number | null;
  plan_cuotas_obra?: number | null;
  plan_cuotas_gabinete?: number | null;
  tipo_indexacion?: 'ICC' | 'FIJO' | null;
  cuota_base_obra?: number | null;
  monto_anticipo?: number | null;
}

export interface CreateInmuebleDTO {
  clave_cliente: string | null; // Opcional manual
  id_obra: number;
  id_frentista?: number | null;
  id_titular?: number | null;
  calle: string;
  numero?: string | null;
  manzana?: string | null;
  lote_catast_muni?: string | null;
  lote_catast_provincia?: string | null;
  metros_frente: number | string;
  conexion_gabinete: boolean;
  gabinete_colocado?: boolean;
  observacion?: string | null;
}

export interface CreateInmuebleConPersonasDTO {
  clave_cliente?: string | null;
  calle: string;
  numero?: string;
  manzana?: string;
  lote_catast_muni?: string;
  lote_catast_provincia?: string;
  metros_frente: number;
  conexion_gabinete?: boolean;
  gabinete_colocado?: boolean;
  observacion?: string;
  frentista: {
    nombre_completo: string;
  };
  titular: {
    es_mismo_frentista: boolean;
    datos: TitularInputDTO;
  };
}

// Modificación de Lote
export interface UpdateInmuebleDTO {
  clave_cliente: string;
  manzana: string;
  lote_catast_muni?: string | null;
  lote_catast_provincia?: string | null;
  calle: string;
  numero?: string | null;
  metros_frente: number;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  observacion?: string | null;
  titular: PersonaInmuebleDTO;
  mismo_frentista_que_titular: boolean;
  frentista?: PersonaInmuebleDTO | null;
}

export interface UpdateInmuebleResponse {
  status: string;
  message: string;
  data?: any;
}