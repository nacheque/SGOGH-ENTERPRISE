// ==========================================
// INTERFACES DE CUOTAS Y PAGOS
// ==========================================
export type EstadoCuota = 'PENDIENTE' | 'PAGADA' | 'PAGO_PARCIAL' | 'VENCIDA';
export type MedioPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'ECHEQ' | 'SIRO_ROELA' | string;

export interface Cuota {
  id_cuota: number;
  id_contrato?: number;
  id_inmueble: number;
  clave_cliente?: string;
  nro_cuota: number;
  concepto: 'RED_OBRA' | 'GABINETE' | 'ANTICIPO' | string;
  periodo: string;
  fecha_vencimiento?: string;
  monto_base: number;
  monto_actualizado: number; // Valor nominal contractual del mes
  saldo_remanente: number;   // Deuda viva exigible
  total_abonado?: number;
  porcentaje_actualizacion?: number;
  coeficiente_actualizacion?: number;
  indice_aplicado?: number;
  porcentaje_mensual?: number;
  estado: EstadoCuota;
}

export interface CreatePagoDTO {
  id_cuota: number;
  monto: number;
  porcentaje_actualizacion?: number;
  fecha_pago?: string | null; // 'YYYY-MM-DD'
  medio_pago: MedioPago;
  comprobante?: string | null;
  observaciones?: string | null;
}

export interface PagoResponseDTO {
  id_pago: number;
  id_cuota: number;
  monto: string | number;
  fecha_pago: string;
  medio_pago: string;
  comprobante: string | null;
  observaciones?: string | null;
}

export interface CuotaConPagoDTO extends Cuota {
  id_pago?: number | null;
  monto?: string | number | null;
  fecha_pago?: string | null;
  medio_pago?: string | null;
  comprobante?: string | null;
  ultima_fecha_pago?: string | null;
  ultimo_comprobante?: string | null;
  pagos?: PagoResponseDTO[];
}

// ==========================================
// INDICES DE ACTUALIZACION DE CUOTAS
// ==========================================
export interface CreateIndiceDTO {
  id_obra: number;
  periodo: string; // Formato 'YYYY-MM'
  porcentaje_variacion: number; // Ej: 1.99
}

export interface IndiceActualizacionResponseDTO {
  id_indice: number;
  id_obra: number;
  periodo: string;
  coeficiente_incremento: string | number;
}

export interface RegistroIndiceResultadoDTO {
  indice: IndiceActualizacionResponseDTO;
  cuotas_actualizadas: number;
  mensaje: string;
}

// ==========================================
// CARTERA DE CHEQUES Y ECHEQS
// ==========================================

export interface ChequeCarteraDTO {
  id_pago: number;
  id_cuota: number;
  monto: number;
  fecha_pago: string;
  medio_pago: 'CHEQUE' | 'ECHEQ';
  numero_cheque: string;
  banco_emisor: string;
  cuit_librador: string;
  fecha_emision: string;
  fecha_cobro: string;
  comprobante: string | null;
  nro_cuota: number;
  concepto: string;
  id_inmueble: number;
  clave_cliente: string;
  calle: string;
  numero: string | null;
  manzana: string | null;
  lote: string | null;
  id_obra: number;
  obra_nombre: string;
  titular_nombre: string;
  titular_cuit: string | null;
  estado_custodia: 'EN_CARTERA' | 'DISPONIBLE' | 'VENCIDO';
  dias_para_cobro: number;
}

// Extensión para pagos mediante valores (Cheque físico o ECHEQ)
export interface CreatePagoConChequeDTO extends CreatePagoDTO {
  numero_cheque: string;
  banco_emisor: string;
  cuit_librador: string;
  fecha_emision: string;
  fecha_cobro: string;
}