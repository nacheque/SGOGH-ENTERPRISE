import React from 'react';
import type { Obra } from '../../types';
import { HardHat, Users, FileSpreadsheet, PlusCircle } from 'lucide-react';

interface Props {
  obras: Obra[];
  selectedObraId: number | null;
  onSelectObra: (id: number | null ) => void;
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Tarjeta: Estado Cuenta Corriente */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 leading-tight">
            Cuenta corriente de vecinos
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Estado financiero individual de cada adherente.
          </p>
        </div>
      </div>

      {/* Tarjeta: Selector de Obra Activa */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Obra seleccionada
        </span>
        <div className="my-2">
          <select
            value={selectedObraId === null ? 'ALL' : selectedObraId}
            onChange={(e) => {
                const val = e.target.value;
                onSelectObra(val === 'ALL' ? null : Number(val));
            }}
            className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-brand-500"
            >
            <option value="ALL">-- Todas las obras --</option>
            {obras.map((o) => (
                <option key={o.id_obra} value={o.id_obra}>
                {o.nombre_obra}
                </option>
            ))}
            </select>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {selectedObra ? `ID: #${selectedObra.id_obra}` : 'Sin obra seleccionada'}
        </span>
      </div>

      {/* Tarjeta: Vecinos Incorporados */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between text-center">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Vecinos incorporados
        </span>
        <div className="text-3xl font-black text-brand-600 my-1">
          {totalVecinos}
        </div>
        <span className="text-[11px] text-slate-400">
          Registros activos en padrón
        </span>
      </div>

      {/* Tarjeta: Acciones Rápidas */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Gestor de Padrones
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Importación y vinculación de frentistas.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-3">
        <button className="flex-1 min-w-[75px] px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition">
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span>Importar</span>
        </button>
        <button className="flex-1 min-w-[75px] px-2 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition shadow-sm">
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>+ Nuevo</span>
        </button>
        </div>
      </div>
    </div>
  );
};