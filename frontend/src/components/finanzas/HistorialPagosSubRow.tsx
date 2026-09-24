import React from 'react';
import { Calendar, Receipt, CreditCard } from 'lucide-react';
import type { PagoResponseDTO } from '../../types';

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
        return 'bg-amber-50 text-amber-700 border-amber-200';
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
    <div className="p-4 bg-slate-50/90 border-y border-slate-200 shadow-inner">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Cabecera del subpanel */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            Comprobantes y Cobros Registrados ({pagos.length})
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            ID Referencia Auditoría
          </span>
        </div>

        {/* Mini tabla de pagos */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/75 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Fecha de Cobro</th>
                <th className="py-2 px-3">Medio de Pago</th>
                <th className="py-2 px-3">N° Recibo / Comprobante</th>
                <th className="py-2 px-3">Observaciones</th>
                <th className="py-2 px-3 text-right">Monto Imputado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {pagos.map((pago) => (
                <tr key={pago.id_pago} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatearFecha(pago.fecha_pago)}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${getMedioBadge(pago.medio_pago)}`}>
                      <CreditCard className="w-2.5 h-2.5" />
                      {pago.medio_pago}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-800">
                    {pago.comprobante ? (
                      <span className="font-semibold">{pago.comprobante}</span>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-[11px] text-slate-500 truncate max-w-xs">
                    {pago.observaciones || '-'}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900 text-right">
                    ${Number(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Barra de Auditoría / Resumen */}
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
  );
};