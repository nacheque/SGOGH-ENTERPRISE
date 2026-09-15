import React, { useState, useEffect } from 'react';
import type { CuotaConPagoDTO } from '../../types';
import api from '../../api/axios';
import { X, CreditCard, Loader2, AlertCircle, Percent } from 'lucide-react';

interface Props {
  cuota: CuotaConPagoDTO | null;
  cuotaAnterior?: CuotaConPagoDTO | null;
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onSuccess: () => void;
}

export const CobrarCuotaModal: React.FC<Props> = ({
  cuota,
  cuotaAnterior,
  isOpen,
  onClose,
  showToast,
  onSuccess,
}) => {
  if (!isOpen || !cuota) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const esObra = cuota.concepto === 'RED_OBRA';
  const totalAbonado = Number(cuota.total_abonado || 0);

  // Normalización del estado eliminando espacios y admitiendo guion bajo o espacio
  const estadoNormalizado = String(cuota.estado || '').toUpperCase().trim().replace(/\s+/g, '_');
  const esEstadoParcial = estadoNormalizado === 'PAGO_PARCIAL';

  // Validación por diferencia de saldo (si el remanente es menor al nominal, ya hubo cobros previos)
  const remanenteActual = Number(cuota.saldo_remanente ?? cuota.monto_actualizado ?? 0);
  const nominalActual = Number(cuota.monto_actualizado || cuota.monto_base || 0);
  const tieneRemanenteMenor = nominalActual > 0 && remanenteActual < (nominalActual - 0.05);

  // Bandera definitiva
  const tienePagosPrevios = esEstadoParcial || totalAbonado > 0.01 || tieneRemanenteMenor;

  // Piso base de cálculo para encadenamiento inflacionario
  const pisoBase = cuotaAnterior 
    ? Number(cuotaAnterior.monto_actualizado || cuotaAnterior.monto_base || 0)
    : Number(cuota.monto_base || 0);

  const [loading, setLoading] = useState(false);
  const [porcentaje, setPorcentaje] = useState<number>(Number(cuota.porcentaje_actualizacion || 0));
  const [montoAbonar, setMontoAbonar] = useState<number>(0);
  const [fechaPago, setFechaPago] = useState<string>(todayStr);
  const [medioPago, setMedioPago] = useState<string>('TRANSFERENCIA');
  const [comprobante, setComprobante] = useState<string>('');

  // Cálculo en vivo del monto nominal y saldo exigible
  const nuevoMontoNominal = esObra
    ? Number((pisoBase * (1 + (Number(porcentaje) || 0) / 100)).toFixed(2))
    : Number(cuota.monto_actualizado || cuota.monto_base || 0);

  const saldoExigibleSugerido = Math.max(0, Number((nuevoMontoNominal - totalAbonado).toFixed(2)));

  // Inicialización de montos al abrir o cambiar la cuota
  useEffect(() => {
    if (cuota) {
      const pctInicial = Number(cuota.porcentaje_actualizacion || 0);
      setPorcentaje(pctInicial);

      const nominalInicial = cuota.concepto === 'RED_OBRA'
        ? Number((pisoBase * (1 + pctInicial / 100)).toFixed(2))
        : Number(cuota.monto_actualizado || cuota.monto_base || 0);

      const exigibleInicial = Math.max(0, Number((nominalInicial - Number(cuota.total_abonado || 0)).toFixed(2)));
      setMontoAbonar(exigibleInicial);
      setFechaPago(todayStr);
      setMedioPago('TRANSFERENCIA');
      setComprobante('');
    }
  }, [cuota, pisoBase]);

  const handlePorcentajeChange = (nuevoPct: number) => {
    setPorcentaje(nuevoPct);
    const nominal = esObra
      ? Number((pisoBase * (1 + nuevoPct / 100)).toFixed(2))
      : Number(cuota.monto_actualizado || cuota.monto_base || 0);
    const exigible = Math.max(0, Number((nominal - totalAbonado).toFixed(2)));
    setMontoAbonar(exigible);
  };

  const montoIngresado = Number(montoAbonar) || 0;
  const remanentePosterior = Math.max(0, Number((saldoExigibleSugerido - montoIngresado).toFixed(2)));
  const esParcial = montoIngresado > 0 && montoIngresado < saldoExigibleSugerido - 0.01;
  const montoExcedido = montoIngresado > saldoExigibleSugerido + 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (montoIngresado <= 0) {
      showToast('El monto a imputar debe ser mayor a 0.', 'error');
      return;
    }

    if (montoExcedido) {
      showToast(
        `El monto ingresado no puede superar el saldo exigible ($${saldoExigibleSugerido.toLocaleString('es-AR', {
          minimumFractionDigits: 2,
        })}).`,
        'error'
      );
      return;
    }

    try {
      setLoading(true);
      await api.post('/pagos', {
        id_cuota: cuota.id_cuota,
        monto: montoIngresado,
        porcentaje_actualizacion: esObra
          ? (tienePagosPrevios ? Number(cuota.porcentaje_actualizacion || 0) : Number(porcentaje))
          : 0,
        fecha_pago: fechaPago,
        medio_pago: medioPago,
        comprobante: comprobante.trim() || undefined,
      });

      showToast(
        esParcial ? 'Pago parcial registrado con éxito' : 'Cobro cancelado en su totalidad',
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al registrar el cobro';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Registrar Cobro • Cuota #{cuota.nro_cuota}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Período: {cuota.periodo} | Concepto: {cuota.concepto}
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Parámetro de Actualización Acumulativa (Solo RED_OBRA) */}
          {esObra && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-brand-600" />
                  Ajuste / Índice del Período (%)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Piso base: ${pisoBase.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  disabled={tienePagosPrevios}
                  readOnly={tienePagosPrevios}
                  value={porcentaje}
                  onChange={(e) => {
                    if (tienePagosPrevios) return;
                    handlePorcentajeChange(parseFloat(e.target.value) || 0);
                  }}
                  className={`w-full px-3 py-1.5 text-xs font-bold font-mono rounded-lg border outline-none transition ${
                    tienePagosPrevios
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                      : 'bg-white text-slate-900 border-slate-200 focus:border-brand-500 shadow-xs'
                  }`}
                />
              </div>

              {/* Mensaje informativo si está bloqueado por cobro parcial */}
              {tienePagosPrevios ? (
                <p className="text-[10px] text-slate-400 italic">
                  Índice fijado por imputación parcial previa
                </p>
              ) : null}

              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-200/60 pt-1.5">
                <span>Nuevo Valor Contractual:</span>
                <span className="font-mono font-bold text-slate-800">
                  ${nuevoMontoNominal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Monto a Imputar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Monto a Imputar ($) *
              </label>
              <button
                type="button"
                onClick={() => setMontoAbonar(saldoExigibleSugerido)}
                className="text-[11px] font-bold text-brand-600 hover:underline"
              >
                Pagar Total ($
                {saldoExigibleSugerido.toLocaleString('es-AR', { minimumFractionDigits: 2 })})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={saldoExigibleSugerido}
                value={montoAbonar}
                onChange={(e) => setMontoAbonar(parseFloat(e.target.value) || 0)}
                className={`w-full pl-8 pr-3 py-2 text-sm font-bold font-mono rounded-xl border outline-none transition ${
                  montoExcedido
                    ? 'border-rose-400 bg-rose-50/30 text-rose-800'
                    : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white text-slate-900'
                }`}
                required
              />
            </div>

            {/* Aviso de Remanente / Parcial */}
            {esParcial && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <span className="font-bold">Aviso de Pago Parcial:</span> quedará un saldo remanente exigible de{' '}
                  <span className="font-mono font-bold">
                    ${remanentePosterior.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {montoExcedido && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">
                El monto no puede superar la deuda exigible ($
                {saldoExigibleSugerido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}).
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Pago *
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medio de Pago *
              </label>
              <select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition"
              >
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="CHEQUE">Cheque</option>
                <option value="DEBITO">Débito</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nº de Comprobante / Recibo
            </label>
            <input
              type="text"
              value={comprobante}
              onChange={(e) => setComprobante(e.target.value)}
              placeholder="Ej. REC-2026-0045"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || montoIngresado <= 0 || montoExcedido}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition disabled:opacity-50 ${
                esParcial
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Imputando...
                </>
              ) : esParcial ? (
                'Confirmar Pago Parcial'
              ) : (
                'Confirmar Cobro Total'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};