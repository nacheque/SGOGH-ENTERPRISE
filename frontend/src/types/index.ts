// ==========================================
// SISTEMA & HEALTH CHECK
// ==========================================
export interface HealthResponse {
  status: string;
  message: string;
  serverTime: string;
}

// ==========================================
// MÓDULO DE OBRAS
// ==========================================
export type EstadoObra = 'PLANIFICADA' | 'EN_PROGRESO' | 'FINALIZADA' | 'PAUSADA';

export interface Obra {
  id_obra: number;
  nombre_obra: string;
  descripcion?: string;
  precio_x_metro: number;
  costo_gabinete: number;
  fecha_inicio?: string;
  estado: EstadoObra;
  created_at?: string;
}

export interface CreateObraDTO {
  nombre_obra: string;
  descripcion?: string;
  precio_x_metro: number;
  costo_gabinete?: number;
  fecha_inicio?: string;
  estado?: EstadoObra;
}

// ==========================================
// MÓDULO DE PERSONAS (Titulares / Frentistas)
// ==========================================
export interface Persona {
  id_persona: number;
  nombre_completo: string;
  dni?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  domicilio_particular?: string;
  created_at?: string;
}

export interface CreatePersonaDTO {
  nombre_completo: string;
  dni?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  domicilio_particular?: string;
}

// ==========================================
// MÓDULO DE INMUEBLES (Catastro y Lotes)
// ==========================================
export interface Inmueble {
  id_inmueble: number;
  clave_cliente: string;
  id_obra: number;
  id_titular?: number | null;
  id_frentista?: number | null;
  manzana?: string | null;
  lote_catast_muni?: string | null;
  lote_catast_provincia?: string | null;
  calle: string;
  numero?: string | null;
  metros_frente: number;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  observacion?: string | null;
  // Propiedades enriquecidas que retorna el backend con JOINs
  nombre_obra?: string;
  titular_nombre?: string;
  frentista_nombre?: string;
  created_at?: string;
}

export interface CreateInmuebleDTO {
  clave_cliente: string;
  id_obra: number;
  id_titular?: number | null;
  id_frentista?: number | null;
  manzana?: string;
  lote_catast_muni?: string;
  lote_catast_provincia?: string;
  calle: string;
  numero?: string;
  metros_frente: number;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  observacion?: string;
}


// ==========================================
// ENTIDAD DE CUENTA CORRIENTE (ficha individual por inmueble)
// ==========================================
export interface CuentaCorrienteRow {
  id_inmueble: number;
  clave: string;
  frentista_nombre: string | null;
  titular_nombre: string | null;
  metros_frente: number;
  calle: string;
  numero: string | null;
  mza: string | null;
  lote_catast_muni: string | null;
  lote_catast_provincia: string | null;
  observacion: string | null;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  dni: string | null;
  cuil: string | null;
  telefono: string | null;
  email: string | null;
  precio_x_metro: number;
  costo_obra: number;
  serv_dom: number;
  costo_total: number;
  plan_pagos: number;
  cuota_base: number;
  estado: string;
  cuota_vigente_actual: number;
}

