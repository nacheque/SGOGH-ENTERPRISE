import { EstadoCuota } from './contratos.types';

export type EstadoPreview = 
  | 'LISTO_PARA_IMPUTAR' 
  | 'INMUEBLE_NO_ENCONTRADO' 
  | 'SIN_DEUDA' 
  | 'DUPLICADO';

export interface PreviewItemDTO {
  id_inmueble: number | null;
  clave_cliente: string;
  frentista: string | null;
  fecha_pago: string;
  monto: number;
  id_cuota: number | null;
  nro_cuota: number | null;
  monto_cuota_actual: number | null;
  nuevo_estado: 'PAGADA' | 'PAGO_PARCIAL' | null;
  saldo_remanente: number | null;
  estado_preview: EstadoPreview;
  motivo_error: string | null;
}

export interface PreviewConciliacionResponseDTO {
  total_filas: number;
  listos_para_imputar: number;
  con_inconsistencias: number;
  monto_total_a_conciliar: number;
  items: PreviewItemDTO[];
}

export interface PagoConfirmarDTO {
  id_cuota: number;
  monto: number;
  fecha_pago: string;
  clave_cliente: string;
}

export interface ConfirmarConciliacionDTO {
  pagosAImputar: PagoConfirmarDTO[];
}

export interface ConfirmacionResponseDTO {
  imputados_exitosamente: number;
  monto_total_imputado: number;
  detalles: Array<{
    id_pago: number;
    id_cuota: number;
    monto: number;
    nuevo_estado: EstadoCuota;
  }>;
}