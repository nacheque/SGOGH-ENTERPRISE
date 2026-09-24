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