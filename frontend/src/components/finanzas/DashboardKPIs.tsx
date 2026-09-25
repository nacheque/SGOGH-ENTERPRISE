import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../api/dashboard.api';
import type { DashboardKpisDTO } from '../../types';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Layers,
  CalendarCheck,
} from 'lucide-react';

interface Props {
  selectedObraId: number | null;
}

export const DashboardKPIs: React.FC<Props> = ({ selectedObraId }) => {
  const [kpis, setKpis] = useState<DashboardKpisDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getKpis(selectedObraId);
        if (isMounted) setKpis(data);
      } catch {
        if (isMounted) setKpis(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchKPIs();
    return () => {
      isMounted = false;
    };
  }, [selectedObraId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs animate-pulse h-28 space-y-3">
            <div className="h-3 bg-slate-200 rounded w-2/3" />
            <div className="h-6 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {/* 1. Total Obra Presupuestada */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">Total Presupuestado</span>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="my-1.5">
          <div className="text-lg font-bold font-mono text-slate-900">
            ${Number(kpis.total_obra || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">Contratos y adhesiones base</span>
      </div>

      {/* 2. Recaudación Efectiva */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">Recaudación Efectiva</span>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="my-1.5">
          <div className="text-lg font-bold font-mono text-emerald-600">
            ${Number(kpis.recaudacion_efectiva || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
            {Number(kpis.porcentaje_recaudado || 0).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400">del total</span>
        </div>
      </div>

      {/* 3. Saldo Pendiente al ICC */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">Saldo Pendiente (ICC)</span>
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="my-1.5">
          <div className="text-lg font-bold font-mono text-slate-900">
            ${Number(kpis.saldo_pendiente || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
            {Number(kpis.porcentaje_pendiente || 0).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400">a amortizar</span>
        </div>
      </div>

      {/* 4. Tasa de Morosidad */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">Tasa de Morosidad</span>
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="my-1.5">
          <div className="text-lg font-bold font-mono text-rose-600">
            {Number(kpis.tasa_morosidad || 0).toFixed(1)}%
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          Mora: ${Number(kpis.monto_mora || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
        </span>
      </div>

      {/* 5. Cobertura ICC vs. Insumos */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">Cobertura ICC</span>
          <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="my-1.5">
          <div className="text-lg font-bold font-mono text-purple-700">
            {Number(kpis.cobertura_icc || 0).toFixed(1)}%
          </div>
        </div>
        <span className="text-[10px] text-slate-400">vs. curva de insumos</span>
      </div>

      {/* 6. Efectividad del Mes */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">Efectividad Mes</span>
          <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="my-1.5">
          <div className="text-lg font-bold font-mono text-teal-700">
            {Number(kpis.efectividad_mes || 0).toFixed(1)}%
          </div>
        </div>
        <span className="text-[10px] text-slate-400">cobrado vs. vencido</span>
      </div>
    </div>
  );
};