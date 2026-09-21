export type EstadoValidacionPadron = 
  | 'LISTO' 
  | 'DUPLICADO_EN_EXCEL' 
  | 'CLAVE_YA_EXISTE_EN_OBRA' 
  | 'DATOS_INVALIDOS';

export interface PadronImportItemDTO {
  fila_excel: number;
  clave_cliente: string;
  frentista_nombre: string | null;
  titular_nombre: string | null;
  metros_frente: number;
  calle: string | null;
  numero: string | null;
  lote_catast_muni: string | null;
  lote_catast_provincia: string | null;
  manzana: string | null;
  observacion: string | null;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  titular_email: string | null;
  titular_dni: string | null;
  titular_cuit: string | null;
  titular_telefono: string | null;
  estado_validacion: EstadoValidacionPadron;
  motivo_rechazo: string | null;
}

export interface PadronPreviewResponseData {
  total_filas: number;
  validos: number;
  con_errores: number;
  items: PadronImportItemDTO[];
}

export interface ConfirmarPadronResponseData {
  ok: boolean;
  mensaje: string;
  total_insertados: number;
}