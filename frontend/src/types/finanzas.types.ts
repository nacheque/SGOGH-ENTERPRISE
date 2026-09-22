// ==========================================
// ENTIDAD DE CUENTA CORRIENTE (ficha individual por inmueble)
// ==========================================
export interface CuentaCorrienteRow {
  id_inmueble: number;
  id_obra: number;
  id_contrato: number | null;
  tiene_contrato: boolean;
  clave?: string;
  frentista_nombre: string | null;
  titular_nombre: string | null;
  metros_frente: number;
  calle: string;
  numero: string | null;
  mza: string | null;
  lote_catast_muni: string | null;
  lote_catast_provincia: string | null;
  observacion: string | null;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  dni: string | null;
  cuil: string | null;
  telefono: string | null;
  email: string | null;
  precio_x_metro: number;
  costo_obra: number;
  serv_dom: number;
  costo_total: number;
  plan_pagos: number | null;
  cuota_base: number;
  monto_anticipo: number;
  tipo_indexacion: 'ICC' | 'FIJO' | null;
  estado: 'ACTIVO' | 'SIN_PLAN';
  cuota_vigente_actual: number;
}