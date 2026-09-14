import React, { useState, useEffect } from 'react';
import type { CuentaCorrienteRow, CuotaConPagoDTO } from '../../types';
import api from '../../api/axios';
import { CobrarCuotaModal } from './CobrarCuotaModal';
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
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [loadingCuotas, setLoadingCuotas] = useState(false);
  const [modoEmision, setModoEmision] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState(false);

  // Estado para la imputación de cobros
  const [cuotaACobrar, setCuotaACobrar] = useState<CuotaConPagoDTO | null>(null);

  // Estados del Formulario de Parametrización (Emisión)
  const [tipoIndexacion, setTipoIndexacion] = useState<'ICC' | 'FIJO'>('ICC');
  const [anticipo, setAnticipo] = useState<number>(0);
  const [planCuotasObra, setPlanCuotasObra] = useState<number>(12);
  const [planCuotasGabinete, setPlanCuotasGabinete] = useState<number>(1);
  const [fechaPrimerVencimiento, setFechaPrimerVencimiento] = useState<string>('');

  // Inicializar fecha de vencimiento por defecto (día 10 del mes siguiente)
  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 10);
    const yyyy = nextMonth.getFullYear();
    const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const dd = String(nextMonth.getDate()).padStart(2, '0');
    setFechaPrimerVencimiento(`${yyyy}-${mm}-${dd}`);
  }, [isOpen]);

  // Cargar cuotas procesando res.data.data
  const fetchCuotas = async (idInmueble: number) => {
    try {
      setLoadingCuotas(true);
      const res = await api.get(`/cuotas/inmueble/${idInmueble}`);
      const rawList = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      // Inicializar cada cuota asegurando coeficiente numérico
      const formatted = rawList.map((c: any) => {
        const base = Number(c.monto_base || 0);
        const act = Number(c.monto_actualizado || c.monto_base || 0);
        const coefCalculado =
          Number(c.coeficiente_actualizacion || c.indice_aplicado) ||
          (base > 0 ? Number((act / base).toFixed(4)) : 1.0);

        return {
          ...c,
          coeficiente_actualizacion: coefCalculado,
          monto_actualizado: act,
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
      fetchCuotas(cuenta.id_inmueble);
    } else {
      setCuotas([]);
    }
  }, [isOpen, cuenta]);

  if (!isOpen || !cuenta) return null;

  // Valores numéricos seguros
  const costoObra = Number(cuenta.costo_obra) || 0;
  const servDom = cuenta.conexion_gabinete ? Number(cuenta.serv_dom) || 0 : 0;
  const metrosFrenteNum = Number(cuenta.metros_frente) || 0;
  const saldoFinanciarObra = Math.max(0, costoObra - (Number(anticipo) || 0));

  const cantCuotasObra = Number(planCuotasObra) > 0 ? Number(planCuotasObra) : 1;
  const cuotaBaseObraSimulada = saldoFinanciarObra / cantCuotasObra;

  const cantCuotasGab = Number(planCuotasGabinete) > 0 ? Number(planCuotasGabinete) : 1;
  const cuotaBaseGabineteSimulada = servDom > 0 ? servDom / cantCuotasGab : 0;

  // Detección de contrato con modalidad fija
  const esPlanFijo = String(cuenta.tipo_indexacion || '').toUpperCase() === 'FIJO';

  /**
   * Obtiene el valor nominal íntegro de la cuota.
   * SOLO en estado PAGO_PARCIAL se suma total_abonado a monto_actualizado
   * porque monto_actualizado contiene únicamente el saldo remanente.
   * Si está PAGADA o PENDIENTE, monto_actualizado (o monto_base) ya representa el valor íntegro.
   */
  const getMontoNominalIntegro = (c: any): number => {
    const estado = String(c.estado || '').toUpperCase().trim();
    const esGabinete = String(c.concepto || '').toUpperCase().includes('GABINETE');
    const esAnticipo = String(c.concepto || '').toUpperCase().includes('ANTICIPO');

    // Para conceptos de valor fijo (Gabinete/Anticipo), el nominal es siempre monto_base
    if (esGabinete || esAnticipo) {
      return Number(c.monto_base || 0);
    }

    const act = Number(c.monto_actualizado || c.monto_base || 0);

    if (estado === 'PAGO_PARCIAL') {
      const abonado = Number(
        c.total_abonado ??
        c.monto_pagado ??
        (Array.isArray(c.pagos)
          ? c.pagos.reduce((acc: number, p: any) => acc + Number(p.monto || 0), 0)
          : 0)
      );
      return act + abonado;
    }

    return act;
  };

  /**
   * Busca la cuota previa DEL MISMO CONCEPTO estrictamente cronológica por período.
   */
  const getCuotaPreviaMismoConcepto = (lista: any[], cuotaActual: any) => {
    return (
      lista
        .filter(
          (c) =>
            c.concepto === cuotaActual.concepto &&
            String(c.periodo || '') < String(cuotaActual.periodo || '')
        )
        .sort((a, b) => String(a.periodo).localeCompare(String(b.periodo)))
        .pop() || null
    );
  };

  // Manejador del cambio porcentual mensual respecto a la cuota anterior
  const handlePorcentajeChange = (index: number, nuevoPorcentaje: number) => {
    setCuotas((prevCuotas) => {
      const actualizadas = [...prevCuotas];
      const target = actualizadas[index];
      if (!target) return prevCuotas;

      const estadoNormalizado = String(target.estado || '').toUpperCase().trim();
      const esGabinete = String(target.concepto || '').toUpperCase().includes('GABINETE');
      const esAnticipo = String(target.concepto || '').toUpperCase().includes('ANTICIPO');

      // Bloquear cualquier intento de alterar índice si es fija o pago parcial
      if (esPlanFijo || esGabinete || esAnticipo || estadoNormalizado === 'PAGO_PARCIAL') {
        return prevCuotas;
      }

      // Obtener el valor de referencia de la cuota anterior del mismo concepto
      const cuotaAnterior = getCuotaPreviaMismoConcepto(actualizadas, target);
      const valorBase = cuotaAnterior
        ? getMontoNominalIntegro(cuotaAnterior)
        : Number(target.monto_base || 0);

      const nuevoMontoActualizado = Number(
        (valorBase * (1 + nuevoPorcentaje / 100)).toFixed(2)
      );

      actualizadas[index] = {
        ...target,
        monto_actualizado: nuevoMontoActualizado,
        coeficiente_actualizacion: Number((1 + nuevoPorcentaje / 100).toFixed(4)),
        porcentaje_mensual: nuevoPorcentaje,
      };

      return actualizadas;
    });
  };

  // Manejo del Envío a la API para emitir contrato nuevo
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Cabecera del Modal */}
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
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Resumen Superior del Lote: 5 Tarjetas */}
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

          {/* Cuerpo del Modal */}
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
                      Este lote se encuentra registrado en el padrón pero aún no cuenta con un contrato
                      formal ni cuotas de amortización generadas.
                    </p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setModoEmision(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
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
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition"
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
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPlan}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs"
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
              /* Tabla de Cuotas con Índice Parametrizable y Cobro */
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-center">Nº</th>
                      <th className="px-3 py-2.5">Concepto</th>
                      <th className="px-3 py-2.5">Período</th>
                      <th className="px-3 py-2.5">Vencimiento</th>
                      <th className="px-3 py-2.5 text-center w-28">Índice</th>
                      <th className="px-3 py-2.5 text-right">Actualizado</th>
                      <th className="px-3 py-2.5 text-center">Estado</th>
                      <th className="px-3 py-2.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {cuotas.map((c, index) => {
                      const estadoNormalizado = String(c.estado || '').toUpperCase().trim();
                      const isPagado =
                        estadoNormalizado === 'PAGADA' ||
                        estadoNormalizado === 'PAGADO' ||
                        estadoNormalizado === 'COBRADA';
                      const isPagoParcial = estadoNormalizado === 'PAGO_PARCIAL';
                      const esGabinete = String(c.concepto || '').toUpperCase().includes('GABINETE');
                      const esAnticipo = String(c.concepto || '').toUpperCase().includes('ANTICIPO');

                      // Regla de Negocio: GABINETE, ANTICIPO o contratos FIJO no ajustan por índice
                      const esConceptoFijo = esPlanFijo || esGabinete || esAnticipo;

                      // Monto a mostrar en la columna ACTUALIZADO
                      // Para Gabinete / Anticipo se asegura mostrar monto_base ($100.000) si monto_actualizado vino alterado
                      const montoActualizadoDisplay = esConceptoFijo && !isPagoParcial
                        ? Number(c.monto_base || c.monto_actualizado || 0)
                        : Number(c.monto_actualizado || c.monto_base || 0);

                      // Cálculo canónico de la variación mensual relativa
                      let porcentajeCalculado = 0;

                      if (!esConceptoFijo && !isPagoParcial) {
                        if (c.porcentaje_mensual !== undefined && c.porcentaje_mensual !== null) {
                          porcentajeCalculado = Number(c.porcentaje_mensual);
                        } else {
                          const cuotaPrevia = getCuotaPreviaMismoConcepto(cuotas, c);
                          const nominalActual = getMontoNominalIntegro(c);

                          if (cuotaPrevia) {
                            const nominalAnterior = getMontoNominalIntegro(cuotaPrevia);
                            // Si los importes son nominalmente iguales, la variación es estrictamente 0
                            if (Math.abs(nominalActual - nominalAnterior) < 0.01) {
                              porcentajeCalculado = 0;
                            } else if (nominalAnterior > 0) {
                              porcentajeCalculado = Number(
                                (((nominalActual - nominalAnterior) / nominalAnterior) * 100).toFixed(2)
                              );
                            }
                          } else {
                            // Primera cuota de este concepto: comparar contra el monto_base
                            const baseOriginal = Number(c.monto_base || cuenta.cuota_base || 0);
                            if (baseOriginal > 0 && Math.abs(nominalActual - baseOriginal) >= 0.01) {
                              porcentajeCalculado = Number(
                                (((nominalActual - baseOriginal) / baseOriginal) * 100).toFixed(2)
                              );
                            } else {
                              porcentajeCalculado = 0;
                            }
                          }
                        }
                      }

                      const porcentajeDisplay = esConceptoFijo ? 0 : porcentajeCalculado;

                      return (
                        <tr key={c.id_cuota} className="hover:bg-slate-50/70 transition">
                          <td className="px-3 py-2.5 text-center font-bold text-slate-700">
                            {c.nro_cuota ?? c.numero_cuota}
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

                          {/* Columna ÍNDICE / VARIACIÓN */}
                          <td className="px-3 py-2.5 text-center font-sans">
                            {esConceptoFijo ? (
                              // GABINETE, ANTICIPO o Contrato Fijo: badge fijo garantizado
                              <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-500 font-mono text-[11px] font-semibold">
                                0.00 % <span className="text-[10px] text-slate-400 font-sans">(Fijo)</span>
                              </span>
                            ) : isPagoParcial ? (
                              // PAGO PARCIAL de Obra: indicador congelado
                              <span
                                title="Cuota con pago parcial registrado. El ajuste por índice se congela sobre el remanente."
                                className="inline-flex items-center justify-center px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 font-mono text-[11px] font-semibold"
                              >
                                —
                              </span>
                            ) : isPagado ? (
                              // Cuota totalmente pagada: texto plano
                              <span className="font-mono text-xs font-semibold text-slate-500">
                                {porcentajeDisplay > 0 ? `+${porcentajeDisplay}%` : `${porcentajeDisplay}%`}
                              </span>
                            ) : (
                              // Cuota PENDIENTE regular ajustable: Input editable
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={porcentajeDisplay}
                                  onChange={(e) =>
                                    handlePorcentajeChange(index, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-16 px-1.5 py-1 text-center font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:border-brand-500 focus:bg-white outline-none transition"
                                />
                                <span className="text-[11px] text-slate-400 font-bold">%</span>
                              </div>
                            )}
                          </td>

                          {/* Monto Actualizado / Saldo Remanente */}
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                            <div>
                              ${montoActualizadoDisplay.toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                              })}
                              {isPagoParcial && (
                                <span className="block text-[10px] text-amber-600 font-sans font-normal">
                                  (Saldo remanente)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Estado */}
                          <td className="px-3 py-2.5 text-center font-sans">
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
                          </td>

                          {/* Acción de Cobro */}
                          <td className="px-3 py-2.5 text-center font-sans">
                            {isPagado ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50/60 px-2 py-1 rounded-lg border border-emerald-200">
                                <Check className="w-3.5 h-3.5" /> Pagada
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setCuotaACobrar({
                                    ...c,
                                    monto_actualizado: montoActualizadoDisplay,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
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

          {/* Pie del Modal */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      </div>

      {/* Modal Hijo: Imputación de Cobro */}
      <CobrarCuotaModal
        cuota={cuotaACobrar}
        isOpen={Boolean(cuotaACobrar)}
        onClose={() => setCuotaACobrar(null)}
        showToast={showToast}
        onSuccess={async () => {
          await fetchCuotas(cuenta.id_inmueble);
          onPlanCreado?.();
        }}
      />
    </>
  );
};