import React, { useEffect, useState } from 'react';
import type { CuentaCorrienteRow, CuotaConPagoDTO } from '../../types';
import { getCuotasByInmueble } from '../../api/cuotas.api';
import { CobrarCuotaModal } from './CobrarCuotaModal';
import { X, CheckCircle2, Clock, AlertTriangle, CreditCard, Loader2, RefreshCw } from 'lucide-react';

interface Props {
  cuenta: CuentaCorrienteRow | null;
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const formatearFecha = (fechaStr?: string | null) => {
  if (!fechaStr) return '-';
  const soloFecha = fechaStr.split('T')[0];
  const [anio, mes, dia] = soloFecha.split('-');
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : soloFecha;
};

export const PlanCuotasModal: React.FC<Props> = ({
  cuenta,
  isOpen,
  onClose,
  showToast,
}) => {
  const [cuotas, setCuotas] = useState<CuotaConPagoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCuotaCobro, setSelectedCuotaCobro] = useState<CuotaConPagoDTO | null>(null);

  // Estado para ajustes de porcentaje por cuota { [id_cuota]: number }
  const [ajustesPorc, setAjustesPorc] = useState<Record<number, number>>({});

  const fetchCuotas = async () => {
    if (!cuenta) return;
    try {
      setLoading(true);
      const data = await getCuotasByInmueble(cuenta.id_inmueble);
      setCuotas(data);

      // Inicializar porcentajes según los montos base y actualizado que vienen del back
      const initialAjustes: Record<number, number> = {};
      data.forEach((c) => {
        const mBase = Number(c.monto_base || 0);
        const mAct = Number(c.monto_actualizado || 0);
        initialAjustes[c.id_cuota] = mBase > 0 ? Number((((mAct - mBase) / mBase) * 100).toFixed(2)) : 0;
      });
      setAjustesPorc(initialAjustes);
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

  // Simulación de consulta al índice ICC (ej. 4.2% mensual acumulado)
  const handleConsultarIcc = (idCuota: number) => {
    const porcentajeIccSimulado = 4.25;
    setAjustesPorc((prev) => ({ ...prev, [idCuota]: porcentajeIccSimulado }));
    showToast(`Índice ICC aplicado: +${porcentajeIccSimulado}%`, 'success');
  };

  if (!isOpen || !cuenta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
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
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen */}
        <div className="p-5 bg-slate-50/50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Metros Frente</span>
            <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{Number(cuenta.metros_frente).toFixed(2)} m</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Costo Obra</span>
            <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">
              ${Number(cuenta.costo_obra).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Serv. Dom</span>
            <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">
              ${Number(cuenta.serv_dom).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-brand-600">Costo Total</span>
            <p className="text-sm font-black text-brand-600 font-mono mt-0.5">
              ${Number(cuenta.costo_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Grilla de Cuotas con Scroll Horizontal y Vertical */}
        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              <span className="text-xs">Cargando cuotas desde el servidor...</span>
            </div>
          ) : cuotas.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              No hay cuotas emitidas registradas para este inmueble.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 whitespace-nowrap min-w-[950px]">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Cuota</th>
                    <th className="px-3 py-2.5">Concepto</th>
                    <th className="px-3 py-2.5">Período</th>
                    <th className="px-3 py-2.5">Vencimiento</th>
                    <th className="px-3 py-2.5 text-right">Monto Base</th>
                    <th className="px-3 py-2.5 text-center">Ajuste (%) / ICC</th>
                    <th className="px-3 py-2.5 text-right">Importe Actual</th>
                    <th className="px-3 py-2.5 text-center">Estado</th>
                    <th className="px-3 py-2.5">Cobro / Comprobante</th>
                    <th className="px-3 py-2.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {cuotas.map((c) => {
                    const isVencida = c.estado === 'PENDIENTE' && new Date(c.fecha_vencimiento) < new Date();
                    const montoBase = Number(c.monto_base || 0);
                    const porcAjuste = ajustesPorc[c.id_cuota] ?? 0;
                    const importeCalculado = montoBase * (1 + porcAjuste / 100);

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
                          {formatearFecha(c.fecha_vencimiento)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-right text-slate-600">
                          ${montoBase.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Columna de Ajuste con Input y Botón ICC */}
                        <td className="px-3 py-2 text-center">
                          {c.estado === 'PAGADA' ? (
                            <span className="text-[11px] font-mono text-slate-500">
                              {porcAjuste > 0 ? `+${porcAjuste.toFixed(2)}%` : '0.00%'}
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <div className="relative w-20">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={porcAjuste}
                                  onChange={(e) => handleAjusteChange(c.id_cuota, e.target.value)}
                                  className="w-full px-1.5 py-0.5 pr-4 border border-slate-200 rounded text-right font-mono text-[11px] outline-none focus:border-brand-500"
                                />
                                <span className="absolute right-1 top-0.5 text-[10px] text-slate-400">%</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleConsultarIcc(c.id_cuota)}
                                title="Consultar índice ICC oficial"
                                className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded border border-amber-200 transition"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-2.5 font-mono text-right font-bold text-slate-900">
                          ${importeCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {c.estado === 'PAGADA' ? (
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
                          {c.fecha_pago ? `${formatearFecha(c.fecha_pago)} (${c.comprobante || c.medio_pago || 'S/N'})` : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {c.estado !== 'PAGADA' && (
                            <button
                              onClick={() => {
                                setSelectedCuotaCobro({
                                  ...c,
                                  monto_actualizado: importeCalculado,
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
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition">
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