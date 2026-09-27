import React, { useState } from 'react';
import { Calendar, Receipt, CreditCard, Printer, Building2, Store } from 'lucide-react';
import type { PagoResponseDTO } from '../../types';
import { ReciboOficialModal } from './recibos/ReciboOficialModal';

interface Props {
  pagos: PagoResponseDTO[];
  montoTotalCuota: number;
  saldoRemanente: number;
}

export const HistorialPagosSubRow: React.FC<Props> = ({
  pagos,
  montoTotalCuota,
  saldoRemanente,
}) => {
  const [idPagoRecibo, setIdPagoRecibo] = useState<number | null>(null);
  const totalAmortizado = pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0);

  const getMedioBadge = (medio: string) => {
    switch (medio) {
      case 'EFECTIVO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TRANSFERENCIA':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SIRO_ROELA':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CHEQUE':
      case 'ECHEQ':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PAGO_FACIL':
        return 'bg-yellow-50 text-yellow-800 border-yellow-300';
      case 'RAPIPAGO':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return '-';
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      <div className="p-4 bg-slate-50/90 border-y border-slate-200 shadow-inner">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              Comprobantes y Cobros Registrados ({pagos.length})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Auditoría Multicanal
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/75 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Fecha de Cobro</th>
                  <th className="py-2 px-3">Medio de Pago</th>
                  <th className="py-2 px-3">Comprobante / Ref.</th>
                  <th className="py-2 px-3">Auditoría / Canal Destino</th>
                  <th className="py-2 px-3 text-right">Monto Imputado</th>
                  <th className="py-2 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {pagos.map((pago) => {
                  const esTransf = pago.medio_pago === 'TRANSFERENCIA';
                  const esExtra = pago.medio_pago === 'PAGO_FACIL' || pago.medio_pago === 'RAPIPAGO';

                  return (
                    <tr key={pago.id_pago} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatearFecha(pago.fecha_pago)}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${getMedioBadge(pago.medio_pago)}`}>
                          <CreditCard className="w-2.5 h-2.5" />
                          {pago.medio_pago.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-800">
                        {pago.comprobante ? (
                          <span className="font-semibold">{pago.comprobante}</span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        {esTransf && pago.cuenta_bancaria ? (
                          <div className="flex items-center gap-1 text-blue-700 max-w-xs truncate" title={pago.cuenta_bancaria}>
                            <Building2 className="w-3 h-3 shrink-0" />
                            <span className="truncate">{pago.cuenta_bancaria}</span>
                          </div>
                        ) : esExtra && (pago.canal_cobro || pago.comision_cobro) ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-amber-800 font-medium truncate" title={pago.canal_cobro}>
                              <Store className="w-3 h-3 shrink-0" />
                              <span className="truncate">{pago.canal_cobro || 'Red Extrabancaria'}</span>
                            </div>
                            {Number(pago.comision_cobro || 0) > 0 && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                Comis: -${Number(pago.comision_cobro).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 truncate max-w-xs block">{pago.observaciones || '-'}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 text-right">
                        ${Number(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setIdPagoRecibo(pago.id_pago)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 border border-slate-200 rounded-lg transition shadow-2xs cursor-pointer"
                          title="Imprimir / Ver Recibo Oficial"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Recibo</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-600 font-medium shadow-2xs">
            <span>
              Total Cuota Exigible: <strong className="font-mono text-slate-900">${Number(montoTotalCuota).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
            </span>
            <div className="flex items-center gap-4">
              <span className="text-emerald-700">
                Total Amortizado: <strong className="font-mono font-bold">${totalAmortizado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className={saldoRemanente > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                Saldo Remanente: <strong className="font-mono">${Number(saldoRemanente).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {idPagoRecibo && (
        <ReciboOficialModal
          isOpen={Boolean(idPagoRecibo)}
          idPago={idPagoRecibo}
          onClose={() => setIdPagoRecibo(null)}
        />
      )}
    </>
  );
};