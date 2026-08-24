import React from 'react';
import type { Inmueble } from '../../types';
import { Building2, Loader2 } from 'lucide-react';

interface Props {
  inmuebles: Inmueble[];
  loading: boolean;
}

export const InmuebleTable: React.FC<Props> = ({ inmuebles = [], loading }) => {
  const list = Array.isArray(inmuebles) ? inmuebles : [];

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
          Total: {list.length}
        </span>
      </div>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs">Cargando catastro...</span>
        </div>
      ) : list.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          No hay inmuebles registrados aún.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Clave Cliente</th>
                <th className="px-4 py-3">Obra Asignada</th>
                <th className="px-4 py-3">Ubicación / Calle</th>
                <th className="px-4 py-3">Mza / Catastro Mun / Prov</th>
                <th className="px-4 py-3">Frentista / Titular</th>
                <th className="px-4 py-3">Metros Frente</th>
                <th className="px-4 py-3">Gabinete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {list.map((inm) => (
                <tr key={inm.id_inmueble} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">{inm.clave_cliente}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">{inm.nombre_obra || `#${inm.id_obra}`}</td>
                  <td className="px-4 py-3 text-slate-600">{inm.calle} {inm.numero || 'S/N'}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    Mza: {inm.manzana || '-'} | Mun: {inm.lote_catast_muni || '-'} | Prov: {inm.lote_catast_provincia || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    <div>{inm.frentista_nombre || <span className="text-slate-400 italic">Sin frentista</span>}</div>
                    {inm.titular_nombre && inm.titular_nombre !== inm.frentista_nombre && (
                      <div className="text-[10px] text-slate-400 font-normal">Titular: {inm.titular_nombre}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono">{Number(inm.metros_frente || 0).toFixed(2)} m</td>
                  <td className="px-4 py-3">
                    {inm.conexion_gabinete ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        inm.gabinete_colocado
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inm.gabinete_colocado ? 'Colocado' : 'Solicitado'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No</span>
                    )}
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