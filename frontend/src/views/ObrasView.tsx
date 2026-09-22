import React, { useEffect, useState, useMemo } from 'react';
import type { Obra, PadronInmuebleDTO } from '../types';
import { getObras, getPadronByObra } from '../api/obrasRediseño.api';
import { 
  Plus, 
  ArrowLeft, 
  Search, 
  Calendar, 
  MapPin,
  FileSpreadsheet 
} from 'lucide-react';
import { NuevoInmuebleModal } from '../components/obras/NuevoInmuebleModal';
import { NuevaObraModal } from '../components/obras/NuevaObraModal';
import { ObraTable } from '../components/obras/ObraTable';
import { PadronObraTable } from '../components/obras/PadronObraTable';
import { ImportarPadronModal } from '../components/obras/ImportarPadronModal';

interface Props {
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const ObrasView: React.FC<Props> = ({ showToast }) => {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loadingObras, setLoadingObras] = useState(false);
  const [obraSeleccionada, setObraSeleccionada] = useState<Obra | null>(null);

  // Detalle: Padrón
  const [padron, setPadron] = useState<PadronInmuebleDTO[]>([]);
  const [loadingPadron, setLoadingPadron] = useState(false);
  const [filtroPadron, setFiltroPadron] = useState('');

  // Modales
  const [showAltaModal, setShowAltaModal] = useState(false);
  const [showNuevoInmuebleModal, setShowNuevoInmuebleModal] = useState(false);
  const [showImportarPadronModal, setShowImportarPadronModal] = useState(false);

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

  const handleSeleccionarObra = async (obra: Obra) => {
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

  const handleRecargarPadron = () => {
    if (obraSeleccionada) {
      getPadronByObra(obraSeleccionada.id_obra).then((data) => setPadron(data));
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
      {obraSeleccionada ? (
        /* ========================================================= */
        /* VISTA DETALLE: PADRÓN TERRITORIAL DE LA OBRA              */
        /* ========================================================= */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Contextual */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setObraSeleccionada(null)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
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
                  {obraSeleccionada.descripcion && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {obraSeleccionada.descripcion}
                    </span>
                  )}
                  {obraSeleccionada.fecha_inicio && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Período: {new Date(obraSeleccionada.fecha_inicio).getFullYear()}
                    </span>
                  )}
                  <span>
                    Precio/m: <strong>${Number(obraSeleccionada.precio_x_metro).toLocaleString('es-AR')}</strong>
                  </span>
                  <span>
                    Gabinete Base: <strong>${Number(obraSeleccionada.costo_gabinete).toLocaleString('es-AR')}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* LADO DERECHO: Botones de Acción + Buscador */}
            <div className="flex items-center gap-3">
              {/* Botón Importar Excel */}
              <button
                onClick={() => setShowImportarPadronModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> Importar Padrón Excel
              </button>

              {/* Botón Cargar Inmueble Manual */}
              <button
                onClick={() => setShowNuevoInmuebleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Cargar Inmueble al Padrón
              </button>

              <div className="relative w-64">
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
          </div>

          {/* Tabla Padrón (Con soporte para Edición) */}
          <PadronObraTable 
            padron={padronFiltrado} 
            loading={loadingPadron} 
            obraId={obraSeleccionada.id_obra}
            onRefresh={handleRecargarPadron}
            showToast={showToast}
          />
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
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nueva Obra
            </button>
          </div>

          {/* Tabla Maestro de Obras */}
          <ObraTable
            obras={obras}
            loading={loadingObras}
            onSelectObra={handleSeleccionarObra}
          />

          {/* Modal de Alta de Obra */}
          <NuevaObraModal
            isOpen={showAltaModal}
            onClose={() => setShowAltaModal(false)}
            onSuccess={fetchObrasList}
          />
        </div>
      )}

      {/* Modal de Alta de Inmueble */}
      {obraSeleccionada && (
        <NuevoInmuebleModal
          isOpen={showNuevoInmuebleModal}
          idObra={obraSeleccionada.id_obra}
          onClose={() => setShowNuevoInmuebleModal(false)}
          onSuccess={handleRecargarPadron}
          showToast={showToast || (() => {})}
        />
      )}

      {/* Modal de Importar Padrón */}
      {obraSeleccionada && (
        <ImportarPadronModal
          isOpen={showImportarPadronModal}
          obraId={obraSeleccionada.id_obra}
          nombreObra={obraSeleccionada.nombre_obra}
          onClose={() => setShowImportarPadronModal(false)}
          onSuccess={handleRecargarPadron}
          showToast={showToast}
        />
      )}
    </div>
  );
};