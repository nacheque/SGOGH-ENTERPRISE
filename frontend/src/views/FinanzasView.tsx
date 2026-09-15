import React, { useState, useEffect } from 'react';
import type { Obra, Inmueble, CuentaCorrienteRow } from '../types';
import { getObras } from '../api/obras.api';
import { getInmuebles } from '../api/inmuebles.api';
import { ResumenObraHeader } from '../components/finanzas/ResumenObraHeader';
import { CuentaCorrienteTable } from '../components/finanzas/CuentaCorrienteTable';
import { PlanCuotasModal } from '../components/finanzas/PlanCuotasModal';
import { ObrasView } from './ObrasView';
import { DashboardKPIs } from '../components/finanzas/DashboardKPIs';
import { FileSpreadsheet } from 'lucide-react';
import { ImportarRoelaModal } from '../components/finanzas/ImportarRoelaModal';

interface Props {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

type TabType = 'dashboard' | 'cuenta_corriente' | 'gestion_obras';

export const FinanzasView: React.FC<Props> = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [obras, setObras] = useState<Obra[]>([]);
  const [selectedObraId, setSelectedObraId] = useState<number | null>(null);
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCuentaModal, setSelectedCuentaModal] = useState<CuentaCorrienteRow | null>(null);
  const [modalRoelaOpen, setModalRoelaOpen] = useState(false);

  // Declarar fetchData para poder reutilizarla tras pagos y conciliaciones
  const fetchData = async () => {
    try {
      setLoading(true);
      const [obrasData, inmueblesData] = await Promise.all([
        getObras(),
        getInmuebles(),
      ]);
      setObras(obrasData);
      setInmuebles(inmueblesData);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrar y calcular la cuenta corriente en base a los inmuebles y contrato real
  const cuentaCorrienteData: CuentaCorrienteRow[] = inmuebles
    .filter((inm) => selectedObraId === null || inm.id_obra === selectedObraId)
    .map((inm) => {
      const obraAsociada = obras.find((o) => o.id_obra === inm.id_obra);
      const precioMetro = Number(obraAsociada?.precio_x_metro || 0);
      const metrosFrente = Number(inm.metros_frente || 0);
      const costoObra = metrosFrente * precioMetro;
      const servDom = inm.conexion_gabinete ? Number(obraAsociada?.costo_gabinete || 300000) : 0;
      const costoTotal = costoObra + servDom;

      // Lectura del Contrato Real
      const tieneContrato = Boolean(inm.id_contrato);
      const planPagos = inm.plan_cuotas_obra ?? null;
      const cuotaBase = inm.cuota_base_obra ? Number(inm.cuota_base_obra) : 0;
      const anticipo = inm.monto_anticipo ? Number(inm.monto_anticipo) : 0;

      return {
        id_inmueble: inm.id_inmueble,
        id_obra: inm.id_obra, // <-- SOLUCIÓN AL ERROR DE TYPESCRIPT
        id_contrato: inm.id_contrato || null,
        tiene_contrato: tieneContrato,
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
        dni: inm.titular_dni || null,
        cuil: null,
        telefono: null,
        email: null,
        precio_x_metro: precioMetro,
        costo_obra: costoObra,
        serv_dom: servDom,
        costo_total: costoTotal,
        plan_pagos: planPagos,
        cuota_base: cuotaBase,
        monto_anticipo: anticipo,
        tipo_indexacion: inm.tipo_indexacion || null,
        estado: tieneContrato ? 'ACTIVO' : 'SIN_PLAN',
        cuota_vigente_actual: cuotaBase,
      };
    });

  return (
    <div className="space-y-6">
      {/* Barra de Pestañas Superior */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'dashboard'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Dashboard de Cobranzas
        </button>

        <button
          onClick={() => setActiveTab('cuenta_corriente')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'cuenta_corriente'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Cuenta Corriente
        </button>

        <button
          onClick={() => setActiveTab('gestion_obras')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'gestion_obras'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Gestión de Obras
        </button>
      </div>

      {/* PESTAÑA 1: GESTIÓN DE OBRAS */}
      {activeTab === 'gestion_obras' && (
        <div className="animate-in fade-in duration-150">
          <ObrasView showToast={showToast} />
        </div>
      )}

      {/* PESTAÑA 2: CUENTA CORRIENTE */}
      {activeTab === 'cuenta_corriente' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <ResumenObraHeader
            obras={obras}
            selectedObraId={selectedObraId}
            onSelectObra={setSelectedObraId}
            totalVecinos={cuentaCorrienteData.length}
          />

          {/* BARRA DE ACCIONES DE CUENTA CORRIENTE */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setModalRoelaOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Importar Rendición SIRO
            </button>
          </div>

          <CuentaCorrienteTable
            data={cuentaCorrienteData}
            loading={loading}
            onSelectCuenta={setSelectedCuentaModal}
          />
          <PlanCuotasModal
            cuenta={selectedCuentaModal}
            isOpen={Boolean(selectedCuentaModal)}
            onClose={() => setSelectedCuentaModal(null)}
            showToast={showToast}
            onPlanCreado={fetchData}
          />

          {/* MODAL IMPORTAR ROELA */}
          <ImportarRoelaModal
            isOpen={modalRoelaOpen}
            onClose={() => setModalRoelaOpen(false)}
            showToast={showToast}
            onSuccess={fetchData} // <-- VINCULADO PARA REFRESCAR LA TABLA AL CONCILIAR
          />
        </div>
      )}

      {/* PESTAÑA 3: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-200">
          <DashboardKPIs />
        </div>
      )}
    </div>
  );
};