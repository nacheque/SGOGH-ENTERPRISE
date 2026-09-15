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


// ==========================================
// ENTIDAD DE CUENTA CORRIENTE (ficha individual por inmueble)
// ==========================================
export interface CuentaCorrienteRow {
  id_inmueble: number;
  id_obra: number;
  id_contrato: number | null;
  tiene_contrato: boolean;
  clave?: string;
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
  plan_pagos: number | null;
  cuota_base: number;
  monto_anticipo: number;
  tipo_indexacion: 'ICC' | 'FIJO' | null;
  estado: 'ACTIVO' | 'SIN_PLAN';
  cuota_vigente_actual: number;
}

// ==========================================
// INTERFACES DE CUOTAS Y PAGOS
// ==========================================
export type EstadoCuota = 'PENDIENTE' | 'PAGADA' | 'PAGO_PARCIAL' | 'VENCIDA';
export type MedioPago = 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE' | 'DEBITO' | string;

export interface Cuota {
  id_cuota: number;
  id_contrato?: number;
  id_inmueble: number;
  clave_cliente?: string;
  nro_cuota: number;
  concepto: 'RED_OBRA' | 'GABINETE' | 'ANTICIPO' | string;
  periodo: string;
  fecha_vencimiento?: string;
  monto_base: number;
  monto_actualizado: number; // Valor nominal contractual del mes
  saldo_remanente: number;   // Deuda viva exigible
  total_abonado?: number;
  porcentaje_actualizacion?: number;
  coeficiente_actualizacion?: number;
  indice_aplicado?: number;
  porcentaje_mensual?: number;
  estado: EstadoCuota;
}

export interface CreatePagoDTO {
  id_cuota: number;
  monto: number;
  porcentaje_actualizacion?: number;
  fecha_pago?: string | null; // 'YYYY-MM-DD'
  medio_pago: MedioPago;
  comprobante?: string | null;
}

export interface PagoResponseDTO {
  id_pago: number;
  id_cuota: number;
  monto: string | number;
  fecha_pago: string;
  medio_pago: string;
  comprobante: string | null;
}

export interface CuotaConPagoDTO extends Cuota {
  id_pago?: number | null;
  monto?: string | number | null;
  fecha_pago?: string | null;
  medio_pago?: string | null;
  comprobante?: string | null;
  ultima_fecha_pago?: string | null;
  ultimo_comprobante?: string | null;
  pagos?: PagoResponseDTO[];
}

// ==========================================
// INDICES DE ACTUALIZACION DE CUOTAS
// ==========================================
export interface CreateIndiceDTO {
  id_obra: number;
  periodo: string; // Formato 'YYYY-MM'
  porcentaje_variacion: number; // Ej: 1.99
}

export interface IndiceActualizacionResponseDTO {
  id_indice: number;
  id_obra: number;
  periodo: string;
  coeficiente_incremento: string | number;
}

export interface RegistroIndiceResultadoDTO {
  indice: IndiceActualizacionResponseDTO;
  cuotas_actualizadas: number;
  mensaje: string;
}