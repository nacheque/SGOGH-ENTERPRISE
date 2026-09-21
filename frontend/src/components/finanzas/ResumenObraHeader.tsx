import React from 'react';
import type { Obra } from '../../types';
import { Users, Landmark } from 'lucide-react';

interface Props {
  obras: Obra[];
  selectedObraId: number | null;
  onSelectObra: (id: number | null) => void;
  totalVecinos: number;
}

export const ResumenObraHeader: React.FC<Props> = ({
  obras,
  selectedObraId,
  onSelectObra,
  totalVecinos,
}) => {
  const selectedObra = obras.find((o) => o.id_obra === selectedObraId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Tarjeta: Contexto y Métrica de Padrón Activo */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Seguimiento de Saldos
          </span>
          <h3 className="text-base font-bold text-slate-800 leading-tight mt-1">
            Cuenta corriente de vecinos
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Estado financiero y amortización individual por adherente.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium">
            <Users className="w-3.5 h-3.5 text-brand-600" />
            <span>
              <strong className="text-slate-900 font-bold">{totalVecinos}</strong> frentistas en padrón activo
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta: Selector de Obra Activa */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Obra seleccionada
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {selectedObra ? `ID: #${selectedObra.id_obra}` : 'Vista Global'}
          </span>
        </div>

        <div className="my-2">
          <select
            value={selectedObraId ?? ''}
            onChange={(e) => onSelectObra(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:bg-white transition"
          >
            
            {obras.map((o) => (
              <option key={o.id_obra} value={o.id_obra}>
                {o.nombre_obra}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Landmark className="w-3 h-3 text-slate-400" />
          <span>Filtro reactivo para liquidación y cobro de cuotas</span>
        </div>
      </div>
    </div>
  );
};