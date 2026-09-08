// ==========================================
// 1. Tipos Base / Inmuebles
// ==========================================

export interface CreateInmuebleDTO {
  clave_cliente: string;
  id_obra: number;
  id_frentista?: number | null;
  id_titular?: number | null;
  calle: string;
  numero?: string | null;
  manzana?: string | null;
  lote_catast_muni?: string | null;
  lote_catast_provincia?: string | null;
  metros_frente: number;
  conexion_gabinete: boolean;
  gabinete_colocado?: boolean;
  observacion?: string | null;
}

export interface InmuebleResponseDTO {
  id_inmueble: number;
  clave_cliente: string;
  id_obra: number;
  nombre_obra: string;
  precio_x_metro: number | string;
  costo_gabinete: number | string;
  id_frentista: number | null;
  frentista_nombre: string | null;
  frentista_dni: string | null;
  id_titular: number | null;
  titular_nombre: string | null;
  titular_dni: string | null;
  calle: string;
  numero: string | null;
  manzana: string | null;
  lote_catast_muni: string | null;
  lote_catast_provincia: string | null;
  metros_frente: number | string;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  observacion: string | null;

  // Datos del Contrato Real (vía LEFT JOIN)
  id_contrato?: number | null;
  plan_cuotas_obra?: number | null;
  plan_cuotas_gabinete?: number | null;
  tipo_indexacion?: 'ICC' | 'FIJO' | string | null;
  cuota_base_obra?: number | string | null;
  monto_anticipo?: number | string | null;
}

// ==========================================
// 2. Tipos para Alta Atómica Compuesta
// ==========================================

export interface PersonaInputDTO {
  nombre_completo: string;
  dni?: string | null;
  cuit?: string | null;
  telefono?: string | null;
  email?: string | null;
  domicilio_particular?: string | null;
}

export interface CreateInmuebleConPersonasDTO {
  clave_cliente?: string;
  calle: string;
  numero?: string | null;
  manzana?: string | null;
  lote_catast_muni?: string | null;
  lote_catast_provincia?: string | null;
  metros_frente: number;
  conexion_gabinete?: boolean;
  gabinete_colocado?: boolean;
  observacion?: string | null;
  frentista: PersonaInputDTO;
  titular?: {
    es_mismo_frentista: boolean;
    datos?: PersonaInputDTO;
  };
}

export interface InmuebleCompletoResponseDTO {
  id_inmueble: number;
  id_obra: number;
  id_titular: number | null;
  id_frentista: number;
  clave_cliente: string;
  calle: string;
  numero: string | null;
  manzana: string | null;
  lote_catast_muni: string | null;
  lote_catast_provincia: string | null;
  metros_frente: string | number;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  observacion: string | null;
}