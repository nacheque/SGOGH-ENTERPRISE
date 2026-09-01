import React from 'react';
import type { CuentaCorrienteRow } from '../../types';
import { Loader2, Receipt } from 'lucide-react';

interface Props {
  data: CuentaCorrienteRow[];
  loading: boolean;
  onSelectCuenta: (cuenta: CuentaCorrienteRow) => void;
}

export const CuentaCorrienteTable: React.FC<Props> = ({ data, loading, onSelectCuenta }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs">Cargando matriz de cuenta corriente...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          No hay cuentas corrientes registradas para el filtro seleccionado.
        </div>
      ) : (
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-xs text-slate-600 whitespace-nowrap min-w-[1100px]">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 text-center">PLAN / CUOTAS</th>
                <th className="px-3 py-3">CLAVE</th>
                <th className="px-3 py-3">MZA</th>
                <th className="px-3 py-3">FRENTISTA</th>
                <th className="px-3 py-3 text-right">METROS</th>
                <th className="px-3 py-3">CALLE</th>
                <th className="px-3 py-3">Nº</th>
                <th className="px-3 py-3">LOTE CATAST. MUN</th>
                <th className="px-3 py-3">LOTE CATAST. PROV</th>
                <th className="px-3 py-3 text-center">CONEX. GAB.</th>
                <th className="px-3 py-3 text-center">GAB. COLOC.</th>
                <th className="px-3 py-3">TITULAR SERVICIO</th>
                <th className="px-3 py-3 text-right">PRECIO X MT.</th>
                <th className="px-3 py-3 text-right">COSTO OBRA</th>
                <th className="px-3 py-3 text-right">SERV. DOM</th>
                <th className="px-3 py-3 text-right">COSTO TOTAL</th>
                <th className="px-3 py-3 text-center">PLAN PAGOS</th>
                <th className="px-3 py-3 text-right">CUOTA BASE</th>
                <th className="px-3 py-3 text-center">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {data.map((row) => (
                <tr key={row.id_inmueble} className="hover:bg-slate-50/70 transition">

                  <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => onSelectCuenta(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 hover:bg-brand-600 hover:text-white text-brand-700 rounded-md text-[11px] font-bold border border-brand-200 transition shadow-xs"
                        title="Ver Plan de Cuotas">
                        <Receipt className="w-3.5 h-3.5" /> Plan / Cuotas
                      </button>
                  </td>

                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">{row.clave}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-500">{row.mza || '-'}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-800">
                    {row.frentista_nombre || <span className="text-slate-400 italic">Sin frentista</span>}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-right">{row.metros_frente.toFixed(2)} m</td>
                  <td className="px-3 py-2.5 text-slate-700">{row.calle}</td>
                  <td className="px-3 py-2.5 text-slate-600">{row.numero || 'S/N'}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-500">{row.lote_catast_muni || '-'}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-500">{row.lote_catast_provincia || '-'}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.conexion_gabinete ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-400'}`}>
                      {row.conexion_gabinete ? 'SÍ' : 'NO'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.gabinete_colocado ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-400'}`}>
                      {row.gabinete_colocado ? 'SÍ' : 'NO'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{row.titular_nombre || '-'}</td>
                  <td className="px-3 py-2.5 font-mono text-right text-slate-700">
                    ${row.precio_x_metro.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-right text-slate-800">
                    ${row.costo_obra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-right text-slate-600">
                    ${row.serv_dom.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-right font-bold text-slate-900">
                    ${row.costo_total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono font-medium">{row.plan_pagos}</td>
                  <td className="px-3 py-2.5 font-mono text-right font-bold text-emerald-600">
                    ${row.cuota_base.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {row.estado}
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