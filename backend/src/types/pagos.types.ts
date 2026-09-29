import { EstadoCuota } from './contratos.types';

// ==========================================
// Tipos Base y Enums
// ==========================================

export type MedioPago = 
  | 'EFECTIVO' 
  | 'TRANSFERENCIA' 
  | 'CHEQUE' 
  | 'ECHEQ' 
  | 'SIRO_ROELA' 
  | 'PAGO_FACIL' 
  | 'RAPIPAGO';

export type MedioPagoCheque = 'CHEQUE' | 'ECHEQ';

export type EstadoCheque = 'CARTERA' | 'PENDIENTE' | 'DEPOSITADO' | 'COBRADO' | 'RECHAZADO' | 'ANULADO';
// ==========================================
// DTOs para Creación y Registro de Pagos
// ==========================================

export interface CreatePagoDTO {
  id_cuota: number;
  monto: number;
  fecha_pago?: string;
  medio_pago: MedioPago;
  comprobante?: string | null;
  detalle?: string | null;
  observaciones?: string | null;
  porcentaje_actualizacion?: number | null;

  // Campos Cheque / ECHEQ
  numero_cheque?: string | null;
  banco_emisor?: string | null;
  cuit_librador?: string | null;
  fecha_emision?: string | null;
  fecha_cobro?: string | null;

  // Campos Conciliación Transferencia / QR
  cuenta_bancaria?: string | null;
  fecha_acreditacion?: string | null;

  // Campos Redes Recaudación (Pago Fácil, Rapipago, etc.)
  canal_cobro?: string | null;
  fecha_cobro_cliente?: string | null;
  fecha_rendicion?: string | null;
  comision_cobro?: number | null;
}

// Alias para consistencia de nomenclatura si se usa RegistrarPagoPayload en services
export type RegistrarPagoPayload = CreatePagoDTO;

// ==========================================
// DTOs de Respuesta y Detalle de Pagos
// ==========================================

export interface PagoResponseDTO {
  id_pago: number;
  id_cuota: number;
  monto: number;
  fecha_pago: string;
  medio_pago: MedioPago;
  comprobante: string | null;
  observaciones?: string | null;

  // Cheque / ECHEQ
  numero_cheque?: string | null;
  banco_emisor?: string | null;
  cuit_librador?: string | null;
  fecha_emision?: string | null;
  fecha_cobro?: string | null;

  // Transferencia / Bancario
  cuenta_bancaria?: string | null;
  fecha_acreditacion?: string | null;

  // Redes Recaudación (Pago Fácil / Rapipago)
  canal_cobro?: string | null;
  fecha_cobro_cliente?: string | null;
  fecha_rendicion?: string | null;
  comision_cobro?: number;
}

export type PagoDetalleDTO = PagoResponseDTO;

export interface CuotaConPagoDTO {
  id_cuota: number;
  id_contrato: number;
  id_inmueble: number;
  clave_cliente: string;
  concepto: string;
  nro_cuota: number;
  periodo: string;
  monto_base: string | number;
  monto_actualizado: string | number;
  saldo_remanente: string | number;
  porcentaje_actualizacion: number;
  fecha_vencimiento: string;
  estado: EstadoCuota;
  total_abonado: string | number;
  ultima_fecha_pago: string | null;
  ultimo_comprobante: string | null;
  pagos: PagoResponseDTO[];
}

export interface ChequeCarteraDTO {
  id_pago: number;
  id_cuota: number;
  monto: number;
  fecha_pago: string;
  medio_pago: MedioPagoCheque;
  numero_cheque: string;
  banco_emisor: string;
  cuit_librador: string;
  fecha_emision: string;
  fecha_cobro: string;
  comprobante: string | null;
  observaciones: string | null;
  nro_cuota: number;
  concepto: string;
  id_inmueble: number;
  clave_cliente: string;
  calle: string | null;
  numero: string | null;
  manzana: string | null;
  lote: string | null;
  id_obra: number;
  obra_nombre: string;
  titular_nombre: string | null;
  titular_cuit: string | null;
  estado_custodia: EstadoCheque;
  dias_para_cobro: number;
}

export interface ActualizarEstadoChequeDTO {
  estado: EstadoCheque;
  fecha_deposito?: string;
}

export interface ChequeActualizadoResponseDTO {
  id_pago: number;
  id_cuota: number;
  monto: number;
  medio_pago: MedioPagoCheque;
  numero_cheque: string | null;
  banco_emisor: string | null;
  cuit_librador: string | null;
  fecha_emision: string | null;
  fecha_cobro: string | null;
  estado: EstadoCheque;
  fecha_deposito?: string | null;
}

// ==========================================
// DTOs para la Generación de Recibos de Pago
// ==========================================

export interface ReciboDatosDTO {
  id_pago: number;
  nro_recibo: string;
  fecha_pago: string; // Formato "DD/MM/YYYY"
  titular_nombre: string;
  titular_dni: string;
  monto_pagado: number;
  nro_cuota: number;
  concepto_cuota: string;
  obra_nombre: string;
  obra_localidad: string;
  medio_pago: MedioPago;
  detalle_medio_pago?: string;
  nomenclatura_lote: string;
}

export interface ReciboRawRow {
  id_pago: number;
  monto_pagado: number;
  fecha_pago: string;
  medio_pago: MedioPago;
  nro_recibo: string;
  referencia_transferencia: string | null;
  numero_cheque: string | null;
  banco_emisor: string | null;
  id_cuota: number;
  nro_cuota: number;
  concepto_cuota: string;
  id_contrato: number;
  id_obra: number;
  nombre_obra: string;
  obra_localidad: string;
  id_inmueble: number;
  clave_cliente: string;
  calle: string | null;
  numero: string | null;
  manzana: string | null;
  lote_catast_muni: string | null;
  lote_catast_provincia: string | null;
  titular_nombre: string | null;
  titular_dni: string;
}