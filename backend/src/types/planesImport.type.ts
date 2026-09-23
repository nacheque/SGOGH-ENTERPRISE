export type TipoContrato = 'VARIABLE_ICC' | 'FIJO';

export type EstadoValidacionPlan =
  | 'LISTO'
  | 'PLAN_YA_EXISTE'
  | 'CLAVE_NO_EXISTE'
  | 'DATOS_INVALIDOS'
  | 'DUPLICADO_EN_EXCEL';

export interface PlanImportItemPreviewDTO {
  fila_excel: number;
  clave_cliente: string;
  id_inmueble?: number;
  titular_nombre?: string;
  domicilio_sistema?: string;
  domicilio_excel?: string;
  discrepancia_domicilio: boolean;
  tipo_contrato: TipoContrato;
  monto_anticipo: number;
  fecha_inicio: string;
  plan_cuotas_obra: number;
  monto_total_obra: number;
  plan_cuotas_gabinete: number;
  monto_total_gabinete: number;
  estado: EstadoValidacionPlan;
  motivo_rechazo?: string;
}

export interface PlanesPreviewResponseDTO {
  total_filas: number;
  validos: number;
  con_observaciones: number;
  items: PlanImportItemPreviewDTO[];
}

export interface FilaPlanConfirmarDTO {
  fila_excel: number;
  clave_cliente: string;
  id_inmueble: number;
  tipo_contrato: TipoContrato;
  monto_anticipo: number;
  fecha_inicio: string; // YYYY-MM-DD
  plan_cuotas_obra: number;
  monto_total_obra: number;
  plan_cuotas_gabinete: number;
  monto_total_gabinete: number;
}

export interface ConfirmarPlanesImportDTO {
  filas: FilaPlanConfirmarDTO[];
}

export interface ConfirmarPlanesResponseDTO {
  ok: boolean;
  mensaje: string;
  total_contratos_creados: number;
  total_cuotas_generadas: number;
}