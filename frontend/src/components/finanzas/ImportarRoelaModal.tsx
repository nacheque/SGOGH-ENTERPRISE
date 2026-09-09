import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  FileCheck,
  Trash2,
  Loader2,
  CheckCircle2,
  DollarSign,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const ImportarRoelaModal: React.FC<Props> = ({ isOpen, onClose, showToast }) => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setAnalyzed(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setFile(null);
    setAnalyzed(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = () => {
    if (!file) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 1000);
  };

  const handleConfirm = () => {
    showToast('Rendición SIRO importada e imputada con éxito (Simulación)', 'success');
    handleClose();
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Conciliación Bancaria • SIRO (Banco Roela)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Carga del reporte oficial de cobranzas para imputación automática.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {/* Zona Drag & Drop */}
          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,.csv,.txt"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <div className="mx-auto w-12 h-12 bg-white rounded-full shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <UploadCloud className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-slate-700">
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Formatos permitidos: .xls, .xlsx, .csv, .txt
              </p>
            </div>
          ) : (
            /* Card de Archivo Seleccionado */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 break-all">{file.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200"
                  title="Quitar archivo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Botón Analizar si aún no está analizado */}
              {!analyzed && (
                <div className="flex justify-end">
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analizando archivo...
                      </>
                    ) : (
                      'Analizar Archivo'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Resumen Simulado (Preview Mock) */}
          {analyzed && (
            <div className="space-y-3 pt-2 animate-in fade-in duration-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Resultado de la Verificación
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Registros</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-slate-800 block mt-1">
                    3 operaciones
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Total Cobrado</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-emerald-600 block mt-1">
                    $ 914.652,97
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
                    <AlertCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Estado</span>
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Listo para imputar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!analyzed}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" /> Confirmar e Imputar Pagos
          </button>
        </div>
      </div>
    </div>
  );
};