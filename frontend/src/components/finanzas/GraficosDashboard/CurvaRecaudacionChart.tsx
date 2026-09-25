import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { CurvaRecaudacionItemDTO } from '../../../types';
import { TrendingUp } from 'lucide-react';

interface Props {
  data: CurvaRecaudacionItemDTO[];
  loading?: boolean;
}

// Componente de Tooltip FUERA del componente principal para evitar colisión de Hooks
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item: CurvaRecaudacionItemDTO = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-lg text-xs space-y-1.5">
        <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">
          Período: {label}
        </p>
        <div className="text-blue-700">
          <span className="font-medium">Proyectado Mes: </span>
          <strong className="font-mono">
            ${Number(item.proyectado_mes || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div className="text-blue-900">
          <span className="font-medium">Proyectado Acumulado: </span>
          <strong className="font-mono">
            ${Number(item.proyectado_acumulado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div className="text-emerald-600 pt-1 border-t border-slate-100">
          <span className="font-medium">Real Mes: </span>
          <strong className="font-mono">
            ${Number(item.real_mes || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div className="text-emerald-800">
          <span className="font-medium">Real Acumulado: </span>
          <strong className="font-mono">
            ${Number(item.real_acumulado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>
    );
  }
  return null;
};

export const CurvaRecaudacionChart: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-[380px] flex items-center justify-center">
        <span className="text-xs text-slate-400 animate-pulse">Cargando curva de recaudación...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-[380px] flex items-center justify-center">
        <span className="text-xs text-slate-400">Sin datos de proyección para la obra seleccionada.</span>
      </div>
    );
  }

  const formatMoneda = (val: number) =>
    `$${(val / 1000000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Curva de Recaudación (Proyectado vs. Real)</h3>
            <p className="text-[11px] text-slate-500">
              Evolución acumulada de cobranza exigible presupuestada vs. recaudación efectiva
            </p>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="periodo"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatMoneda}
              tick={{ fill: '#64748b', fontSize: 11 }}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />
            <Area
              type="monotone"
              dataKey="real_acumulado"
              name="Recaudación Real Acumulada"
              stroke="#059669"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorReal)"
            />
            <Line
              type="monotone"
              dataKey="proyectado_acumulado"
              name="Proyección Presupuestada Acumulada"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};