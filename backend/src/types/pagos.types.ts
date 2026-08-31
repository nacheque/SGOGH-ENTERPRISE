export interface CreatePagoDTO {
  id_cuota: number;
  monto: number;
  fecha_pago?: string | null; // 'YYYY-MM-DD'
  medio_pago: 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE' | string;
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
  fecha_vencimiento: string;
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA';
  id_pago: number | null;
  monto: string | number | null;
  fecha_pago: string | null;
  medio_pago: string | null;
  comprobante: string | null;
}