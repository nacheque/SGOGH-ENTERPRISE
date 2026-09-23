export type EstadoItemPlanImport = 
  | 'LISTO' 
  | 'PLAN_YA_EXISTE' 
  | 'CLAVE_NO_EXISTE' 
  | 'DATOS_INVALIDOS' 
  | 'DUPLICADO_EN_EXCEL';

export interface PlanImportItemDTO {
  fila_excel: number;
  clave_cliente: string;
  id_inmueble?: number;
  titular_nombre?: string;
  domicilio_sistema?: string;
  domicilio_excel?: string;
  discrepancia_domicilio: boolean;
  tipo_contrato: 'VARIABLE_ICC' | 'FIJO';
  monto_anticipo: number;
  fecha_inicio: string;
  plan_cuotas_obra: number;
  monto_total_obra: number;
  plan_cuotas_gabinete: number;
  monto_total_gabinete: number;
  estado: EstadoItemPlanImport;
  motivo_rechazo?: string;
}

export interface PreviewPlanesImportResponse {
  total_filas: number;
  validos: number;
  con_observaciones: number;
  items: PlanImportItemDTO[];
}

export interface PlanConfirmarFilaDTO {
  clave_cliente: string;
  id_inmueble: number;
  tipo_contrato: string;
  monto_anticipo: number;
  fecha_inicio: string;
  plan_cuotas_obra: number;
  monto_total_obra?: number;
  plan_cuotas_gabinete: number;
  monto_total_gabinete?: number;
}

export interface ConfirmarPlanesImportPayload {
  filas: PlanConfirmarFilaDTO[];
}

export interface ConfirmarPlanesImportResponse {
  status: string;
  message?: string;
  total_procesados?: number;
  planes_creados?: number;
  data?: any;
}