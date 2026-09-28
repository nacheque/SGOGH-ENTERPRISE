import React from 'react';
import type { Obra } from '../../types/obras.types';

interface Props {
  obras: Obra[];
  loading?: boolean;
  selectedObraId?: number | null;
  onSelectObra: (obra: Obra) => void;
}

export const ObraTable: React.FC<Props> = ({ obras, loading, selectedObraId, onSelectObra }) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-semibold">
        Cargando obras registradas...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold bg-slate-50">
            <th className="px-4 py-3.5">ID</th>
            <th className="px-4 py-3.5">Nombre de la Obra</th>
            <th className="px-4 py-3.5">Descripción</th>
            <th className="px-4 py-3.5 text-center">Fecha Inicio</th>
            <th className="px-4 py-3.5 text-right">Precio / Metro</th>
            <th className="px-4 py-3.5 text-right">Gabinete Base</th>
            <th className="px-4 py-3.5 text-center">Estado</th>
            <th className="px-4 py-3.5 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {obras.map((obra) => {
            const isSelected = selectedObraId ? obra.id_obra === selectedObraId : false;
            return (
              <tr key={obra.id_obra} className={`hover:bg-slate-50/70 transition ${isSelected ? 'bg-brand-50/40' : ''}`}>
                <td className="px-4 py-3 font-mono font-bold text-slate-500">#{obra.id_obra}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{obra.nombre_obra}</td>
                <td className="px-4 py-3 text-slate-600">{obra.descripcion || '-'}</td>
                <td className="px-4 py-3 text-center font-mono text-slate-600">
                  {obra.fecha_inicio ? new Date(obra.fecha_inicio).toLocaleDateString('es-AR') : '-'}
                </td>
                <td className="px-4 py-3 font-mono text-right font-bold text-slate-800">
                  ${Number(obra.precio_x_metro).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 font-mono text-right font-bold text-slate-800">
                  ${Number(obra.costo_gabinete).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {obra.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onSelectObra(obra)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Seleccionar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};