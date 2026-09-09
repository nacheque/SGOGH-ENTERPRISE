import React from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Scale,
  Target,
  ChevronDown,
  Filter,
  Sparkles,
} from 'lucide-react';

interface KPICardProps {
  titulo: string;
  valor: string;
  subtexto: string;
  icono: React.ElementType;
  badgeTexto?: string;
  badgeClase?: string;
  iconoContenedorClase: string;
}

const KPICard: React.FC<KPICardProps> = ({
  titulo,
  valor,
  subtexto,
  icono: Icono,
  badgeTexto,
  badgeClase,
  iconoContenedorClase,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {titulo}
          </span>
          <div
            className={`p-2.5 rounded-xl border transition-colors ${iconoContenedorClase}`}
          >
            <Icono className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {valor}
          </span>
          {badgeTexto && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badgeClase}`}
            >
              {badgeTexto}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          {subtexto}
        </p>
      </div>
    </div>
  );
};

export const DashboardKPIs: React.FC = () => {
  return (
    <div className="w-full space-y-5">
      {/* Barra Superior de Contexto y Selector de Obra (Estático) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#071830] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            KPI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">
                Resumen Ejecutivo y Métricas Contables
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3" />
                Vista preliminar
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Liquidaciones, recupero de capital e indexación en base al padrón de obra.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative inline-flex items-center">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              defaultValue="all"
              className="pl-8 pr-9 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg outline-none cursor-pointer appearance-none transition-colors"
            >
              <option value="all">Todas las Obras (Consolidado General)</option>
              <option value="1">Red de Gas - San Martín (Etapa 1)</option>
              <option value="2">Ampliación Gasoducto Central</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grilla Responsiva: 6 Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Total Obra */}
        <KPICard
          titulo="Total Obra Presupuestada"
          valor="$ 85.450.000,00"
          subtexto="Monto total presupuestado al ICC actual"
          icono={Building2}
          iconoContenedorClase="bg-[#071830]/5 text-[#071830] border-[#071830]/10 group-hover:bg-[#071830] group-hover:text-white"
        />

        {/* 2. Cobrado */}
        <KPICard
          titulo="Recaudación Efectiva"
          valor="$ 38.620.450,00"
          badgeTexto="45.2% recaudado"
          badgeClase="bg-emerald-50 text-emerald-700 border-emerald-200"
          subtexto="Ingresos reales acumulados en banco y caja"
          icono={CheckCircle2}
          iconoContenedorClase="bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white"
        />

        {/* 3. Saldo Pendiente al ICC de hoy */}
        <KPICard
          titulo="Saldo Pendiente al ICC"
          valor="$ 46.829.550,00"
          badgeTexto="54.8% remanente"
          badgeClase="bg-blue-50 text-blue-700 border-blue-200"
          subtexto="Deuda a cobrar cotizada al índice actual"
          icono={Clock}
          iconoContenedorClase="bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-[#0b2144] group-hover:text-white"
        />

        {/* 4. Morosidad % */}
        <KPICard
          titulo="Tasa de Morosidad"
          valor="14.2%"
          badgeTexto="$ 6.540.000 en mora"
          badgeClase="bg-rose-50 text-rose-700 border-rose-200"
          subtexto="Frentistas con cuotas vencidas impagas"
          icono={AlertTriangle}
          iconoContenedorClase="bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white"
        />

        {/* 5. Cobertura ICC vs. Insumos */}
        <KPICard
          titulo="Cobertura ICC vs. Insumos"
          valor="103.8%"
          badgeTexto="+3.8% margen"
          badgeClase="bg-teal-50 text-teal-700 border-teal-200"
          subtexto="Relación ajuste tarifario vs. costo de materiales"
          icono={Scale}
          iconoContenedorClase="bg-teal-50 text-teal-600 border-teal-100 group-hover:bg-teal-600 group-hover:text-white"
        />

        {/* 6. % Efectividad del mes */}
        <KPICard
          titulo="Efectividad del Mes"
          valor="89.5%"
          badgeTexto="Cobros al día"
          badgeClase="bg-emerald-50 text-emerald-700 border-emerald-200"
          subtexto="Cuotas cobradas sobre cuotas emitidas en el período"
          icono={Target}
          iconoContenedorClase="bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white"
        />
      </div>
    </div>
  );
};