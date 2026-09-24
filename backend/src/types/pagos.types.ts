import { EstadoCuota } from './contratos.types';

export interface CreatePagoDTO {
  id_cuota: number;
  monto: number;
  fecha_pago?: string;
  medio_pago: string;
  comprobante?: string | null;
  detalle?: string | null;
  porcentaje_actualizacion?: number | null;
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