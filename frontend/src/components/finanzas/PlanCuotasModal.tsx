import React, { useEffect, useState, useMemo } from 'react';
import type { CuentaCorrienteRow, CuotaConPagoDTO } from '../../types';
import { getCuotasByInmueble } from '../../api/cuotas.api';
import { getIndiceByObraYPeriodo } from '../../api/indices.api';
import { CobrarCuotaModal } from './CobrarCuotaModal';
import { X, CheckCircle2, Clock, AlertTriangle, CreditCard, Loader2, RefreshCw } from 'lucide-react';
import { calcularCuotasEnCascada, type CuotaCalculadaRow } from '../../utils/calcularCuotasEnCascada';
import { formatCurrencyAR, formatDateAR } from '../../utils/formatters';

interface Props {
  cuenta: CuentaCorrienteRow | null;
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const PlanCuotasModal: React.FC<Props> = ({
  cuenta,
  isOpen,
  onClose,
  showToast,
}) => {
  const [cuotas, setCuotas] = useState<CuotaConPagoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIcc, setLoadingIcc] = useState<number | null>(null);
  const [selectedCuotaCobro, setSelectedCuotaCobro] = useState<CuotaConPagoDTO | null>(null);

  // Almacena los porcentajes manuales ingresados para cada cuota { [id_cuota]: number }
  const [ajustesPorc, setAjustesPorc] = useState<Record<number, number>>({});

  const fetchCuotas = async () => {
    if (!cuenta) return;
    try {
      setLoading(true);
      const data = await getCuotasByInmueble(cuenta.id_inmueble);
      setCuotas(data);
      setAjustesPorc({});
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al cargar las cuotas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && cuenta) {
      fetchCuotas();
    }
  }, [isOpen, cuenta]);

  const handleAjusteChange = (idCuota: number, valorStr: string) => {
    const val = parseFloat(valorStr) || 0;
    setAjustesPorc((prev) => ({ ...prev, [idCuota]: val }));
  };

  const handleConsultarIcc = async (cuota: CuotaConPagoDTO) => {
    if (!cuenta) return;
    try {
      setLoadingIcc(cuota.id_cuota);
      const idObra = (cuenta as any).id_obra || 1;
      const res = await getIndiceByObraYPeriodo(idObra, cuota.periodo);

      const coef = Number(res.coeficiente_incremento || 0);
      const variacionPorc = coef > 1 ? (coef - 1) * 100 : coef;

      setAjustesPorc((prev) => ({
        ...prev,
        [cuota.id_cuota]: Number(variacionPorc.toFixed(2)),
      }));

      showToast(
        `Índice ICC (${cuota.periodo}) aplicado: ${variacionPorc >= 0 ? '+' : ''}${variacionPorc.toFixed(2)}%`,
        'success'
      );
    } catch (err: any) {
      showToast(
        err.response?.data?.message || `No se encontró índice para el período ${cuota.periodo}`,
        'error'
      );
    } finally {
      setLoadingIcc(null);
    }
  };

  const cuotaBaseSemilla = useMemo(() => {
    const cuotaObra = cuotas.find((c) => c.concepto === 'RED_OBRA');
    if (cuotaObra) return Number(cuotaObra.monto_base || 0);
    return Number(cuenta?.cuota_base || 0);
  }, [cuotas, cuenta]);

  // CÁLCULO EN CASCADA AGRUPADO POR CONCEPTO
  const cuotasCalculadas = useMemo<CuotaCalculadaRow[]>(
    () => calcularCuotasEnCascada(cuotas, ajustesPorc),
    [cuotas, ajustesPorc]
  );

  if (!isOpen || !cuenta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono font-bold text-xs border border-brand-200">
                {cuenta.clave}
              </span>
              <h3 className="text-base font-bold text-slate-800">
                Plan de Cuotas • {cuenta.frentista_nombre || cuenta.titular_nombre || 'Sin Titular'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {cuenta.calle} {cuenta.numero || 'S/N'} — Mza: {cuenta.mza || '-'} | Lote Mun: {cuenta.lote_catast_muni || '-'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjetas de Resumen (5 Columnas) */}
        <div className="p-5 bg-slate-50/50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs shrink-0">
          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Metros Frente</span>
            <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">
              {Number(cuenta.metros_frente).toFixed(2)} m
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Costo Obra</span>
            <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">
              {formatCurrencyAR(cuenta.costo_obra)}
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Serv. Dom</span>
            <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">
              {formatCurrencyAR(cuenta.serv_dom)}
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Cuota Base Obra</span>
            <p className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
              {formatCurrencyAR(cuotaBaseSemilla)}
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-brand-600">Costo Total</span>
            <p className="text-sm font-black text-brand-600 font-mono mt-0.5">
              {formatCurrencyAR(cuenta.costo_total)}
            </p>
          </div>
        </div>

        {/* Tabla con Sticky Header y Scroll */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400 my-auto">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              <span className="text-xs">Cargando cuotas desde el servidor...</span>
            </div>
          ) : cuotas.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl my-auto">
              No hay cuotas emitidas registradas para este inmueble.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-x-auto overflow-y-auto max-h-[50vh] relative shadow-xs">
              <table className="w-full text-left text-xs text-slate-600 whitespace-nowrap min-w-[950px] border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0 z-[5]">
                  <tr>
                    <th className="px-3 py-3 bg-slate-50 sticky top-0">Cuota</th>
                    <th className="px-3 py-3 bg-slate-50 sticky top-0">Concepto</th>
                    <th className="px-3 py-3 bg-slate-50 sticky top-0">Período</th>
                    <th className="px-3 py-3 bg-slate-50 sticky top-0">Vencimiento</th>
                    <th className="px-3 py-3 bg-slate-50 text-right sticky top-0">CUOTA</th>
                    <th className="px-3 py-3 bg-slate-50 text-center sticky top-0">AJUSTE (%) / ICC</th>
                    <th className="px-3 py-3 bg-slate-50 text-right sticky top-0">CUOTA ACTUALIZADA</th>
                    <th className="px-3 py-3 bg-slate-50 text-center sticky top-0">Estado</th>
                    <th className="px-3 py-3 bg-slate-50 sticky top-0">Cobro / Comprobante</th>
                    <th className="px-3 py-3 bg-slate-50 text-center sticky top-0">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {cuotasCalculadas.map((c) => {
                    const isPagada = c.estado === 'PAGADA';
                    const isVencida = c.estado === 'PENDIENTE' && new Date(c.fecha_vencimiento) < new Date();

                    return (
                      <tr key={c.id_cuota} className="hover:bg-slate-50/70 transition">
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-800">
                          #{c.nro_cuota.toString().padStart(2, '0')}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {c.concepto || 'RED_OBRA'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-700">{c.periodo}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">
                          {formatDateAR(c.fecha_vencimiento)}
                        </td>
                        
                        {/* 1. CUOTA BASE ARRASTRADA */}
                        <td className="px-3 py-2.5 font-mono text-right text-slate-600">
                          ${formatCurrencyAR(c.cuotaBaseCalculada)}
                        </td>

                        {/* 2. AJUSTE (%) / ICC */}
                        <td className="px-3 py-2 text-center">
                          {isPagada ? (
                            <span
                              className={`text-[11px] font-mono font-bold ${
                                c.porcentajeAplicado > 0.001
                                  ? 'text-amber-700'
                                  : c.porcentajeAplicado < -0.001
                                  ? 'text-rose-600'
                                  : 'text-slate-500'
                              }`}
                            >
                              {c.porcentajeAplicado > 0.001 ? '+' : ''}
                              {c.porcentajeAplicado.toFixed(2)}%
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <div className="relative w-20">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={ajustesPorc[c.id_cuota] ?? 0}
                                  onChange={(e) => handleAjusteChange(c.id_cuota, e.target.value)}
                                  className="w-full px-1.5 py-0.5 pr-4 border border-slate-200 rounded text-right font-mono text-[11px] outline-none focus:border-brand-500 font-medium"
                                />
                                <span className="absolute right-1 top-0.5 text-[10px] text-slate-400">%</span>
                              </div>
                              <button
                                type="button"
                                disabled={loadingIcc === c.id_cuota}
                                onClick={() => handleConsultarIcc(c)}
                                title="Consultar índice ICC oficial"
                                className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded border border-amber-200 transition disabled:opacity-50"
                              >
                                <RefreshCw
                                  className={`w-3 h-3 ${loadingIcc === c.id_cuota ? 'animate-spin text-amber-800' : ''}`}
                                />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 3. CUOTA ACTUALIZADA */}
                        <td className="px-3 py-2.5 font-mono text-right font-bold text-slate-900">
                          {formatCurrencyAR(c.cuotaActualizadaCalculada)}
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          {isPagada ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Pagada
                            </span>
                          ) : isVencida ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" /> Vencida
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">
                          {c.fecha_pago ? `${formatDateAR(c.fecha_pago)} (${c.comprobante || c.medio_pago || 'S/N'})` : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {!isPagada && (
                            <button
                              onClick={() => {
                                setSelectedCuotaCobro({
                                  ...c,
                                  monto_actualizado: Number(c.cuotaActualizadaCalculada.toFixed(2)),
                                });
                              }}
                              className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-[10px] font-bold flex items-center gap-1 mx-auto transition shadow-xs"
                            >
                              <CreditCard className="w-3 h-3" /> Cobrar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>

      {/* Modal Secundario de Cobro */}
      <CobrarCuotaModal
        cuota={selectedCuotaCobro}
        isOpen={Boolean(selectedCuotaCobro)}
        onClose={() => setSelectedCuotaCobro(null)}
        onSuccess={fetchCuotas}
        showToast={showToast}
      />
    </div>
  );
};