import React from 'react';
import type { Persona } from '../../types';
import { Users, Search, Loader2 } from 'lucide-react';

interface PersonaTableProps {
  personas: Persona[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}

export const PersonaTable: React.FC<PersonaTableProps> = ({
  personas,
  loading,
  search,
  onSearchChange,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Barra de control: Título + Buscador */}
      <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Padrón de Vecinos y Frentistas
          </h3>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, DNI o CUIT..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
          />
        </div>
      </div>

      {/* Estados de renderizado */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs">Buscando en la base de datos...</span>
        </div>
      ) : personas.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          {search
            ? `No se encontraron coincidencias para "${search}".`
            : 'No hay personas cargadas en el padrón actualmente.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Nombre Completo</th>
                <th className="px-6 py-3">Documento (DNI / CUIT)</th>
                <th className="px-6 py-3">Datos de Contacto</th>
                <th className="px-6 py-3">Domicilio Particular</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {personas.map((p) => (
                <tr key={p.id_persona} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">#{p.id_persona}</td>
                  <td className="px-6 py-3 font-semibold text-slate-900">{p.nombre_completo}</td>
                  <td className="px-6 py-3 font-mono text-xs">
                    {p.cuit ? (
                      <span className="text-slate-800">{p.cuit}</span>
                    ) : p.dni ? (
                      <span className="text-slate-800">{p.dni}</span>
                    ) : (
                      <span className="text-slate-300 italic">Sin documento</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-xs space-y-0.5">
                    {p.telefono && <div className="text-slate-700">{p.telefono}</div>}
                    {p.email && <div className="text-slate-500 text-[11px]">{p.email}</div>}
                    {!p.telefono && !p.email && <span className="text-slate-300 italic">Sin contacto</span>}
                  </td>
                  <td className="px-6 py-3 text-slate-500 text-xs">
                    {p.domicilio_particular || <span className="text-slate-300 italic">No especificado</span>}
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