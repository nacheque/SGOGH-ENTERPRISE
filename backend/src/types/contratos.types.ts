export interface CreateContratoDTO {
  id_inmueble: number;
  plan_cuotas_obra: number;
  plan_cuotas_gabinete?: number | null;
  tipo_indexacion?: string;
  fecha_primer_vencimiento: string; // Formato 'YYYY-MM-DD'
}

export interface CuotaInsertDTO {
  id_contrato: number;
  concepto: 'RED_OBRA' | 'GABINETE';
  nro_cuota: number;
  periodo: string; // 'YYYY-MM'
  monto_base: number;
  monto_actualizado: number;
  fecha_vencimiento: string; // 'YYYY-MM-DD'
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA';
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