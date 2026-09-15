export type EstadoConciliacion =
  | 'LISTO_PARA_IMPUTAR'
  | 'DUPLICADO'
  | 'INMUEBLE_NO_ENCONTRADO'
  | 'SIN_CUOTAS_PENDIENTES';

export interface ConciliacionItemDTO {
  id_linea?: number;
  id_inmueble?: number | null;
  id_cuota?: number | null;
  clave_cliente: string;
  frentista: string | null;
  titular?: string | null;
  monto: number;
  monto_cuota_actual?: number;
  porcentaje_actualizacion?: number; // % inferido por el backend
  fecha_pago: string;
  nro_cuota: number | null;
  concepto?: string;
  estado_preview?: EstadoConciliacion | string;
  estado_conciliacion?: EstadoConciliacion | string;
  motivo_error?: string | null;
  motivo_inconsistencia?: string;
  nuevo_estado?: 'PAGADA' | 'PAGO_PARCIAL' | string;
  saldo_remanente?: number;
}

export interface ConciliacionSummaryDTO {
  total_registros: number;
  listos_para_imputar: number;
  con_inconsistencias: number;
  monto_total_conciliar: number;
}

export interface PreviewRoelaResponse {
  status: string;
  message: string;
  data: {
    total_filas: number;
    listos_para_imputar: number;
    con_inconsistencias: number;
    monto_total_a_conciliar: number;
    items: ConciliacionItemDTO[];
  };
}