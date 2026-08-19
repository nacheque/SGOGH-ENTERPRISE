import React from 'react';
import type { Obra } from '../../types';
import { Layers, Loader2 } from 'lucide-react';

interface ObraTableProps {
  obras: Obra[];
  loading: boolean;
}

export const ObraTable: React.FC<ObraTableProps> = ({ obras = [], loading }) => {
  // Nos aseguramos de que siempre sea un array iterable
  const obrasList = Array.isArray(obras) ? obras : [];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Obras de Red Registradas
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
          Total: {obrasList.length}
        </span>
      </div>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs">Cargando obras desde la base de datos...</span>
        </div>
      ) : obrasList.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          No hay obras registradas en la base de datos todavía.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Nombre de la Obra</th>
                <th className="px-6 py-3">Descripción</th>
                <th className="px-6 py-3">Precio / Metro</th>
                <th className="px-6 py-3">Gabinete Base</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {obrasList.map((obra) => (
                <tr key={obra.id_obra} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">#{obra.id_obra}</td>
                  <td className="px-6 py-3 font-semibold text-slate-900">{obra.nombre_obra}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {obra.descripcion || <span className="text-slate-300 italic">Sin descripción</span>}
                  </td>
                  <td className="px-6 py-3 font-mono font-medium text-slate-800">
                    ${Number(obra.precio_x_metro || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-600">
                    ${Number(obra.costo_gabinete || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {obra.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};