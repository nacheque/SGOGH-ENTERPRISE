import React, { useState, useEffect } from 'react';
import type { CuentaCorrienteRow, CuotaConPagoDTO } from '../../types';
import api from '../../api/axios';
import { CobrarCuotaModal } from './CobrarCuotaModal';
import { HistorialPagosSubRow } from './HistorialPagosSubRow';
import {
  X,
  Receipt,
  AlertCircle,
  PlusCircle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Check,
  ChevronDown,
  ReceiptText,
} from 'lucide-react';

interface Props {
  cuenta: CuentaCorrienteRow | null;
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onPlanCreado?: () => void;
}

export const PlanCuotasModal: React.FC<Props> = ({
  cuenta,
  isOpen,
  onClose,
  showToast,
  onPlanCreado,
}) => {
  const [cuotas, setCuotas] = useState<CuotaConPagoDTO[]>([]);
  const [loadingCuotas, setLoadingCuotas] = useState(false);
  const [modoEmision, setModoEmision] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState(false);

  // Estado para controlar qué filas tienen el acordeón de pagos abierto
  const [expandedCuotas, setExpandedCuotas] = useState<Set<number>>(new Set());

  // Estado para la imputación de cobros
  const [cuotaACobrar, setCuotaACobrar] = useState<CuotaConPagoDTO | null>(null);

  // Estados del Formulario de Parametrización (Emisión)
  const [tipoIndexacion, setTipoIndexacion] = useState<'ICC' | 'FIJO'>('ICC');
  const [anticipo, setAnticipo] = useState<number>(0);
  const [planCuotasObra, setPlanCuotasObra] = useState<number>(12);
  const [planCuotasGabinete, setPlanCuotasGabinete] = useState<number>(1);
  const [fechaPrimerVencimiento, setFechaPrimerVencimiento] = useState<string>('');

  // Alternar el estado de expansión de una cuota
  const toggleCuotaExpansion = (idCuota: number) => {
    setExpandedCuotas((prev) => {
      const next = new Set(prev);
      if (next.has(idCuota)) {
        next.delete(idCuota);
      } else {
        next.add(idCuota);
      }
      return next;
    });
  };

  // Inicializar fecha de vencimiento por defecto (día 10 del mes siguiente)
  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 10);
    const yyyy = nextMonth.getFullYear();
    const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const dd = String(nextMonth.getDate()).padStart(2, '0');
    setFechaPrimerVencimiento(`${yyyy}-${mm}-${dd}`);
  }, [isOpen]);

  // Cargar cuotas forzando bypass de caché HTTP 304
  const fetchCuotas = async (idInmueble: number) => {
    try {
      setLoadingCuotas(true);
      const res = await api.get(`/cuotas/inmueble/${idInmueble}`, {
        params: { _t: Date.now() },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      const rawList = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      const formatted: CuotaConPagoDTO[] = rawList.map((c: any) => {
        const base = Number(c.monto_base || 0);
        const act = Number(c.monto_actualizado ?? base);
        const remanente = Number(c.saldo_remanente ?? (c.estado === 'PAGADA' ? 0 : act));

        return {
          ...c,
          monto_base: base,
          monto_actualizado: act,
          saldo_remanente: remanente,
          porcentaje_actualizacion: Number(c.porcentaje_actualizacion || 0),
          total_abonado: Number(c.total_abonado || 0),
          pagos: Array.isArray(c.pagos) ? c.pagos : [],
        };
      });

      setCuotas(formatted);
    } catch (err: any) {
      setCuotas([]);
    } finally {
      setLoadingCuotas(false);
    }
  };

  useEffect(() => {
    if (isOpen && cuenta) {
      setModoEmision(false);
      setAnticipo(0);
      setPlanCuotasObra(12);
      setPlanCuotasGabinete(1);
      setExpandedCuotas(new Set());
      fetchCuotas(cuenta.id_inmueble);
    } else {
      setCuotas([]);
      setExpandedCuotas(new Set());
    }
  }, [isOpen, cuenta]);

  if (!isOpen || !cuenta) return null;

  const costoObra = Number(cuenta.costo_obra) || 0;
  const servDom = cuenta.conexion_gabinete ? Number(cuenta.serv_dom) || 0 : 0;
  const metrosFrenteNum = Number(cuenta.metros_frente) || 0;
  const saldoFinanciarObra = Math.max(0, costoObra - (Number(anticipo) || 0));

  const cantCuotasObra = Number(planCuotasObra) > 0 ? Number(planCuotasObra) : 1;
  const cuotaBaseObraSimulada = saldoFinanciarObra / cantCuotasObra;

  const cantCuotasGab = Number(planCuotasGabinete) > 0 ? Number(planCuotasGabinete) : 1;
  const cuotaBaseGabineteSimulada = servDom > 0 ? servDom / cantCuotasGab : 0;

  /**
   * Obtiene la cuota previa DEL MISMO CONCEPTO ordenada por período.
   */
  const getCuotaPrevia = (cuotaActual: CuotaConPagoDTO) => {
    return (
      cuotas
        .filter(
          (c) =>
            c.concepto === cuotaActual.concepto &&
            String(c.periodo || '') < String(cuotaActual.periodo || '')
        )
        .sort((a, b) => String(a.periodo).localeCompare(String(b.periodo)))
        .pop() || null
    );
  };

  const handleEmitirPlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (anticipo >= costoObra && costoObra > 0) {
      showToast('El anticipo no puede ser mayor o igual al costo total de la obra.', 'error');
      return;
    }
    if (planCuotasObra <= 0) {
      showToast('Debe seleccionar un plan de cuotas de obra válido.', 'error');
      return;
    }
    if (!fechaPrimerVencimiento) {
      showToast('La fecha del primer vencimiento es obligatoria.', 'error');
      return;
    }

    try {
      setSubmittingPlan(true);
      await api.post('/contratos', {
        id_inmueble: cuenta.id_inmueble,
        plan_cuotas_obra: Number(planCuotasObra),
        plan_cuotas_gabinete: cuenta.conexion_gabinete ? Number(planCuotasGabinete) : null,
        tipo_indexacion: tipoIndexacion,
        monto_anticipo: Number(anticipo) || 0,
        fecha_primer_vencimiento: fechaPrimerVencimiento,
      });

      showToast('Plan de pagos emitido exitosamente', 'success');
      setModoEmision(false);
      await fetchCuotas(cuenta.id_inmueble);
      onPlanCreado?.();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al emitir el plan de pagos';
      showToast(errorMsg, 'error');
    } finally {
      setSubmittingPlan(false);
    }
  };

  /**
   * Obtiene el monto proyectado para una cuota PENDIENTE de RED_OBRA.
   * Si no tiene porcentaje propio, busca el valor contractual de la última cuota anterior del mismo concepto.
   */
  const getMontoProyectadoPendiente = (cuotaActual: CuotaConPagoDTO): number => {
    if (cuotaActual.concepto !== 'RED_OBRA') {
      return Number(cuotaActual.monto_actualizado || cuotaActual.monto_base || 0);
    }

    if (Number(cuotaActual.porcentaje_actualizacion || 0) > 0) {
      return Number(cuotaActual.monto_actualizado || 0);
    }

    const cuotasPrevias = cuotas
      .filter(
        (c) =>
          c.concepto === cuotaActual.concepto &&
          String(c.periodo || '') < String(cuotaActual.periodo || '')
      )
      .sort((a, b) => String(a.periodo).localeCompare(String(b.periodo)));

    const cuotaAnterior = cuotasPrevias.pop();

    if (cuotaAnterior) {
      const montoPiso =
        cuotaAnterior.estado === 'PENDIENTE' && Number(cuotaAnterior.porcentaje_actualizacion || 0) === 0
          ? getMontoProyectadoPendiente(cuotaAnterior)
          : Number(cuotaAnterior.monto_actualizado || cuotaAnterior.monto_base || 0);

      return montoPiso;
    }

    return Number(cuotaActual.monto_actualizado || cuotaActual.monto_base || 0);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Cabecera */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Ficha Financiera y Plan de Pagos
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {cuenta.frentista_nombre || 'Sin frentista'} • {cuenta.calle} {cuenta.numero || 'S/N'}{' '}
                  (Clave: {cuenta.clave || '-'})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Resumen Superior */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Costo Obra</span>
              <span className="font-bold text-slate-800">${costoObra.toLocaleString('es-AR')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Conexión Gabinete</span>
              <span className="font-bold text-slate-800">
                {cuenta.conexion_gabinete ? `$${servDom.toLocaleString('es-AR')}` : 'No Incluye'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Costo Total Inicial</span>
              <span className="font-bold text-brand-600">
                ${(costoObra + servDom).toLocaleString('es-AR')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Frente / Metros</span>
              <span className="font-bold text-slate-800">{metrosFrenteNum.toFixed(2)} m</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cuota Base</span>
              <span className="font-bold text-emerald-600">
                ${(Number(cuenta.cuota_base) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6">
            {loadingCuotas ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                <span className="text-xs">Cargando estado del contrato...</span>
              </div>
            ) : cuotas.length === 0 ? (
              !modoEmision ? (
                <div className="py-16 text-center space-y-4">
                  <div className="inline-flex p-3 bg-amber-50 text-amber-600 rounded-full">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">
                      Inmueble sin Plan de Pagos Emitido
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Este lote no cuenta con un contrato formal ni cuotas de amortización generadas.
                    </p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setModoEmision(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" /> + Generar Plan de Pagos
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEmitirPlan} className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModoEmision(false)}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Configuración del Nuevo Plan de Pagos
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md font-semibold">
                      Emisión de Contrato
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Modalidad de Ajuste
                      </label>
                      <select
                        value={tipoIndexacion}
                        onChange={(e) => setTipoIndexacion(e.target.value as 'ICC' | 'FIJO')}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-brand-500 focus:bg-white outline-none transition"
                      >
                        <option value="ICC">Ajustable por ICC (Índice Costo Construcción)</option>
                        <option value="FIJO">Cuotas Fijas (Sin ajuste)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Anticipo / Inversión Inicial ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={anticipo}
                          onChange={(e) => setAnticipo(Number(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:border-brand-500 focus:bg-white outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cantidad de Cuotas Obra
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        step={1}
                        value={planCuotasObra || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setPlanCuotasObra(isNaN(val) ? 0 : Math.max(1, val));
                        }}
                        placeholder="Ej: 2, 6, 12, 24"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:border-brand-500 focus:bg-white outline-none transition"
                      />
                    </div>

                    {cuenta.conexion_gabinete && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Cantidad de Cuotas Gabinete
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          step={1}
                          value={planCuotasGabinete || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setPlanCuotasGabinete(isNaN(val) ? 0 : Math.max(1, val));
                          }}
                          placeholder="Ej: 1, 2, 3, 6"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:border-brand-500 focus:bg-white outline-none transition"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Fecha Primer Vencimiento
                      </label>
                      <input
                        type="date"
                        value={fechaPrimerVencimiento}
                        onChange={(e) => setFechaPrimerVencimiento(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-brand-500 focus:bg-white outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Panel de Simulación */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <TrendingUp className="w-4 h-4 text-brand-600" />
                      <span>Simulación Reactiva de Amortización</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Saldo a Financiar (Obra)
                        </span>
                        <span className="text-sm font-bold font-mono text-slate-900">
                          ${saldoFinanciarObra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Cuota Base Obra Estimada
                        </span>
                        <span className="text-sm font-bold font-mono text-emerald-600">
                          ${cuotaBaseObraSimulada.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          x {cantCuotasObra} mes(es)
                        </span>
                      </div>

                      {cuenta.conexion_gabinete && (
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Cuota Gabinete Estimada
                          </span>
                          <span className="text-sm font-bold font-mono text-blue-600">
                            ${cuotaBaseGabineteSimulada.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-sans">
                            x {cantCuotasGab} mes(es)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModoEmision(false)}
                      disabled={submittingPlan}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPlan}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                    >
                      {submittingPlan ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Emitiendo...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Confirmar y Emitir Plan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )
            ) : (
              /* Tabla de Cuotas */
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-center">Nº</th>
                      <th className="px-3 py-2.5">Concepto</th>
                      <th className="px-3 py-2.5">Período</th>
                      <th className="px-3 py-2.5">Vencimiento</th>
                      <th className="px-3 py-2.5 text-center w-28">Índice</th>
                      <th className="px-3 py-2.5 text-right">Actualizado / A Cobrar</th>
                      <th className="px-3 py-2.5 text-center">Estado / Pagos</th>
                      <th className="px-3 py-2.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {cuotas.map((c) => {
                      const estadoNormalizado = String(c.estado || '').toUpperCase().trim();
                      const isPagado = estadoNormalizado === 'PAGADA' || estadoNormalizado === 'PAGADO';
                      const isPagoParcial = estadoNormalizado === 'PAGO_PARCIAL';
                      const esObra = c.concepto === 'RED_OBRA';

                      const porcentajeMostrado = Number(c.porcentaje_actualizacion || 0);
                      const saldoRemanente = Number(c.saldo_remanente ?? 0);
                      const puedeCobrar = saldoRemanente > 0.01 && !isPagado;

                      // Control de Acordeón
                      const isExpanded = expandedCuotas.has(c.id_cuota);
                      const pagosList = Array.isArray(c.pagos) ? c.pagos : [];
                      const tienePagos = pagosList.length > 0;

                      return (
                        <React.Fragment key={c.id_cuota}>
                          <tr className={`hover:bg-slate-50/70 transition ${isExpanded ? 'bg-slate-50/60' : ''}`}>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-700">
                              {c.nro_cuota}
                            </td>
                            <td className="px-3 py-2.5 font-sans font-medium text-slate-800">
                              {c.concepto === 'RED_OBRA' ? 'Cuota Obra' : c.concepto}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 font-sans">
                              {c.periodo || '-'}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500">
                              {c.fecha_vencimiento
                                ? new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')
                                : '-'}
                            </td>

                            {/* Columna ÍNDICE */}
                            <td className="px-3 py-2.5 text-center font-sans">
                              {!esObra ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[11px] font-semibold">
                                  0.00 % <span className="text-[10px] text-slate-400 font-sans">(Fijo)</span>
                                </span>
                              ) : (
                                <span
                                  className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                                    isPagado ? 'text-slate-400 bg-slate-50' : 'text-slate-700 bg-slate-100/70'
                                  }`}
                                >
                                  {porcentajeMostrado > 0 ? `+${porcentajeMostrado}%` : `${porcentajeMostrado}%`}
                                </span>
                              )}
                            </td>

                            {/* Columna ACTUALIZADO / A COBRAR */}
                            <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                              {isPagoParcial ? (
                                <div>
                                  <span className="text-amber-700">
                                    ${saldoRemanente.toLocaleString('es-AR', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                  <span className="block text-[10px] text-amber-600 font-sans font-normal">
                                    (Saldo remanente)
                                  </span>
                                </div>
                              ) : isPagado ? (
                                <div className="inline-flex items-center justify-end gap-1.5 font-mono text-xs text-emerald-700 bg-emerald-50/80 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>
                                    ${Number(c.monto_actualizado || c.monto_base || 0).toLocaleString('es-AR', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              ) : (
                                <span>
                                  ${getMontoProyectadoPendiente(c).toLocaleString('es-AR', {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              )}
                            </td>

                            {/* Estado + Pill Desplegable de Pagos */}
                            <td className="px-3 py-2.5 text-center font-sans">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isPagado
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : isPagoParcial
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {isPagoParcial ? 'PAGO PARCIAL' : c.estado}
                                </span>

                                {tienePagos && (
                                  <button
                                    type="button"
                                    onClick={() => toggleCuotaExpansion(c.id_cuota)}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition shadow-2xs cursor-pointer border ${
                                      isExpanded
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                    }`}
                                    title="Ver desglose histórico de comprobantes y cobros"
                                  >
                                    <ReceiptText className="w-3 h-3" />
                                    <span>{pagosList.length} {pagosList.length === 1 ? 'pago' : 'pagos'}</span>
                                    <ChevronDown
                                      className={`w-3 h-3 transition-transform duration-200 ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Acción de Cobro */}
                            <td className="px-3 py-2.5 text-center font-sans">
                              {isPagado ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  <Check className="w-3.5 h-3.5" /> Pagada
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!puedeCobrar}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCuotaACobrar(c);
                                  }}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs transition ${
                                    puedeCobrar
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  <CreditCard className="w-3 h-3" /> Cobrar
                                </button>
                              )}
                            </td>
                          </tr>

                          {/* Subfila Contenedora del Historial de Pagos (Acordeón) */}
                          {isExpanded && tienePagos && (
                            <tr className="animate-in fade-in duration-150">
                              <td colSpan={8} className="p-0 border-b border-slate-200">
                                <HistorialPagosSubRow
                                  pagos={pagosList}
                                  montoTotalCuota={Number(c.monto_actualizado || c.monto_base || 0)}
                                  saldoRemanente={saldoRemanente}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pie */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Cobro con resolución de Cuota Anterior Inmediata */}
      {cuotaACobrar && (
        <CobrarCuotaModal
          cuota={cuotaACobrar}
          cuotaAnterior={getCuotaPrevia(cuotaACobrar)}
          isOpen={true}
          onClose={() => setCuotaACobrar(null)}
          showToast={showToast}
          onSuccess={async () => {
            setCuotaACobrar(null);
            await fetchCuotas(cuenta.id_inmueble);
            onPlanCreado?.();
          }}
        />
      )}
    </>
  );
};