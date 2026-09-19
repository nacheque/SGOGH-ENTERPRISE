import React from 'react';
import { Loader2 } from 'lucide-react';
import type { ObraDTO } from '../../types/obras.types';

interface Props {
  obras: ObraDTO[];
  loading: boolean;
  onSelectObra: (obra: ObraDTO) => void;
}

export const ObraTable: React.FC<Props> = ({ obras, loading, onSelectObra }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs">Cargando obras del sistema...</span>
        </div>
      ) : obras.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          No hay obras registradas. Haz clic en "Nueva Obra" para comenzar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 whitespace-nowrap border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">ID</th>
                <th className="px-4 py-3.5">Nombre de la Obra</th>
                <th className="px-4 py-3.5">Ubicación</th>
                <th className="px-4 py-3.5 text-center">Año</th>
                <th className="px-4 py-3.5 text-right">Precio / Metro</th>
                <th className="px-4 py-3.5 text-right">Gabinete Base</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-4 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {obras.map((obra) => (
                <tr key={obra.id_obra} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-500">#{obra.id_obra}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{obra.nombre_obra}</td>
                  <td className="px-4 py-3 text-slate-600">{obra.ubicacion}</td>
                  <td className="px-4 py-3 text-center font-mono">{obra.anio}</td>
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
                      onClick={() => onSelectObra(obra)}
                      className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-xs font-bold transition shadow-2xs"
                    >
                      Ver Padrón
                    </button>
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