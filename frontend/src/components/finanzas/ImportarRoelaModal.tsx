import React, { useState, useRef } from 'react';
import type {
  ConciliacionItemDTO,
  ConciliacionSummaryDTO,
  EstadoConciliacion,
} from '../../types/conciliaciones.types';
import { conciliacionesApi } from '../../api/conciliaciones.api';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Ban,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onSuccess?: () => void;
}

type ModalStep = 'IDLE' | 'ANALYZING' | 'PREVIEW' | 'CONFIRMING';

export const ImportarRoelaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  showToast,
  onSuccess,
}) => {
  const [step, setStep] = useState<ModalStep>('IDLE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ConciliacionSummaryDTO | null>(null);
  const [items, setItems] = useState<ConciliacionItemDTO[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStep('IDLE');
    setSelectedFile(null);
    setSummary(null);
    setItems([]);
    setIsDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (step === 'ANALYZING' || step === 'CONFIRMING') return;
    resetState();
    onClose();
  };

  const handleFileProcess = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      showToast('Formato no admitido. Ingrese un archivo Excel (.xlsx, .xls) o .csv', 'error');
      return;
    }

    setSelectedFile(file);
    setStep('ANALYZING');

    try {
      const res: any = await conciliacionesApi.previewRoela(file);
      const backendData = res?.data ?? res;

      const parsedSummary: ConciliacionSummaryDTO = {
        total_registros: Number(backendData.total_filas ?? backendData.summary?.total_registros ?? 0),
        listos_para_imputar: Number(backendData.listos_para_imputar ?? 0),
        con_inconsistencias: Number(backendData.con_inconsistencias ?? 0),
        monto_total_conciliar: Number(
          backendData.monto_total_a_conciliar ?? backendData.monto_total_conciliar ?? 0
        ),
      };

      const parsedItems: ConciliacionItemDTO[] = Array.isArray(backendData.items)
        ? backendData.items
        : Array.isArray(backendData.rows)
        ? backendData.rows
        : [];

      setSummary(parsedSummary);
      setItems(parsedItems);
      setStep('PREVIEW');
    } catch (err: any) {
      console.error('Error en preview Roela:', err);
      const errorMsg =
        err.response?.data?.message || 'Error al analizar y previsualizar el archivo de Roela';
      showToast(errorMsg, 'error');
      resetState();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmar = async () => {
    if (!summary || summary.listos_para_imputar === 0) return;

    // Filtramos únicamente las operaciones válidas
    const pagosValidos = items.filter((item) => {
      const estado = String(
        item.estado_preview || item.estado_conciliacion || (item as any).estado || ''
      ).toUpperCase();
      return estado.includes('LISTO') || estado.includes('VALIDO') || (item as any).valido === true;
    });

    if (pagosValidos.length === 0) {
      showToast('No hay operaciones válidas para imputar.', 'error');
      return;
    }

    setStep('CONFIRMING');

    try {
      await conciliacionesApi.confirmarRoela(pagosValidos);

      showToast(
        `Se imputaron con éxito ${summary.listos_para_imputar} pagos por un total de $${summary.monto_total_conciliar.toLocaleString(
          'es-AR',
          { minimumFractionDigits: 2 }
        )}`,
        'success'
      );
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      console.error('Error al confirmar conciliación:', err);
      const errorMsg =
        err.response?.data?.message || 'Error al confirmar la imputación masiva de pagos';
      showToast(errorMsg, 'error');
      setStep('PREVIEW');
    }
  };

  const renderBadgeEstado = (estadoRaw?: string, motivo?: string) => {
    const estado = String(estadoRaw || '').toUpperCase().trim();

    if (estado.includes('LISTO') || estado === 'VALIDO') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Listo para imputar
        </span>
      );
    }
    if (estado.includes('DUPLICADO')) {
      return (
        <span
          title={motivo || 'Pago ya procesado anteriormente'}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 cursor-help"
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Duplicado
        </span>
      );
    }
    if (estado.includes('NO_ENCONTRADO') || estado.includes('INMUEBLE')) {
      return (
        <span
          title={motivo || 'Clave de frentista no hallada en el padrón'}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
        >
          <XCircle className="w-3 h-3 text-rose-600" />
          Inmueble no encontrado
        </span>
      );
    }
    if (estado.includes('SIN_CUOTAS') || estado.includes('PAGADA')) {
      return (
        <span
          title={motivo || 'El frentista no posee deuda exigible'}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 cursor-help"
        >
          <Ban className="w-3 h-3 text-slate-500" />
          Sin cuotas pendientes
        </span>
      );
    }

    return (
      <span className="text-[11px] text-slate-400 font-mono">
        {estadoRaw || 'Omitido'}
      </span>
    );
  };
  

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Conciliación Automática de Pagos • Banco Roela
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Procesamiento de cobranzas bancarias, cruce con padrón y liquidación de cuotas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={step === 'ANALYZING' || step === 'CONFIRMING'}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Principal */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'IDLE' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center cursor-pointer transition ${
                isDragOver
                  ? 'border-brand-500 bg-brand-50/40 scale-[0.99]'
                  : 'border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              <div className="p-4 bg-white rounded-2xl shadow-xs border border-slate-100 mb-4 text-brand-600">
                <UploadCloud className="w-10 h-10" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                Arrastrá acá el archivo de recaudación o hacé clic para explorar
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mb-4 font-medium">
                Formatos compatibles: Planillas Excel (.xlsx, .xls) o extractos exportados de Banco Roela (.csv)
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200">
                Seleccionar archivo del equipo
              </span>
            </div>
          )}

          {step === 'ANALYZING' && (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Analizando operaciones bancarias...
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cruzando claves de clientes, verificando vencimientos e identificando cuotas imputables
                </p>
              </div>
            </div>
          )}

          {(step === 'PREVIEW' || step === 'CONFIRMING') && summary && (
            <div className="space-y-6">
              {/* Panel de Métricas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3.5">
                  <div className="p-2 bg-emerald-100/70 text-emerald-700 rounded-lg shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Válidos para Imputar
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-bold font-mono text-emerald-900">
                        {summary.listos_para_imputar}
                      </span>
                      <span className="text-xs text-emerald-700 font-semibold font-mono">
                        de {summary.total_registros} filas
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 block mt-1">
                      Total: ${summary.monto_total_conciliar.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3.5">
                  <div className="p-2 bg-amber-100/70 text-amber-700 rounded-lg shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      Inconsistencias Detectadas
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-bold font-mono text-amber-900">
                        {summary.con_inconsistencias}
                      </span>
                      <span className="text-xs text-amber-700 font-medium">
                        registros omitidos
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-700 mt-1 font-medium leading-tight">
                      Duplicados o claves sin padrón asignado (no afectarán caja).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                  <div className="p-2 bg-white text-slate-600 rounded-lg border border-slate-200 shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Archivo Origen
                    </span>
                    <p className="text-xs font-bold text-slate-800 truncate mt-0.5" title={selectedFile?.name}>
                      {selectedFile?.name}
                    </p>
                    <span className="text-[11px] text-slate-400 font-mono block mt-1">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabla Semafórica de Operaciones */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0 border-b border-slate-200 z-10 shadow-2xs">
                      <tr>
                        <th className="px-3 py-2.5">Clave / Frentista</th>
                        <th className="px-3 py-2.5">Cuota Imputada</th>
                        <th className="px-3 py-2.5">Fecha Cobro</th>
                        <th className="px-3 py-2.5 text-right">Importe Abonado</th>
                        <th className="px-3 py-2.5 text-center">Índice Inferido</th>
                        <th className="px-3 py-2.5 text-right">Saldo Restante</th>
                        <th className="px-3 py-2.5 text-center">Estado / Validación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-slate-400 font-sans">
                            No se encontraron operaciones procesables en el archivo.
                          </td>
                        </tr>
                      ) : (
                        items.map((row, idx) => {
                          const esValido =
                            String(row.estado_preview || row.estado_conciliacion || '').includes('LISTO') ||
                            String(row.estado_preview || row.estado_conciliacion || '').includes('VALIDO');

                          // Cálculo de índice inferido si vino del backend o por delta nominal
                          const montoBaseOriginal = Number(row.monto_cuota_actual || 0);
                          const montoAbonado = Number(row.monto || 0);
                          let pctInferido = Number(row.porcentaje_actualizacion || 0);

                          if (pctInferido === 0 && montoBaseOriginal > 0 && montoAbonado > montoBaseOriginal) {
                            pctInferido = Number((((montoAbonado / montoBaseOriginal) - 1) * 100).toFixed(2));
                          }

                          return (
                            <tr
                              key={row.id_linea ?? `${row.clave_cliente}-${idx}`}
                              className={`transition ${
                                esValido ? 'hover:bg-slate-50/70' : 'bg-rose-50/15 hover:bg-rose-50/25'
                              }`}
                            >
                              {/* Clave / Frentista */}
                              <td className="px-3 py-2.5 font-sans">
                                <span className="font-mono font-bold text-slate-800">
                                  {row.clave_cliente || '-'}
                                </span>
                                <span className="block text-[11px] text-slate-500 font-medium truncate max-w-xs">
                                  {row.frentista || row.titular || 'Desconocido / Sin identificar'}
                                </span>
                              </td>

                              {/* Cuota Imputada Única */}
                              <td className="px-3 py-2.5 font-sans">
                                {row.nro_cuota ? (
                                  <div>
                                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-bold">
                                      Cuota #{row.nro_cuota}
                                    </span>
                                    <span className="block text-[10px] text-slate-400 font-medium">
                                      {row.concepto || 'RED_OBRA'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[11px]">-</span>
                                )}
                              </td>

                              {/* Fecha de Cobro */}
                              <td className="px-3 py-2.5 text-slate-500 font-sans text-[11px]">
                                {row.fecha_pago
                                  ? new Date(row.fecha_pago).toLocaleDateString('es-AR')
                                  : '-'}
                              </td>

                              {/* Importe Abonado (absorbe el total) */}
                              <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                                ${montoAbonado.toLocaleString('es-AR', {
                                  minimumFractionDigits: 2,
                                })}
                              </td>

                              {/* Índice Inferido resultante */}
                              <td className="px-3 py-2.5 text-center font-sans">
                                {pctInferido > 0 ? (
                                  <span className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-bold text-brand-700 bg-brand-50 border border-brand-200">
                                    +{pctInferido}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[11px]">0%</span>
                                )}
                              </td>

                              {/* Saldo Restante Resultante */}
                              <td className="px-3 py-2.5 text-right">
                                {row.saldo_remanente !== undefined && row.saldo_remanente !== null ? (
                                  <div>
                                    <span
                                      className={`font-bold ${
                                        Number(row.saldo_remanente) > 0 ? 'text-amber-700' : 'text-emerald-700'
                                      }`}
                                    >
                                      ${Number(row.saldo_remanente).toLocaleString('es-AR', {
                                        minimumFractionDigits: 2,
                                      })}
                                    </span>
                                    {row.nuevo_estado && (
                                      <span
                                        className={`block text-[10px] font-sans font-bold uppercase ${
                                          row.nuevo_estado === 'PAGO_PARCIAL'
                                            ? 'text-amber-600'
                                            : 'text-emerald-600'
                                        }`}
                                      >
                                        {row.nuevo_estado === 'PAGO_PARCIAL' ? 'Parcial' : 'Cancelada'}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px] font-sans">-</span>
                                )}
                              </td>

                              {/* Estado Semafórico */}
                              <td className="px-3 py-2.5 text-center font-sans">
                                {renderBadgeEstado(
                                  row.estado_preview || (row as any).estado_conciliacion,
                                  row.motivo_error || row.motivo_inconsistencia
                                )}
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

        {/* Acciones de Cierre */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            {(step === 'PREVIEW' || step === 'CONFIRMING') && (
              <button
                type="button"
                onClick={resetState}
                disabled={step === 'CONFIRMING'}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 px-3 py-2 rounded-xl transition disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Cargar otro archivo
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={step === 'CONFIRMING' || step === 'ANALYZING'}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              Cancelar
            </button>

            {(step === 'PREVIEW' || step === 'CONFIRMING') && summary && (
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={step === 'CONFIRMING' || summary.listos_para_imputar === 0}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                {step === 'CONFIRMING' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Imputando Lote...
                  </>
                ) : (
                  <>
                    <span>
                      Confirmar e Imputar ({summary.listos_para_imputar} pagos • $
                      {summary.monto_total_conciliar.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                      })}
                      )
                    </span>
                    <ArrowRight className="w-4 h-4" />
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