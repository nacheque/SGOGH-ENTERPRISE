import React from 'react';
import type { AgingMoraResponseDTO } from '../../../types';
import { ShieldAlert } from 'lucide-react';

interface Props {
  data: AgingMoraResponseDTO | null;
  loading?: boolean;
}

export const AgingMoraReport: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-[380px] flex items-center justify-center">
        <span className="text-xs text-slate-400 animate-pulse">Cargando análisis de mora...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-[380px] flex items-center justify-center">
        <span className="text-xs text-slate-400">Sin datos de mora disponibles.</span>
      </div>
    );
  }

  const { totales_generales, detalle_por_plan = [] } = data;

  const totalAlDia = Number(totales_generales?.monto_al_dia ?? (totales_generales as any)?.al_dia ?? 0);
  const total1_30 = Number(totales_generales?.monto_1_30 ?? (totales_generales as any)?.dias_1_30 ?? 0);
  const total31_60 = Number(totales_generales?.monto_31_60 ?? (totales_generales as any)?.dias_31_60 ?? 0);
  const total61_90 = Number(totales_generales?.monto_61_90 ?? (totales_generales as any)?.dias_61_90 ?? 0);
  const totalMas90 = Number(totales_generales?.monto_mas_90 ?? (totales_generales as any)?.mas_90_dias ?? 0);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      {/* Título de la Sección */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl shrink-0">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 leading-tight">Distribución de Deuda y Mora (Aging Report)</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Antigüedad de saldos exigibles y comportamiento por esquema de financiación
          </p>
        </div>
      </div>

      {/* 5 Cards de Antigüedad de Deuda con los Colores Originales */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
        <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block truncate">Al Día</span>
          <span className="text-xs font-mono font-bold text-emerald-900 mt-0.5 block truncate">
            ${totalAlDia.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl">
          <span className="text-[10px] font-bold uppercase text-amber-700 block truncate">1 a 30 D</span>
          <span className="text-xs font-mono font-bold text-amber-900 mt-0.5 block truncate">
            ${total1_30.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="p-2.5 bg-orange-50/60 border border-orange-200 rounded-xl">
          <span className="text-[10px] font-bold uppercase text-orange-700 block truncate">31 a 60 D</span>
          <span className="text-xs font-mono font-bold text-orange-900 mt-0.5 block truncate">
            ${total31_60.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="p-2.5 bg-rose-50/60 border border-rose-200 rounded-xl">
          <span className="text-[10px] font-bold uppercase text-rose-700 block truncate">61 a 90 D</span>
          <span className="text-xs font-mono font-bold text-rose-900 mt-0.5 block truncate">
            ${total61_90.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="p-2.5 bg-red-100/70 border border-red-300 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase text-red-800 block truncate">+90 D Crítico</span>
          <span className="text-xs font-mono font-bold text-red-950 mt-0.5 block truncate">
            ${totalMas90.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Tabla sin desborde horizontal ni scrollbar */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Plan</th>
              <th className="py-2.5 px-1 text-center">Frent.</th>
              <th className="py-2.5 px-2 text-right">A Tiempo</th>
              <th className="py-2.5 px-1.5 text-right">30 D</th>
              <th className="py-2.5 px-1.5 text-right">60 D</th>
              <th className="py-2.5 px-1.5 text-right">90 D</th>
              <th className="py-2.5 px-1.5 text-right">90 D</th>
              <th className="py-2.5 px-1 text-center">Atraso</th>
              <th className="py-2.5 px-2 text-center">% Mora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {detalle_por_plan.map((p, idx) => {
              const alDia = Number(p.monto_al_dia || 0);
              const m1_30 = Number(p.monto_1_30 || 0);
              const m31_60 = Number(p.monto_31_60 || 0);
              const m61_90 = Number(p.monto_61_90 || 0);
              const mMas90 = Number(p.monto_mas_90 || 0);
              const pctMora = Number(p.porcentaje_morosidad || 0);
              const diasAtraso = Number(p.dias_atraso_promedio || 0);

              return (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                    {p.tipo_plan}
                  </td>
                  <td className="py-2.5 px-1 text-center font-mono text-slate-600">
                    {p.total_clientes}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-emerald-700 font-semibold whitespace-nowrap">
                    ${alDia.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-2.5 px-1.5 text-right font-mono text-slate-600 whitespace-nowrap">
                    {m1_30 > 0 ? `$${m1_30.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : <span className="text-rose-400 font-light">-</span>}
                  </td>
                  <td className="py-2.5 px-1.5 text-right font-mono text-amber-700 whitespace-nowrap">
                    {m31_60 > 0 ? `$${m31_60.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : <span className="text-rose-400 font-light">-</span>}
                  </td>
                  <td className="py-2.5 px-1.5 text-right font-mono text-orange-700 whitespace-nowrap">
                    {m61_90 > 0 ? `$${m61_90.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : <span className="text-rose-400 font-light">-</span>}
                  </td>
                  <td className="py-2.5 px-1.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                    {mMas90 > 0 ? `$${mMas90.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : <span className="text-rose-400 font-light">-</span>}
                  </td>
                  <td className="py-2.5 px-1 text-center font-mono">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        diasAtraso === 0
                          ? 'bg-slate-100 text-slate-600'
                          : diasAtraso <= 30
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {diasAtraso} d
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        pctMora > 15
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {pctMora.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};