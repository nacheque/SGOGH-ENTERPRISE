export interface RegistrarPagoPayload {
  monto_pagado: number;
  fecha_pago: string; // "YYYY-MM-DD"
  medio_pago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'ECHEQ' | string;
  observaciones?: string;
  // Metadatos condicionales para custodia de valores
  numero_cheque?: string;
  banco_emisor?: string;
  cuit_librador?: string;
  fecha_emision?: string;
  fecha_cobro?: string;
}

export interface RegistrarPagoResponseDTO {
  id_pago: number;
  message?: string;
}

export interface ReciboDatosDTO {
  id_pago: number;
  nro_recibo: string;
  fecha_pago: string;
  titular_nombre: string;
  titular_dni: string;
  monto_pagado: number;
  nro_cuota: number;
  concepto_cuota: string;
  obra_nombre: string;
  obra_localidad: string;
  medio_pago: string;
  detalle_medio_pago?: string;
  nomenclatura_lote: string;
}