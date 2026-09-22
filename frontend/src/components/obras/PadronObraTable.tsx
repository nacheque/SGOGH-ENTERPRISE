import React, { useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import type { PadronInmuebleDTO } from '../../types';
import { EditarInmuebleModal } from './EditarInmuebleModal';

interface Props {
  padron: PadronInmuebleDTO[];
  loading: boolean;
  obraId: number;
  onRefresh?: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export const PadronObraTable: React.FC<Props> = ({
  padron,
  loading,
  obraId,
  onRefresh = () => {},
  showToast = () => {},
}) => {
  const [selectedInmueble, setSelectedInmueble] = useState<PadronInmuebleDTO | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEdit = (item: PadronInmuebleDTO) => {
    setSelectedInmueble(item);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setSelectedInmueble(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
        <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
          Padrón Consolidado ({padron.length} registros)
        </span>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs">Cargando padrón de la obra...</span>
        </div>
      ) : padron.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          No se encontraron inmuebles registrados para esta obra.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="w-full text-left text-xs text-slate-600 whitespace-nowrap border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 bg-slate-50 text-center">Acciones</th>
                <th className="px-3 py-3 bg-slate-50">N°</th>
                <th className="px-3 py-3 bg-slate-50">ID-Cliente</th>
                <th className="px-3 py-3 bg-slate-50">Titular de Lote</th>
                <th className="px-3 py-3 bg-slate-50 text-right">Metros</th>
                <th className="px-3 py-3 bg-slate-50">Calle</th>
                <th className="px-3 py-3 bg-slate-50">Altura / N°</th>
                <th className="px-3 py-3 bg-slate-50 text-center">Mza</th>
                <th className="px-3 py-3 bg-slate-50 text-center">Lote Cat. Mun.</th>
                <th className="px-3 py-3 bg-slate-50 text-center">Lote Cat. Prov.</th>
                <th className="px-3 py-3 bg-slate-50 text-center">Conex. Gab.</th>
                <th className="px-3 py-3 bg-slate-50 text-center">Gab. Coloc.</th>
                <th className="px-3 py-3 bg-slate-50">Titular Servicio</th>
                <th className="px-3 py-3 bg-slate-50">Datos Fiscales</th>
                <th className="px-3 py-3 bg-slate-50">Contacto</th>
                <th className="px-3 py-3 bg-slate-50">Dom. Notificación</th>
                <th className="px-3 py-3 bg-slate-50">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {padron.map((item, idx) => {
                const dni = item.titular_dni || item.frentista_dni;
                const cuit = item.titular_cuit || item.frentista_cuit;
                const telefono = item.titular_telefono || item.frentista_telefono;
                const email = item.titular_email || item.frentista_email;
                const domicilioNotif = item.titular_domicilio || item.domicilio_notificacion;

                return (
                  <tr key={item.id_inmueble} className="hover:bg-slate-50/70 transition">
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Modificar Inmueble"
                        className="p-1.5 bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 border border-slate-200 hover:border-brand-200 rounded-lg transition cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>

                    <td className="px-3 py-2.5 font-mono font-bold text-slate-700 text-xs">
                      {item.clave_cliente ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 border border-slate-200">
                          {item.clave_cliente}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-sans text-[11px]">-</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 font-bold text-slate-800">
                      {item.frentista_nombre || <span className="text-slate-400 italic">Sin Asignar</span>}
                    </td>

                    <td className="px-3 py-2.5 font-mono text-right font-bold text-slate-700">
                      {Number(item.metros_frente).toFixed(2)} m
                    </td>

                    <td className="px-3 py-2.5 text-slate-700">{item.calle}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">{item.numero || 'S/N'}</td>
                    <td className="px-3 py-2.5 text-center font-mono">{item.manzana || '-'}</td>
                    <td className="px-3 py-2.5 text-center font-mono">{item.lote_catast_muni || '-'}</td>
                    <td className="px-3 py-2.5 text-center font-mono">{item.lote_catast_provincia || '-'}</td>

                    <td className="px-3 py-2.5 text-center">
                      {item.conexion_gabinete ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          <XCircle className="w-3 h-3" /> No
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      {item.gabinete_colocado ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3" /> Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          <XCircle className="w-3 h-3" /> No
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-slate-700 font-semibold">
                      {item.titular_nombre || item.frentista_nombre || '-'}
                    </td>

                    <td className="px-3 py-2.5 text-[11px] font-mono text-slate-600">
                      {dni && <div>DNI: {dni}</div>}
                      {cuit && <div className="text-[10px] text-slate-400">CUIT: {cuit}</div>}
                      {!dni && !cuit && <span className="text-slate-400 italic font-sans">-</span>}
                    </td>

                    <td className="px-3 py-2.5 text-[11px] text-slate-600">
                      {telefono && <div className="font-mono">{telefono}</div>}
                      {email && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={email}>
                          {email}
                        </div>
                      )}
                      {!telefono && !email && <span className="text-slate-400 italic">-</span>}
                    </td>

                    <td
                      className="px-3 py-2.5 text-[11px] text-slate-600 max-w-[180px] truncate"
                      title={domicilioNotif || 'Misma que el lote'}
                    >
                      {domicilioNotif || <span className="text-slate-400 italic">Misma que el lote</span>}
                    </td>

                    <td className="px-3 py-2.5 text-slate-400 italic text-[11px] max-w-xs truncate">
                      {item.observacion || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Edición */}
      <EditarInmuebleModal
        isOpen={isEditModalOpen}
        inmueble={selectedInmueble}
        obraId={obraId}
        onClose={handleCloseEdit}
        onSuccess={onRefresh}
        showToast={showToast}
      />
    </div>
  );
};