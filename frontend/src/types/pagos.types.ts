// ==========================================
// CANALES Y MEDIOS DE PAGO
// ==========================================
export type MedioPago =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'CHEQUE'
  | 'ECHEQ'
  | 'SIRO_ROELA'
  | 'PAGO_FACIL'
  | 'RAPIPAGO'
  | string;

// ==========================================
// REGISTRO DE PAGOS / COBROS (PAYLOAD)
// ==========================================
export interface CreatePagoDTO {
  id_cuota: number;
  monto: number;
  porcentaje_actualizacion?: number;
  fecha_pago?: string | null; // 'YYYY-MM-DD'
  medio_pago: MedioPago;
  comprobante?: string | null;
  observaciones?: string | null;

  // Metadatos de Transferencia / QR
  cuenta_bancaria?: string;
  fecha_acreditacion?: string;

  // Metadatos de Cheque Físico / ECHEQ
  numero_cheque?: string;
  banco_emisor?: string;
  cuit_librador?: string;
  fecha_emision?: string;
  fecha_cobro?: string;

  // Metadatos de Canales Extrabancarios
  canal_cobro?: string;
  fecha_cobro_cliente?: string;
  fecha_rendicion?: string;
  comision_cobro?: number;
}

// Alias de retrocompatibilidad por si algún componente aún usa este nombre
export type RegistrarPagoPayload = CreatePagoDTO;

// ==========================================
// RESPUESTAS Y AUDITORÍA DE PAGOS
// ==========================================
export interface PagoResponseDTO {
  id_pago: number;
  id_cuota: number;
  monto: string | number;
  fecha_pago: string;
  medio_pago: MedioPago | string;
  comprobante: string | null;
  observaciones?: string | null;

  // Auditoría complementaria
  cuenta_bancaria?: string;
  fecha_acreditacion?: string;
  numero_cheque?: string;
  banco_emisor?: string;
  canal_cobro?: string;
  fecha_cobro_cliente?: string;
  fecha_rendicion?: string;
  comision_cobro?: number;
}

export interface RegistrarPagoResponseDTO {
  id_pago: number;
  message?: string;
}

// ==========================================
// RECIBO OFICIAL
// ==========================================
export interface ReciboDatosDTO {
  id_pago: number;
  nro_recibo: string;
  fecha_pago: string;
  titular_nombre: string;
  titular_dni: string;
  monto_pagado: number;
  nro_cuota: number;
  concepto_cuota: string;
  obra_nombre: string;
  obra_localidad: string;
  medio_pago: string;
  detalle_medio_pago?: string;
  nomenclatura_lote: string; // ej. "Mz: 1 - Lote: 1"
  calle?: string;
  numero?: string | null;
  domicilio?: string;
}

// ==========================================
// CARTERA DE CHEQUES Y ECHEQS
// ==========================================
export interface ChequeCarteraDTO {
  id_pago: number;
  id_cuota: number;
  monto: number;
  fecha_pago: string;
  medio_pago: 'CHEQUE' | 'ECHEQ';
  numero_cheque: string;
  banco_emisor: string;
  cuit_librador: string;
  fecha_emision: string;
  fecha_cobro: string;
  comprobante: string | null;
  nro_cuota: number;
  concepto: string;
  id_inmueble: number;
  clave_cliente: string;
  calle: string;
  numero: string | null;
  manzana: string | null;
  lote: string | null;
  id_obra: number;
  obra_nombre: string;
  titular_nombre: string;
  titular_cuit: string | null;
  estado_custodia: 'EN_CARTERA' | 'DISPONIBLE' | 'VENCIDO';
  dias_para_cobro: number;
}

export interface CreatePagoConChequeDTO extends CreatePagoDTO {
  numero_cheque: string;
  banco_emisor: string;
  cuit_librador: string;
  fecha_emision: string;
  fecha_cobro: string;
}