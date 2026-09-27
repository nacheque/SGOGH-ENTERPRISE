import type { PagoResponseDTO } from './pagos.types';

// Reexportamos para retrocompatibilidad total
export type { MedioPago, CreatePagoDTO, PagoResponseDTO, ChequeCarteraDTO, CreatePagoConChequeDTO } from './pagos.types';

// ==========================================
// INTERFACES DE CUOTAS
// ==========================================
export type EstadoCuota = 'PENDIENTE' | 'PAGADA' | 'PAGO_PARCIAL' | 'VENCIDA';

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