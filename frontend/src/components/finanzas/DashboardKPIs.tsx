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
  const [animatedWidth, setAnimatedWidth] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        setAnimatedWidth(0); // Reiniciar a 0 al cambiar de obra o recargar
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

  // Efecto de animación de llenado una vez que finalizó la carga
  useEffect(() => {
    if (!loading && kpis) {
      const totalPresupuestado = Number(kpis.total_obra || 0);
      const recaudacionEfectiva = Number(kpis.recaudacion_efectiva || 0);
      const porcentaje = totalPresupuestado > 0
        ? Math.min(100, Math.max(0, (recaudacionEfectiva / totalPresupuestado) * 100))
        : Number(kpis.porcentaje_recaudado || 0);

      // Pequeño retardo para permitir que el DOM renderice en 0% antes de transicionar
      const timer = setTimeout(() => {
        setAnimatedWidth(porcentaje);
      }, 80);

      return () => clearTimeout(timer);
    }
  }, [loading, kpis]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs animate-pulse h-24 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-2/3" />
              <div className="h-5 bg-slate-200 rounded w-1/2" />
              <div className="h-2.5 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="h-14 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!kpis) return null;

  const totalPresupuestado = Number(kpis.total_obra || 0);
  const recaudacionEfectiva = Number(kpis.recaudacion_efectiva || 0);
  const porcentajeRecaudado = totalPresupuestado > 0
    ? Math.min(100, Math.max(0, (recaudacionEfectiva / totalPresupuestado) * 100))
    : Number(kpis.porcentaje_recaudado || 0);

  return (
    <div className="space-y-3">
      {/* GRILLA FLEXIBLE DE 6 KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Total Obra Presupuestada */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 gap-1">
            <span className="text-[10px] xl:text-[11px] font-bold uppercase tracking-wider truncate">Total Presupuestado</span>
            <div className="p-1 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-base sm:text-lg font-bold font-mono text-slate-900 truncate" title={`$${totalPresupuestado.toLocaleString('es-AR')}`}>
              ${totalPresupuestado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-medium truncate">Contratos y adhesiones</span>
        </div>

        {/* 2. Recaudación Efectiva */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 gap-1">
            <span className="text-[10px] xl:text-[11px] font-bold uppercase tracking-wider truncate">Recaudación Efectiva</span>
            <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 truncate" title={`$${recaudacionEfectiva.toLocaleString('es-AR')}`}>
              ${recaudacionEfectiva.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
              {Number(kpis.porcentaje_recaudado || 0).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 truncate">del total</span>
          </div>
        </div>

        {/* 3. Saldo Pendiente al ICC */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 gap-1">
            <span className="text-[10px] xl:text-[11px] font-bold uppercase tracking-wider truncate">Saldo Pendiente (ICC)</span>
            <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-base sm:text-lg font-bold font-mono text-slate-900 truncate" title={`$${Number(kpis.saldo_pendiente || 0).toLocaleString('es-AR')}`}>
              ${Number(kpis.saldo_pendiente || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
              {Number(kpis.porcentaje_pendiente || 0).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 truncate">a amortizar</span>
          </div>
        </div>

        {/* 4. Tasa de Morosidad */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 gap-1">
            <span className="text-[10px] xl:text-[11px] font-bold uppercase tracking-wider truncate">Tasa de Morosidad</span>
            <div className="p-1 bg-rose-50 text-rose-600 rounded-lg shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-base sm:text-lg font-bold font-mono text-rose-600 truncate">
              {Number(kpis.tasa_morosidad || 0).toFixed(1)}%
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 truncate" title={`$${Number(kpis.monto_mora || 0).toLocaleString('es-AR')}`}>
            Mora: ${Number(kpis.monto_mora || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* 5. Cobertura ICC vs. Insumos */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 gap-1">
            <span className="text-[10px] xl:text-[11px] font-bold uppercase tracking-wider truncate">Cobertura ICC</span>
            <div className="p-1 bg-purple-50 text-purple-600 rounded-lg shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-base sm:text-lg font-bold font-mono text-purple-700 truncate">
              {Number(kpis.cobertura_icc || 0).toFixed(1)}%
            </div>
          </div>
          <span className="text-[10px] text-slate-400 truncate">vs. curva insumos</span>
        </div>

        {/* 6. Efectividad del Mes */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 gap-1">
            <span className="text-[10px] xl:text-[11px] font-bold uppercase tracking-wider truncate">Efectividad Mes</span>
            <div className="p-1 bg-teal-50 text-teal-600 rounded-lg shrink-0">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-base sm:text-lg font-bold font-mono text-teal-700 truncate">
              {Number(kpis.efectividad_mes || 0).toFixed(1)}%
            </div>
          </div>
          <span className="text-[10px] text-slate-400 truncate">cobrado vs. vencido</span>
        </div>
      </div>

      {/* BARRA DE PROGRESO DE RECAUDACIÓN CON ANIMACIÓN DE LLENADO */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">
              Avance de Recaudación Efectiva sobre Costo Total
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
            <span className="text-slate-500 text-[11px] sm:text-xs">
              Recaudado: <strong className="text-emerald-600 font-mono">${recaudacionEfectiva.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-[11px] sm:text-xs">
              Total: <strong className="text-slate-700 font-mono">${totalPresupuestado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold font-mono text-[11px] border border-emerald-200">
              {porcentajeRecaudado.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Contenedor de la barra */}
        <div className="w-full h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${animatedWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
};