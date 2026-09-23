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
  ArrowRight
} from 'lucide-react';
import type { PlanImportItemDTO, PreviewPlanesImportResponse } from '../../types';
import { previewImportacionPlanes, confirmarImportacionPlanes } from '../../api/planesImport.api';

interface Props {
  isOpen: boolean;
  obraId: number;
  nombreObra?: string;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

type TabFiltro = 'TODOS' | 'VALIDOS' | 'OBSERVACIONES';

export const ImportarPlanesModal: React.FC<Props> = ({
  isOpen,
  obraId,
  nombreObra,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewPlanesImportResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabFiltro>('TODOS');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lista filtrada en base a la pestaña seleccionada
  const filteredItems = useMemo(() => {
    if (!previewData) return [];
    if (activeTab === 'VALIDOS') {
      return previewData.items.filter((i) => i.estado === 'LISTO');
    }
    if (activeTab === 'OBSERVACIONES') {
      return previewData.items.filter((i) => i.estado !== 'LISTO');
    }
    return previewData.items;
  }, [previewData, activeTab]);

  // Si el modal está cerrado, no se monta nada
  if (!isOpen) return null;

  const handleResetModal = () => {
    setFile(null);
    setPreviewData(null);
    setActiveTab('TODOS');
    setLoadingPreview(false);
    setConfirmando(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCerrar = () => {
    handleResetModal();
    onClose();
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validarYAsignarArchivo(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validarYAsignarArchivo(selectedFile);
  };

  const validarYAsignarArchivo = (targetFile: File) => {
    const name = targetFile.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      showToast('Solo se permiten planillas Excel (.xlsx, .xls)', 'error');
      return;
    }
    setFile(targetFile);
  };

  const handleAnalizar = async () => {
    if (!file) return;
    try {
      setLoadingPreview(true);
      const data = await previewImportacionPlanes(obraId, file);
      setPreviewData(data);
      if (data.validos === 0) {
        showToast('No se encontraron registros válidos para crear planes', 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al procesar el archivo';
      showToast(msg, 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

const handleConfirmar = async () => {
    if (!previewData || previewData.validos === 0) return;

    const validRows = previewData.items
      .filter((i) => i.estado === 'LISTO' && i.id_inmueble)
      .map((i) => ({
        clave_cliente: i.clave_cliente,
        id_inmueble: i.id_inmueble!,
        tipo_contrato: i.tipo_contrato,
        monto_anticipo: Number(i.monto_anticipo) || 0,
        fecha_inicio: i.fecha_inicio,
        plan_cuotas_obra: Number(i.plan_cuotas_obra) || 0,
        monto_total_obra: Number(i.monto_total_obra) || 0,         // <--- Enviamos el monto de obra
        plan_cuotas_gabinete: Number(i.plan_cuotas_gabinete) || 0,
        monto_total_gabinete: Number(i.monto_total_gabinete) || 0, // <--- Enviamos el monto de gabinete
      }));

    if (validRows.length === 0) {
      showToast('No se encontraron inmuebles asociados válidos para importar', 'error');
      return;
    }

    try {
      setConfirmando(true);
      const res = await confirmarImportacionPlanes(obraId, { filas: validRows });
      
      const creados = res.planes_creados ?? validRows.length;
      showToast(res.message || `Se importaron ${creados} planes de cuotas correctamente`, 'success');

      // Notificación cross-view
      window.dispatchEvent(new CustomEvent('padron:actualizado', { detail: { obraId } }));

      onSuccess();
      handleCerrar();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al confirmar la importación de planes';
      showToast(msg, 'error');
    } finally {
      setConfirmando(false);
    }
  };

  const renderBadgeEstado = (item: PlanImportItemDTO) => {
    switch (item.estado) {
      case 'LISTO':
        return (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Listo
            </span>
            {item.discrepancia_domicilio && (
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 cursor-help"
                title={`Domicilio en Padrón: ${item.domicilio_sistema || 'Sin datos'}\nDomicilio en Excel: ${item.domicilio_excel || 'Sin datos'}`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" /> Dif. Calle
              </span>
            )}
          </div>
        );
      case 'PLAN_YA_EXISTE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Plan ya activo
          </span>
        );
      case 'CLAVE_NO_EXISTE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> No figura en padrón
          </span>
        );
      case 'DATOS_INVALIDOS':
      case 'DUPLICADO_EN_EXCEL':
      default:
        return (
          <span 
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
            title={item.motivo_rechazo || 'Datos inválidos'}
          >
            <XCircle className="w-3 h-3 text-rose-600" /> {item.motivo_rechazo || 'Inválido'}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 border border-brand-100 rounded-xl text-brand-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Importación Masiva de Planes de Pago
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Obra: <span className="font-semibold text-slate-700">{nombreObra || `#${obraId}`}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCerrar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* PASO 1: Dropzone de Carga si aún no hay preview */}
          {!previewData ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragging 
                    ? 'border-brand-500 bg-brand-50/50' 
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="p-4 bg-white rounded-2xl shadow-xs border border-slate-200 text-slate-500">
                  <UploadCloud className="w-8 h-8 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {file ? file.name : 'Arrastrá tu planilla Excel aquí o hacé clic para buscar'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Archivos admitidos: .xlsx o .xls con columnas de ID-Cliente, Contrato, Cuotas y Anticipo.
                  </p>
                </div>
                {file && (
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {(file.size / 1024).toFixed(1)} KB seleccionado
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCerrar}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAnalizar}
                  disabled={!file || loadingPreview}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analizando Planilla...
                    </>
                  ) : (
                    <>
                      Analizar Planilla
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* PASO 2: Visualización Semafórica y Tabla */
            <div className="space-y-6">
              
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    Total Filas Procesadas
                  </span>
                  <div className="text-2xl font-black text-slate-800 mt-2 font-mono">
                    {previewData.total_filas}
                  </div>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-emerald-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Listos para Generar
                  </span>
                  <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
                    {previewData.validos}
                  </div>
                </div>

                <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-rose-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Con Observaciones / Errores
                  </span>
                  <div className="text-2xl font-black text-rose-700 mt-2 font-mono">
                    {previewData.con_observaciones}
                  </div>
                </div>
              </div>

              {/* Tabs de Filtro */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('TODOS')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      activeTab === 'TODOS'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todos ({previewData.total_filas})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('VALIDOS')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      activeTab === 'VALIDOS'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Listos ({previewData.validos})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('OBSERVACIONES')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      activeTab === 'OBSERVACIONES'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Con Observaciones ({previewData.con_observaciones})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetModal}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Cargar otro archivo
                </button>
              </div>

              {/* Tabla de Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto max-h-[44vh]">
                  <table className="w-full text-left text-xs text-slate-600 whitespace-nowrap border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2.5 bg-slate-50 text-center">Fila</th>
                        <th className="px-3 py-2.5 bg-slate-50">ID-Cliente</th>
                        <th className="px-3 py-2.5 bg-slate-50">Titular Padrón</th>
                        <th className="px-3 py-2.5 bg-slate-50">Tipo Contrato</th>
                        <th className="px-3 py-2.5 bg-slate-50 text-right">Anticipo</th>
                        <th className="px-3 py-2.5 bg-slate-50 text-center">Cuotas Obra</th>
                        <th className="px-3 py-2.5 bg-slate-50 text-center">Cuotas Gab.</th>
                        <th className="px-3 py-2.5 bg-slate-50">Fecha Inicio</th>
                        <th className="px-3 py-2.5 bg-slate-50">Estado / Validación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                            No hay registros para este filtro.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item, idx) => (
                          <tr key={`${item.fila_excel}-${idx}`} className="hover:bg-slate-50/70 transition">
                            <td className="px-3 py-2 font-mono text-slate-400 text-center text-[11px]">
                              {item.fila_excel}
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-slate-800">
                              {item.clave_cliente}
                            </td>
                            <td className="px-3 py-2 text-slate-800">
                              {item.titular_nombre || <span className="text-slate-400 italic">No asociado</span>}
                            </td>
                            <td className="px-3 py-2">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                {item.tipo_contrato}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-right font-bold text-slate-700">
                              ${Number(item.monto_anticipo || 0).toLocaleString('es-AR')}
                            </td>
                            <td className="px-3 py-2 text-center font-mono font-bold">
                              {item.plan_cuotas_obra}
                            </td>
                            <td className="px-3 py-2 text-center font-mono font-bold">
                              {item.plan_cuotas_gabinete}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-600">
                              {item.fecha_inicio || '-'}
                            </td>
                            <td className="px-3 py-2">
                              {renderBadgeEstado(item)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer / Acción de Confirmación */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  Se omitirán automáticamente las filas con errores o planes ya existentes.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCerrar}
                    disabled={confirmando}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmar}
                    disabled={confirmando || previewData.validos === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {confirmando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generando Planes...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar e Importar {previewData.validos} Planes Válidos
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};