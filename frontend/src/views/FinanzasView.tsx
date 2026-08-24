import React, { useState, useEffect } from 'react';
import type { Obra, Inmueble, CuentaCorrienteRow } from '../types';
import { getObras } from '../api/obras.api';
import { getInmuebles } from '../api/inmuebles.api';
import { ResumenObraHeader } from '../components/finanzas/ResumenObraHeader';
import { CuentaCorrienteTable } from '../components/finanzas/CuentaCorrienteTable';
import { LayoutDashboard, ReceiptText } from 'lucide-react';

interface Props {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

type FinanzasSubTab = 'dashboard' | 'cuenta-corriente';

export const FinanzasView: React.FC<Props> = ({ showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<FinanzasSubTab>('cuenta-corriente');
  const [obras, setObras] = useState<Obra[]>([]);
  const [selectedObraId, setSelectedObraId] = useState<number | null>(null);
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar datos base del sistema
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [obrasData, inmueblesData] = await Promise.all([
          getObras(),
          getInmuebles(),
        ]);
        setObras(obrasData);
        setInmuebles(inmueblesData);
        
        /*
        if (obrasData.length > 0) {
          setSelectedObraId(obrasData[0].id_obra);
        }*/

      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrar y calcular la cuenta corriente en base a los inmuebles y obra seleccionada
  const selectedObra = obras.find((o) => o.id_obra === selectedObraId);
  
  const cuentaCorrienteData: CuentaCorrienteRow[] = inmuebles
    .filter((inm) => selectedObraId === null || inm.id_obra === selectedObraId)
    .map((inm) => {
      const obraAsociada = obras.find((o) => o.id_obra === inm.id_obra);
      const precioMetro = Number(obraAsociada?.precio_x_metro || 0);
      const metrosFrente = Number(inm.metros_frente || 0);
      const costoObra = metrosFrente * precioMetro;
      const servDom = inm.conexion_gabinete ? Number(obraAsociada?.costo_gabinete || 300000) : 0;
      const costoTotal = costoObra + servDom;
      const planPagos = 24;
      const cuotaBase = planPagos > 0 ? costoTotal / planPagos : 0;

      return {
        id_inmueble: inm.id_inmueble,
        clave: inm.clave_cliente,
        frentista_nombre: inm.frentista_nombre || null,
        titular_nombre: inm.titular_nombre || null,
        metros_frente: metrosFrente,
        calle: inm.calle,
        numero: inm.numero || null,
        mza: inm.manzana || null,
        lote_catast_muni: inm.lote_catast_muni || null,
        lote_catast_provincia: inm.lote_catast_provincia || null,
        observacion: inm.observacion || null,
        conexion_gabinete: Boolean(inm.conexion_gabinete),
        gabinete_colocado: Boolean(inm.gabinete_colocado),
        dni: null,
        cuil: null,
        telefono: null,
        email: null,
        precio_x_metro: precioMetro,
        costo_obra: costoObra,
        serv_dom: servDom,
        costo_total: costoTotal,
        plan_pagos: planPagos,
        cuota_base: cuotaBase,
        estado: 'ACTIVO',
        cuota_vigente_actual: cuotaBase,
      };
    });

  return (
    <div className="space-y-6">
      {/* Selector de Sub-Pestañas */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-2 flex flex-wrap gap-2 shadow-sm">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'dashboard'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard de Cobranzas
        </button>

        <button
          onClick={() => setActiveSubTab('cuenta-corriente')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'cuenta-corriente'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          Cuenta Corriente
        </button>
      </div>

      {activeSubTab === 'dashboard' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center space-y-3">
          <div className="inline-flex p-3 bg-blue-50 text-brand-600 rounded-full">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Dashboard de Cobranzas e Índices de Actualización
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Se alimentará de los totales calculados en la Cuenta Corriente.
          </p>
        </div>
      )}

      {activeSubTab === 'cuenta-corriente' && (
        <div className="space-y-6">
          <ResumenObraHeader
            obras={obras}
            selectedObraId={selectedObraId}
            onSelectObra={setSelectedObraId}
            totalVecinos={cuentaCorrienteData.length}
          />
          <CuentaCorrienteTable
            data={cuentaCorrienteData}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};