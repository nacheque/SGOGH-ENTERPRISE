// ==========================================
// 1. MÓDULO DE OBRAS
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
// 2. MÓDULO DE PERSONAS (Titulares / Frentistas)
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
// 3. MÓDULO DE INMUEBLES (Catastro y Lotes)
// ==========================================
export interface Inmueble {
  id_inmueble: number;
  clave_cliente: string;
  id_obra: number;
  id_titular?: number | null;
  id_frentista?: number | null;
  calle: string;
  numero?: string;
  manzana?: string;
  lote?: string;
  metros_frente: number;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  // Propiedades enriquecidas que retorna el Backend mediante JOINs
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
  calle: string;
  numero?: string;
  manzana?: string;
  lote?: string;
  metros_frente: number;
  conexion_gabinete?: boolean;
  gabinete_colocado?: boolean;
}

// ==========================================
// 4. SISTEMA & HEALTH CHECK
// ==========================================
export interface HealthResponse {
  status: string;
  message: string;
  serverTime: string;
}