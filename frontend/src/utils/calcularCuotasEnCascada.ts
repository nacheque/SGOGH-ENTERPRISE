import type { CuotaConPagoDTO } from '../types';

export interface CuotaCalculadaRow extends CuotaConPagoDTO {
  cuotaBaseCalculada: number;
  porcentajeAplicado: number;
  cuotaActualizadaCalculada: number;
}

/**
 * Calcula en cascada el valor acumulado de las cuotas agrupadas por concepto.
 * - La primera cuota toma como base el monto_base semilla.
 * - Las siguientes cuotas arrastran el valor liquidado o proyectado de la anterior.
 * - Respeta los pagos ya asentados y aplica ajustes dinámicos sobre las pendientes.
 */
export const calcularCuotasEnCascada = (
  cuotas: CuotaConPagoDTO[],
  ajustesPorc: Record<number, number>
): CuotaCalculadaRow[] => {
  if (!cuotas || cuotas.length === 0) return [];

  // 1. Agrupar por concepto
  const grupos: Record<string, CuotaConPagoDTO[]> = {};
  cuotas.forEach((c) => {
    const conc = c.concepto || 'RED_OBRA';
    if (!grupos[conc]) grupos[conc] = [];
    grupos[conc].push(c);
  });

  const mapaCalculado: Record<number, CuotaCalculadaRow> = {};

  // 2. Procesar la cascada en cada concepto
  Object.values(grupos).forEach((listaCuotas) => {
    let valorArrastre = 0;

    listaCuotas.forEach((c, index) => {
      const montoBaseOriginal = Number(c.monto_base || 0);
      const isPagada = c.estado === 'PAGADA';

      let baseParaEstaCuota = 0;
      let porcentaje = 0;
      let valorFinal = 0;

      if (index === 0) {
        // Primera cuota del concepto: arranca desde el monto_base semilla
        baseParaEstaCuota = montoBaseOriginal;
        if (isPagada) {
          valorFinal = Number(c.monto || c.monto_actualizado || montoBaseOriginal);
          porcentaje = baseParaEstaCuota > 0 ? ((valorFinal - baseParaEstaCuota) / baseParaEstaCuota) * 100 : 0;
        } else {
          porcentaje = ajustesPorc[c.id_cuota] ?? 0;
          valorFinal = baseParaEstaCuota * (1 + porcentaje / 100);
        }
      } else {
        // Cuota subsiguiente: arrastra el valor liquidado/actualizado de la cuota anterior
        baseParaEstaCuota = valorArrastre;
        if (isPagada) {
          valorFinal = Number(c.monto || c.monto_actualizado || baseParaEstaCuota);
          porcentaje = baseParaEstaCuota > 0 ? ((valorFinal - baseParaEstaCuota) / baseParaEstaCuota) * 100 : 0;
        } else {
          porcentaje = ajustesPorc[c.id_cuota] ?? 0;
          valorFinal = baseParaEstaCuota * (1 + porcentaje / 100);
        }
      }

      valorArrastre = valorFinal;

      mapaCalculado[c.id_cuota] = {
        ...c,
        cuotaBaseCalculada: baseParaEstaCuota,
        porcentajeAplicado: porcentaje,
        cuotaActualizadaCalculada: valorFinal,
      };
    });
  });

  // 3. Devolver respetando el orden original del listado
  return cuotas.map((c) => mapaCalculado[c.id_cuota]);
};