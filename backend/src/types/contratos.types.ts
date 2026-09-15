export type EstadoCuota = 'PENDIENTE' | 'PAGADA' | 'PAGO_PARCIAL' | 'VENCIDA';

export interface CreateContratoDTO {
  id_inmueble: number;
  plan_cuotas_obra: number;
  plan_cuotas_gabinete?: number | null;
  tipo_indexacion?: 'ICC' | 'FIJO';
  monto_anticipo?: number | null;
  fecha_primer_vencimiento: string; // Formato 'YYYY-MM-DD'
}

export interface CuotaInsertDTO {
  id_contrato: number;
  concepto: 'RED_OBRA' | 'GABINETE' | 'ANTICIPO';
  nro_cuota: number;
  periodo: string; // Formato 'YYYY-MM'
  monto_base: number;
  monto_actualizado: number;
  saldo_remanente: number; // Inicialmente igual a monto_actualizado al generar el plan
  fecha_vencimiento: string; // Formato 'YYYY-MM-DD'
  estado: EstadoCuota;
}

export interface CuotaResponseDTO {
  id_cuota: number;
  id_contrato: number;
  concepto: string;
  nro_cuota: number;
  periodo: string;
  monto_base: string | number;
  monto_actualizado: string | number; // Valor nominal contractual indexado (inmutable)
  saldo_remanente: string | number;   // Deuda viva exigible restante (disminuye con pagos)
  fecha_vencimiento: string;
  estado: EstadoCuota;
}

export interface ContratoResponseDTO {
  id_contrato: number;
  id_inmueble: number;
  plan_cuotas_obra: number;
  monto_total_obra: string | number;
  plan_cuotas_gabinete: number | null;
  monto_total_gabinete: string | number | null;
  fecha_alta: string;
  tipo_indexacion: string;
  cuotas_generadas?: number;
}