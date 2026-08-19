import React from 'react';
import type { Inmueble } from '../../types';
import { Building2, Loader2 } from 'lucide-react';

interface InmuebleTableProps {
  inmuebles: Inmueble[];
  loading: boolean;
}

export const InmuebleTable: React.FC<InmuebleTableProps> = ({ inmuebles, loading }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Catastro de Inmuebles Registrados
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
          Total: {inmuebles.length}
        </span>
      </div>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs">Cargando catastro desde la base de datos...</span>
        </div>
      ) : inmuebles.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          No hay inmuebles registrados en el catastro todavía.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Clave Cliente</th>
                <th className="px-6 py-3">Obra Asignada</th>
                <th className="px-6 py-3">Ubicación / Calle</th>
                <th className="px-6 py-3">Frentista / Titular</th>
                <th className="px-6 py-3">Metros Frente</th>
                <th className="px-6 py-3">Gabinete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {inmuebles.map((inm) => (
                <tr key={inm.id_inmueble} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-3 font-semibold text-slate-900 font-mono text-xs">
                    {inm.clave_cliente}
                  </td>
                  <td className="px-6 py-3 text-xs font-medium text-slate-700">
                    {inm.nombre_obra || `Obra #${inm.id_obra}`}
                  </td>
                  <td className="px-6 py-3 text-xs">
                    <span className="text-slate-800">{inm.calle} {inm.numero}</span>
                    {(inm.manzana || inm.lote) && (
                      <span className="text-slate-400 ml-1 text-[11px]">
                        (Mz: {inm.manzana || '-'} Lt: {inm.lote || '-'})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-xs">
                    <div className="font-medium text-slate-800">
                      {inm.frentista_nombre || <span className="text-slate-400 italic">Sin frentista</span>}
                    </div>
                    {inm.titular_nombre && inm.titular_nombre !== inm.frentista_nombre && (
                      <div className="text-[11px] text-slate-400">
                        Titular: {inm.titular_nombre}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs font-medium text-slate-700">
                    {inm.metros_frente} m
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        inm.conexion_gabinete
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {inm.conexion_gabinete ? 'Solicitado' : 'No'}
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