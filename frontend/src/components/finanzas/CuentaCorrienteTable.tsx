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
                <th className="px-3 py-3">ID-CLIENTE</th>
                <th className="px-3 py-3">MZA</th>
                <th className="px-3 py-3">TITULAR DEL LOTE</th>
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
              {data.map((row) => {
                // Validación defensiva de Gabinete [BUG-FRONT-01]
                const tieneGabinete = Boolean(row.conexion_gabinete);
                const costoObraNum = Number(row.costo_obra || 0);
                const servDomNum = tieneGabinete ? Number(row.serv_dom || 0) : 0;
                // Si no tiene gabinete, el costo total es únicamente el costo de la obra
                const costoTotalReal = tieneGabinete
                  ? (Number(row.costo_total) || (costoObraNum + servDomNum))
                  : costoObraNum;

                return (
                  <tr key={row.id_inmueble} className="hover:bg-slate-50/70 transition">

                    {/* Columna PLAN / CUOTAS (Acción Modal) */}
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => onSelectCuenta(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 hover:bg-brand-600 hover:text-white text-brand-700 rounded-md text-[11px] font-bold border border-brand-200 transition shadow-xs cursor-pointer"
                        title="Ver Plan de Cuotas"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Plan / Cuotas
                      </button>
                    </td>

                    {/* Columna ID-CLIENTE */}
                    <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">
                      {row.clave || '-'}
                    </td>

                    {/* Columna MZA */}
                    <td className="px-3 py-2.5 font-mono text-slate-500">
                      {row.mza || '-'}
                    </td>

                    {/* Columna FRENTISTA */}
                    <td className="px-3 py-2.5 font-medium text-slate-800">
                      {row.frentista_nombre || <span className="text-slate-400 italic">Sin frentista</span>}
                    </td>

                    {/* Columna METROS */}
                    <td className="px-3 py-2.5 font-mono text-right">
                      {Number(row.metros_frente || 0).toFixed(2)} m
                    </td>

                    {/* Columna CALLE */}
                    <td className="px-3 py-2.5 text-slate-700">
                      {row.calle}
                    </td>

                    {/* Columna Nº */}
                    <td className="px-3 py-2.5 text-slate-600">
                      {row.numero || 'S/N'}
                    </td>

                    {/* Columna LOTE CATAST. MUN */}
                    <td className="px-3 py-2.5 font-mono text-slate-500">
                      {row.lote_catast_muni || '-'}
                    </td>

                    {/* Columna LOTE CATAST. PROV */}
                    <td className="px-3 py-2.5 font-mono text-slate-500">
                      {row.lote_catast_provincia || '-'}
                    </td>

                    {/* Columna CONEX. GAB. */}
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${tieneGabinete ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-400'}`}>
                        {tieneGabinete ? 'SÍ' : 'NO'}
                      </span>
                    </td>

                    {/* Columna GAB. COLOC. */}
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.gabinete_colocado ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-400'}`}>
                        {row.gabinete_colocado ? 'SÍ' : 'NO'}
                      </span>
                    </td>

                    {/* Columna TITULAR SERVICIO */}
                    <td className="px-3 py-2.5 text-slate-700">
                      {row.titular_nombre || '-'}
                    </td>

                    {/* Columna PRECIO X MT. */}
                    <td className="px-3 py-2.5 font-mono text-right text-slate-700">
                      ${Number(row.precio_x_metro || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Columna COSTO OBRA */}
                    <td className="px-3 py-2.5 font-mono text-right text-slate-800">
                      ${costoObraNum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Columna SERV. DOM (CORREGIDO) */}
                    <td className="px-3 py-2.5 font-mono text-right text-slate-600">
                      {tieneGabinete ? (
                        `$${servDomNum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-slate-400 font-sans italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Columna COSTO TOTAL (CORREGIDO) */}
                    <td className="px-3 py-2.5 font-mono text-right font-bold text-slate-900">
                      ${costoTotalReal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Columna PLAN PAGOS */}
                    <td className="px-3 py-2.5 text-center">
                      {row.tiene_contrato ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {row.plan_pagos} ctas
                          </span>
                          {Number(row.monto_anticipo || 0) > 0 && (
                            <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.2 rounded mt-0.5 border border-brand-200">
                              + Anticipo
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                          Sin Plan
                        </span>
                      )}
                    </td>

                    {/* Columna CUOTA BASE */}
                    <td className="px-3 py-2.5 font-mono text-right">
                      {row.tiene_contrato ? (
                        <span className="font-bold text-slate-800 text-xs">
                          ${Number(row.cuota_base || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>

                    {/* Columna ESTADO */}
                    <td className="px-3 py-2.5 text-center">
                      {row.tiene_contrato ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          Pendiente
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};