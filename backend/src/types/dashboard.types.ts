export interface DashboardKpisDTO {
  total_obra: number;
  recaudacion_efectiva: number;
  porcentaje_recaudado: number;
  saldo_pendiente: number;
  porcentaje_pendiente: number;
  monto_mora: number;
  tasa_morosidad: number;
  cobertura_icc: number;
  efectividad_mes: number;
}

export interface CurvaRecaudacionPuntoDTO {
  periodo: string;
  proyectado_mes: number;
  proyectado_acumulado: number;
  real_mes: number;
  real_acumulado: number;
}

export interface AgingFilaDTO {
  tipo_plan: string;
  total_clientes: number;
  monto_al_dia: number;
  monto_1_30: number;
  monto_31_60: number;
  monto_61_90: number;
  monto_mas_90: number;
  porcentaje_morosidad: number;
}

export interface AgingMoraResponseDTO {
  totales_generales: {
    monto_al_dia: number;
    monto_1_30: number;
    monto_31_60: number;
    monto_61_90: number;
    monto_mas_90: number;
  };
  detalle_por_plan: AgingFilaDTO[];
}