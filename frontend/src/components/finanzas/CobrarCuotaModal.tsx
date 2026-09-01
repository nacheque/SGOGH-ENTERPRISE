import React, { useState } from 'react';
import type { CuotaConPagoDTO, CreatePagoDTO, MedioPago } from '../../types';
import { registrarPago } from '../../api/pagos.api';
import { X, DollarSign, Loader2, CreditCard } from 'lucide-react';

interface Props {
  cuota: CuotaConPagoDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const CobrarCuotaModal: React.FC<Props> = ({
  cuota,
  isOpen,
  onClose,
  onSuccess,
  showToast,
}) => {
  if (!isOpen || !cuota) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const montoSugerido = Number(cuota.monto_actualizado || cuota.monto_base || 0);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePagoDTO>({
    id_cuota: cuota.id_cuota,
    monto: montoSugerido,
    fecha_pago: todayStr,
    medio_pago: 'TRANSFERENCIA',
    comprobante: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.monto <= 0) {
      showToast('El monto a pagar debe ser mayor a 0', 'error');
      return;
    }

    try {
      setLoading(true);
      await registrarPago(formData);
      showToast(`Pago registrado con éxito para la Cuota #${cuota.nro_cuota}`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Error al imputar pago', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-50 text-brand-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Registrar Cobro • Cuota #{cuota.nro_cuota}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Período: {cuota.periodo} | Concepto: {cuota.concepto}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Monto a Imputar ($) *</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="number"
                step="0.01"
                required
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fecha de Pago *</label>
              <input
                type="date"
                required
                value={formData.fecha_pago || ''}
                onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Medio de Pago *</label>
              <select
                value={formData.medio_pago}
                onChange={(e) => setFormData({ ...formData, medio_pago: e.target.value as MedioPago })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-brand-500"
              >
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">N° de Comprobante / Recibo</label>
            <input
              type="text"
              placeholder="Ej. REC-2026-0045"
              value={formData.comprobante || ''}
              onChange={(e) => setFormData({ ...formData, comprobante: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar Cobro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};