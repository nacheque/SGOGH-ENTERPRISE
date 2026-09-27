import React, { useState, useEffect } from 'react';
import { getReciboDatos } from '../../../api/pagos.api';
import { numeroALetras } from '../../../utils/numeroALetras';
import { X, Printer, Loader2 } from 'lucide-react';
import type { ReciboDatosDTO } from '../../../types';
import logoCecsa from '../../../assets/recibos/logo-cecsa.jpg';
import firmaGruppi from '../../../assets/recibos/firma-gruppi.jpg';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  idPago: number | null;
}

export const ReciboOficialModal: React.FC<Props> = ({ isOpen, onClose, idPago }) => {
  const [data, setData] = useState<ReciboDatosDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !idPago) {
      setData(null);
      return;
    }

    let isMounted = true;
    const fetchRecibo = async () => {
      try {
        setLoading(true);
        const dataRecibo = await getReciboDatos(idPago);
        if (isMounted) {
          setData(dataRecibo);
        }
      } catch (err) {
        console.error('Error al obtener datos del recibo:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecibo();
    return () => {
      isMounted = false;
    };
  }, [isOpen, idPago]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white print:static print:inset-auto">
      {/* Contenedor principal del modal (se adapta a hoja completa al imprimir) */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Barra de control en pantalla (Oculta en PDF/Impresión) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-100 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider">Comprobante Oficial de Pago</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !data}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área del Recibo */}
        <div className="p-6 md:p-8 print:p-0">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
              <span className="text-xs font-medium">Generando recibo institucional...</span>
            </div>
          ) : !data ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No se encontraron datos del comprobante solicitado.
            </div>
          ) : (
            /* Plantilla Oficial Idéntica a Excel Institucional */
            <div className="recibo-imprimible bg-white border-2 border-black p-6 text-black font-sans max-w-[760px] mx-auto text-[13px] leading-relaxed select-text print:border-2 print:border-black print:m-0 print:w-full">
              
              {/* CABECERA */}
              <div className="grid grid-cols-12 border-b-2 border-black pb-4">
                {/* Bloque Izquierdo: Institucional */}
                <div className="col-span-8 pr-4 border-r-2 border-black flex flex-col justify-between">
                  <div>
                    <img 
                      src={logoCecsa} 
                      alt="CECSA" 
                      className="h-12 object-contain mb-2"
                    />
                    <div className="font-bold text-[14px] tracking-wide">GRUPPI E HIJOS S.A.</div>
                    <div className="text-[12px] text-slate-800">Eliseo Soaje N° 1.206 - B° Altos de Vélez Sarsfield</div>
                    <div className="text-[11px] text-slate-700">Tel.: 0351 - 7032911 - cobranzas.gruppiehijos@gmail.com</div>
                  </div>
                </div>

                {/* Bloque Derecho: Fecha, Secuencia Correlativa y CUIT */}
                <div className="col-span-4 pl-4 flex flex-col justify-center space-y-1 font-sans text-xs">
                  <div>
                    <span className="font-bold">FECHA: </span>
                    <span>{data.fecha_pago}</span>
                  </div>
                  <div>
                    <span className="font-bold">Recibo N°: </span>
                    <span className="font-mono font-bold text-sm">{data.nro_recibo}</span>
                  </div>
                  <div className="pt-2">
                    <span className="font-bold">CUIT: </span>
                    <span>30-71407259-1</span>
                  </div>
                </div>
              </div>

              {/* CUERPO DEL RECIBO */}
              <div className="py-6 space-y-4">
                {/* Titular */}
                <div className="flex items-end gap-2">
                  <span className="font-normal shrink-0">Recibí de:</span>
                  <div className="border-b border-black flex-1 font-bold px-2">
                    {data.titular_nombre}
                  </div>
                </div>

                {/* DNI */}
                <div className="flex items-end gap-2">
                  <span className="font-normal shrink-0">DNI N°:</span>
                  <div className="border-b border-black w-64 font-medium px-2">
                    {data.titular_dni || 'S/D'}
                  </div>
                </div>

                {/* Letras */}
                <div className="flex items-end gap-2 pt-1">
                  <span className="font-normal shrink-0">La suma de pesos:</span>
                  <div className="border-b border-black flex-1 font-bold text-[12px] tracking-wide px-2 uppercase">
                    -- {numeroALetras(data.monto_pagado)} --
                  </div>
                </div>

                {/* Cuota */}
                <div className="flex items-end gap-2 pt-1">
                  <span className="font-normal shrink-0">por la cancelación de la/s cuota/s:</span>
                  <div className="border-b border-black flex-1 font-bold px-2">
                    Cuota N° {data.nro_cuota} ({data.concepto_cuota})
                  </div>
                </div>

                {/* Localidad y Lote */}
                <div className="text-slate-900 leading-normal pl-2">
                  correspondiente al pago de obra de gas a la localidad de{' '}
                  <span className="font-bold">{data.obra_localidad || data.obra_nombre}</span>{' '}
                  ({data.nomenclatura_lote}).
                </div>

                {/* Medio de Pago Aislado */}
                <div className="flex items-end gap-2 pt-2">
                  <span className="font-normal shrink-0">Forma de Pago:</span>
                  <div className="border-b border-black flex-1 font-medium px-2 uppercase">
                    {data.detalle_medio_pago || data.medio_pago}
                  </div>
                </div>
              </div>

              {/* PIE DEL RECIBO */}
              <div className="pt-6 grid grid-cols-12 items-end">
                <div className="col-span-6">
                  <div className="inline-flex items-center border-2 border-black px-4 py-2 bg-slate-50 font-bold text-sm">
                    <span className="mr-3">TOTAL $</span>
                    <span className="font-mono text-base font-extrabold">
                      {Number(data.monto_pagado).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="col-span-6 flex flex-col items-center justify-end">
                  <div className="w-48 text-center">
                    <img 
                      src={firmaGruppi} 
                      alt="Firma Gruppi e Hijos S.A." 
                      className="h-16 object-contain mx-auto -mb-2"
                    />
                    <div className="border-t border-black pt-1 font-bold text-[11px] uppercase tracking-wider">
                      FIRMA P/ GRUPPI E HIJOS S.A.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Reglas de impresión limpias para generación de PDF nativo */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            visibility: hidden;
            background: white !important;
          }
          .recibo-imprimible, .recibo-imprimible * {
            visibility: visible;
          }
          .recibo-imprimible {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  );
};