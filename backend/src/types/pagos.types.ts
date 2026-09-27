import { EstadoCuota } from './contratos.types';

export type EstadoCustodiaCheque = 'EN_CARTERA' | 'DISPONIBLE' | 'VENCIDO';

export interface CreatePagoDTO {
  id_cuota: number;
  monto: number;
  fecha_pago?: string;
  medio_pago: 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE' | 'ECHEQ' | 'SIRO_ROELA' | string;
  comprobante?: string | null;
  detalle?: string | null;
  porcentaje_actualizacion?: number | null;

  numero_cheque?: string | null;
  banco_emisor?: string | null;
  cuit_librador?: string | null;
  fecha_emision?: string | null;
  fecha_cobro?: string | null;
}

export interface PagoResponseDTO {
  id_pago: number;
  id_cuota: number;
  monto: string | number;
  fecha_pago: string;
  medio_pago: string;
  comprobante: string | null;
}

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
  medio_pago: 'CHEQUE' | 'ECHEQ';
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
  estado_custodia: EstadoCustodiaCheque;
  dias_para_cobro: number;
}

//============================
// DTOs para la generacion de Recibos de Pago
//============================

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
  medio_pago: string; // "EFECTIVO" | "TRANSFERENCIA" | "CHEQUE" | "ECHEQ"
  detalle_medio_pago?: string;
  nomenclatura_lote: string;
}

export interface ReciboRawRow {
  id_pago: number;
  monto_pagado: number;
  fecha_pago: string;
  medio_pago: string;
  nro_recibo: string;
  numero_cheque: string | null;
  banco_emisor: string | null;
  comprobante: string | null;
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