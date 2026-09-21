import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  RotateCcw,
  Check
} from 'lucide-react';
import type { 
  PadronPreviewResponseData, 
  EstadoValidacionPadron 
} from '../../types/padronImport.types';
import { previewPadronExcel, confirmarImportacionPadron } from '../../api/padronImport.api';

interface Props {
  isOpen: boolean;
  obraId: number;
  nombreObra?: string;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

type TabFiltro = 'TODOS' | 'VALIDOS' | 'ERRORES';

export const ImportarPadronModal: React.FC<Props> = ({
  isOpen,
  obraId,
  nombreObra,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PadronPreviewResponseData | null>(null);
  const [tabActual, setTabActual] = useState<TabFiltro>('TODOS');

  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const itemsFiltrados = useMemo(() => {
    if (!previewData) return [];
    const items = previewData.items || [];
    if (tabActual === 'VALIDOS') {
      return items.filter((i) => i.estado_validacion === 'LISTO');
    }
    if (tabActual === 'ERRORES') {
      return items.filter((i) => i.estado_validacion !== 'LISTO');
    }
    return items;
  }, [previewData, tabActual]);

  
  if (!isOpen) return null;

  const handleReset = () => {
    setArchivoSeleccionado(null);
    setPreviewData(null);
    setTabActual('TODOS');
    setLoadingPreview(false);
    setConfirmando(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCerrarModal = () => {
    handleReset();
    onClose();
  };

  const procesarArchivo = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(extension || '')) {
      showToast('Formato no compatible. Sube un archivo .xlsx o .xls', 'error');
      return;
    }

    setArchivoSeleccionado(file);
    try {
      setLoadingPreview(true);
      const data = await previewPadronExcel(obraId, file);
      setPreviewData(data);
      if (data.con_errores > 0 && data.validos === 0) {
        setTabActual('ERRORES');
      }
    } catch (err: any) {
      showToast(err.message || 'Error al procesar la planilla Excel', 'error');
      setArchivoSeleccionado(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleConfirmar = async () => {
    if (!previewData || previewData.validos === 0) return;

    // Solo enviamos los ítems LISTO
    const items = previewData.items || [];
    const itemsValidos = items.filter((item) => item.estado_validacion === 'LISTO');

    try {
      setConfirmando(true);
      const res = await confirmarImportacionPadron(obraId, itemsValidos);
      showToast(res.mensaje || `Se importaron ${res.total_insertados} inmuebles correctamente`, 'success');
      window.dispatchEvent(new CustomEvent('padron:actualizado', { detail: { obraId } }));
      onSuccess();
      handleCerrarModal();
    } catch (err: any) {
      showToast(err.message || 'Error al confirmar la importación', 'error');
    } finally {
      setConfirmando(false);
    }
  };

  const renderBadgeEstado = (estado: EstadoValidacionPadron, motivo: string | null) => {
    switch (estado) {
      case 'LISTO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3" /> LISTO
          </span>
        );
      case 'DUPLICADO_EN_EXCEL':
        return (
          <span 
            title={motivo || 'Clave duplicada dentro del archivo Excel'} 
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 cursor-help"
          >
            <AlertTriangle className="w-3 h-3" /> DUPLICADO EN EXCEL
          </span>
        );
      case 'CLAVE_YA_EXISTE_EN_OBRA':
      case 'DATOS_INVALIDOS':
      default:
        return (
          <span 
            title={motivo || 'Error de datos o clave ya registrada'} 
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
          >
            <XCircle className="w-3 h-3" /> {estado.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* ================== */}
        {/* Cabecera del Modal */}
        {/* ================== */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Importar Padrón Territorial desde Excel
              </h3>
              <p className="text-xs text-slate-500">
                {nombreObra ? `Obra: ${nombreObra}` : `Obra ID #${obraId}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCerrarModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================== */}
        {/* Cuerpo Dinámico */}
        {/* ================== */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          
          {/* A. ESTADO DE CARGA DE ARCHIVO */}
          {!previewData && !loadingPreview && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                dragOver 
                  ? 'border-brand-500 bg-brand-50/50 scale-[0.99]' 
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-brand-600">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Arrastra tu archivo Excel aquí o haz clic para examinar
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Formatos admitidos: .xlsx, .xls (Estructura oficial de padrón territorial)
                </p>
              </div>
            </div>
          )}

          {/* SPINNER DE PROCESAMIENTO PREVIEW */}
          {loadingPreview && (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <p className="text-sm font-bold text-slate-700">Analizando y validando planilla...</p>
              <p className="text-xs text-slate-400">
                Verificando unicidad de IDs-Cliente, cálculo de frentes y consistencia catastral.
              </p>
            </div>
          )}

          {/* B. ESTADO DE PREVISUALIZACIÓN */}
          {previewData && !loadingPreview && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Tarjetas KPI Semafóricas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Total Filas
                  </span>
                  <div className="text-2xl font-black text-slate-800 mt-1">
                    {previewData.total_filas}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Listos para Importar
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-800 mt-1">
                    {previewData.validos}
                  </div>
                </div>

                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                      Con Error / Descartados
                    </span>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-black text-rose-800 mt-1">
                    {previewData.con_errores}
                  </div>
                </div>
              </div>

              {/* Selector de Filtros / Tabs */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTabActual('TODOS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      tabActual === 'TODOS'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Todos ({previewData.total_filas})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabActual('VALIDOS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      tabActual === 'VALIDOS'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-emerald-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Válidos ({previewData.validos})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabActual('ERRORES')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      tabActual === 'ERRORES'
                        ? 'bg-white text-rose-700 shadow-xs'
                        : 'text-slate-500 hover:text-rose-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Errores ({previewData.con_errores})
                  </button>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="font-medium text-slate-700">Archivo:</span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {archivoSeleccionado?.name}
                  </span>
                </div>
              </div>

              {/* Tabla de Preview con Scroll */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[42vh]">
                  <table className="w-full text-left text-xs text-slate-600 whitespace-nowrap border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2.5 bg-slate-50 text-center">Fila</th>
                        <th className="px-3 py-2.5 bg-slate-50">ID-Cliente</th>
                        <th className="px-3 py-2.5 bg-slate-50 text-center">Mza</th>
                        <th className="px-3 py-2.5 bg-slate-50 text-center">Lote Muni</th>
                        <th className="px-3 py-2.5 bg-slate-50 text-right">Metros</th>
                        <th className="px-3 py-2.5 bg-slate-50">Titular de Lote</th>
                        <th className="px-3 py-2.5 bg-slate-50">Titular Servicio</th>
                        <th className="px-3 py-2.5 bg-slate-50">Doc. Fiscal</th>
                        <th className="px-3 py-2.5 bg-slate-50 text-center">Estado Validación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {itemsFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                            No hay registros para este filtro.
                          </td>
                        </tr>
                      ) : (
                        itemsFiltrados.map((item, idx) => {
                          const docFiscal = item.titular_cuit || item.titular_dni || '-';
                          const esValido = item.estado_validacion === 'LISTO';

                          return (
                            <tr 
                              key={`${item.fila_excel}-${idx}`} 
                              className={`transition ${esValido ? 'hover:bg-slate-50/70' : 'bg-rose-50/30 hover:bg-rose-50/50'}`}
                            >
                              <td className="px-3 py-2 font-mono text-slate-400 text-center text-[11px]">
                                {item.fila_excel}
                              </td>

                              <td className="px-3 py-2 font-mono font-bold text-slate-800">
                                {item.clave_cliente ? (
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                                    {item.clave_cliente}
                                  </span>
                                ) : (
                                  <span className="text-rose-500 italic text-[10px]">S/D</span>
                                )}
                              </td>

                              <td className="px-3 py-2 text-center font-mono">{item.manzana || '-'}</td>
                              <td className="px-3 py-2 text-center font-mono">{item.lote_catast_muni || '-'}</td>

                              <td className="px-3 py-2 font-mono text-right font-bold text-slate-700">
                                {Number(item.metros_frente || 0).toFixed(2)} m
                              </td>

                              <td className="px-3 py-2 font-semibold text-slate-800">
                                {item.frentista_nombre || <span className="text-slate-400 italic font-normal">Sin Asignar</span>}
                              </td>

                              <td className="px-3 py-2 text-slate-700">
                                {item.titular_nombre || item.frentista_nombre || '-'}
                              </td>

                              <td className="px-3 py-2 font-mono text-slate-600 text-[11px]">
                                {docFiscal}
                              </td>

                              <td className="px-3 py-2 text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  {renderBadgeEstado(item.estado_validacion, item.motivo_rechazo)}
                                  {item.motivo_rechazo && item.estado_validacion !== 'LISTO' && (
                                    <span className="text-[10px] text-rose-600 max-w-[220px] truncate block font-sans" title={item.motivo_rechazo}>
                                      {item.motivo_rechazo}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones Inferiores */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {previewData && (
              <button
                type="button"
                onClick={handleReset}
                disabled={confirmando}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Subir otro archivo
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCerrarModal}
              disabled={confirmando}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Cancelar
            </button>

            {previewData && (
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={previewData.validos === 0 || confirmando}
                className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirmando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Confirmando Importación...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Importación ({previewData.validos} inmuebles)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};