import React, { useEffect, useState, useMemo } from 'react';
import type { ObraDTO, CreateObraDTO, PadronInmuebleDTO } from '../types/obras.types';
import { getObras, createObra, getPadronByObra } from '../api/obrasRediseño.api';
import { 
  HardHat, 
  Plus, 
  ArrowLeft, 
  Search, 
  Building2, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Loader2 
} from 'lucide-react';

interface Props {
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const ObrasView: React.FC<Props> = ({ showToast }) => {
  const [obras, setObras] = useState<ObraDTO[]>([]);
  const [loadingObras, setLoadingObras] = useState(false);
  const [obraSeleccionada, setObraSeleccionada] = useState<ObraDTO | null>(null);

  // Detalle: Padrón
  const [padron, setPadron] = useState<PadronInmuebleDTO[]>([]);
  const [loadingPadron, setLoadingPadron] = useState(false);
  const [filtroPadron, setFiltroPadron] = useState('');

  // Formulario Maestro
  const [showAltaModal, setShowAltaModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateObraDTO>({
    nombre_obra: '',
    ubicacion: '',
    anio: new Date().getFullYear(),
    precio_x_metro: 0,
    costo_gabinete: 0,
    estado: 'ACTIVA',
  });

  const fetchObrasList = async () => {
    try {
      setLoadingObras(true);
      const data = await getObras();
      setObras(data);
    } catch (err) {
      console.error('Error al listar obras:', err);
    } finally {
      setLoadingObras(false);
    }
  };

  useEffect(() => {
    fetchObrasList();
  }, []);

  const handleSeleccionarObra = async (obra: ObraDTO) => {
    setObraSeleccionada(obra);
    setFiltroPadron('');
    try {
      setLoadingPadron(true);
      const data = await getPadronByObra(obra.id_obra);
      setPadron(data);
    } catch (err) {
      console.error('Error al cargar padrón de la obra:', err);
    } finally {
      setLoadingPadron(false);
    }
  };

  const handleSubmitObra = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createObra(formData);
      setShowAltaModal(false);
      setFormData({
        nombre_obra: '',
        ubicacion: '',
        anio: new Date().getFullYear(),
        precio_x_metro: 0,
        costo_gabinete: 0,
        estado: 'ACTIVA',
      });
      fetchObrasList();
    } catch (err) {
      console.error('Error al crear obra:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const padronFiltrado = useMemo(() => {
    const q = filtroPadron.toLowerCase().trim();
    if (!q) return padron;
    return padron.filter(
      (item) =>
        item.clave_cliente?.toLowerCase().includes(q) ||
        item.frentista_nombre?.toLowerCase().includes(q) ||
        item.titular_nombre?.toLowerCase().includes(q) ||
        item.calle?.toLowerCase().includes(q) ||
        item.frentista_dni?.includes(q) ||
        item.frentista_cuit?.includes(q)
    );
  }, [padron, filtroPadron]);

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ========================================================= */}
      {/* VISTA DETALLE: PADRÓN TERRITORIAL DE LA OBRA              */}
      {/* ========================================================= */}
      {obraSeleccionada ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Contextual */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setObraSeleccionada(null)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Volver a Obras
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{obraSeleccionada.nombre_obra}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {obraSeleccionada.estado}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {obraSeleccionada.ubicacion}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Período: {obraSeleccionada.anio}
                  </span>
                  <span>
                    Precio/m: <strong>${Number(obraSeleccionada.precio_x_metro).toLocaleString('es-AR')}</strong>
                  </span>
                  <span>
                    Gabinete Base: <strong>${Number(obraSeleccionada.costo_gabinete).toLocaleString('es-AR')}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Buscador Padrón */}
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Buscar frentista, calle, DNI..."
                value={filtroPadron}
                onChange={(e) => setFiltroPadron(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 focus:bg-white font-medium transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Planilla Territorial de Inmuebles */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Padrón Consolidado ({padronFiltrado.length} registros)
              </span>
            </div>

            {loadingPadron ? (
              <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                <span className="text-xs">Cargando padrón de la obra...</span>
              </div>
            ) : padronFiltrado.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No se encontraron inmuebles registrados para esta obra.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[65vh]">
                <table className="w-full text-left text-xs text-slate-600 whitespace-nowrap border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-3 bg-slate-50">N°</th>
                      <th className="px-3 py-3 bg-slate-50">Frentista</th>
                      <th className="px-3 py-3 bg-slate-50 text-right">Metros</th>
                      <th className="px-3 py-3 bg-slate-50">Calle</th>
                      <th className="px-3 py-3 bg-slate-50">Altura / N°</th>
                      <th className="px-3 py-3 bg-slate-50 text-center">Mza</th>
                      <th className="px-3 py-3 bg-slate-50 text-center">Lote Cat. Mun.</th>
                      <th className="px-3 py-3 bg-slate-50 text-center">Lote Cat. Prov.</th>
                      <th className="px-3 py-3 bg-slate-50 text-center">Conex. Gab.</th>
                      <th className="px-3 py-3 bg-slate-50 text-center">Gab. Coloc.</th>
                      <th className="px-3 py-3 bg-slate-50">Titular Servicio</th>
                      <th className="px-3 py-3 bg-slate-50">Contacto</th>
                      <th className="px-3 py-3 bg-slate-50">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {padronFiltrado.map((item, idx) => (
                      <tr key={item.id_inmueble} className="hover:bg-slate-50/70 transition">
                        <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
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
                        <td className="px-3 py-2.5 text-slate-600">
                          {item.titular_nombre || item.frentista_nombre || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] font-mono text-slate-500">
                          <div>{item.frentista_dni ? `DNI: ${item.frentista_dni}` : item.frentista_cuit ? `CUIT: ${item.frentista_cuit}` : '-'}</div>
                          {item.frentista_telefono && <div className="text-[10px] text-slate-400">{item.frentista_telefono}</div>}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400 italic text-[11px] max-w-xs truncate">
                          {item.observacion || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* VISTA MAESTRO: LISTADO DE OBRAS                           */
        /* ========================================================= */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Gestión de Obras</h1>
              <p className="text-xs text-slate-500 mt-1">
                Administración de proyectos de infraestructura y relevamiento de parcelas territoriales.
              </p>
            </div>
            <button
              onClick={() => setShowAltaModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" /> Nueva Obra
            </button>
          </div>

          {/* Tabla Maestro de Obras */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {loadingObras ? (
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
                            onClick={() => handleSeleccionarObra(obra)}
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

          {/* Modal de Alta de Obra */}
          {showAltaModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Registrar Nueva Obra</h3>
                  <button
                    onClick={() => setShowAltaModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSubmitObra} className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nombre de la Obra *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Red de Gas Natural Barrio Centro"
                      value={formData.nombre_obra}
                      onChange={(e) => setFormData({ ...formData, nombre_obra: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Ubicación / Localidad *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Villa General Belgrano"
                        value={formData.ubicacion}
                        onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Año *</label>
                      <input
                        type="number"
                        required
                        value={formData.anio}
                        onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) || 2026 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Precio Base x Metro ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.precio_x_metro}
                        onChange={(e) => setFormData({ ...formData, precio_x_metro: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Costo Gabinete Base ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.costo_gabinete}
                        onChange={(e) => setFormData({ ...formData, costo_gabinete: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAltaModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition disabled:opacity-50"
                    >
                      {submitting ? 'Guardando...' : 'Crear Obra'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};