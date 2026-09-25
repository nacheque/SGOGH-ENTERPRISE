import React, { useState, useEffect } from 'react';
import type {
  Obra,
  Inmueble,
  CuentaCorrienteRow,
  CurvaRecaudacionItemDTO,
  AgingMoraResponseDTO,
} from '../types';
import { getObras } from '../api/obras.api';
import { getInmuebles } from '../api/inmuebles.api';
import { dashboardService } from '../api/dashboard.api';
import { ResumenObraHeader } from '../components/finanzas/ResumenObraHeader';
import { CuentaCorrienteTable } from '../components/finanzas/CuentaCorrienteTable';
import { CarteraChequesTable } from '../components/finanzas/CarteraChequesTable';
import { PlanCuotasModal } from '../components/finanzas/PlanCuotasModal';
import { ObrasView } from './ObrasView';
import { DashboardKPIs } from '../components/finanzas/DashboardKPIs';
import { CurvaRecaudacionChart } from '../components/finanzas/GraficosDashboard/CurvaRecaudacionChart';
import { AgingMoraReport } from '../components/finanzas/GraficosDashboard/AgingMoraReport';
import { FileSpreadsheet, Search, X } from 'lucide-react';
import { ImportarRoelaModal } from '../components/finanzas/ImportarRoelaModal';
import { ImportarPlanesModal } from '../components/finanzas/ImportarPlanesModal';

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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modalImportarPlanesOpen, setModalImportarPlanesOpen] = useState(false);
  const [subTabFinanzas, setSubTabFinanzas] = useState<'PADRON' | 'CHEQUES'>('PADRON');

  // Estados analíticos para los gráficos del Dashboard
  const [curvaData, setCurvaData] = useState<CurvaRecaudacionItemDTO[]>([]);
  const [agingData, setAgingData] = useState<AgingMoraResponseDTO | null>(null);
  const [loadingCharts, setLoadingCharts] = useState<boolean>(false);

  // Declarar fetchData para recargar el padrón de cuentas corrientes y planes
  const fetchData = async () => {
    try {
      setLoading(true);
      const [obrasData, inmueblesData] = await Promise.all([
        getObras(),
        getInmuebles(),
      ]);
      setObras(obrasData);
      setInmuebles(inmueblesData);

      if (obrasData && obrasData.length > 0) {
        setSelectedObraId((prev) => (prev !== null ? prev : obrasData[0].id_obra));
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handlePadronUpdate = () => {
      fetchData();
    };

    window.addEventListener('padron:actualizado', handlePadronUpdate);
    return () => {
      window.removeEventListener('padron:actualizado', handlePadronUpdate);
    };
  }, []);

  // Fetch reactivo de gráficos analíticos cuando se ingresa a Dashboard o cambia de Obra
  useEffect(() => {
    if (activeTab === 'dashboard') {
      let isMounted = true;

      const fetchDashboardCharts = async () => {
        try {
          setLoadingCharts(true);
          const [curva, aging] = await Promise.all([
            dashboardService.getCurvaRecaudacion(selectedObraId),
            dashboardService.getAgingMora(selectedObraId),
          ]);

          if (isMounted) {
            setCurvaData(curva);
            setAgingData(aging);
          }
        } catch {
          if (isMounted) {
            setCurvaData([]);
            setAgingData(null);
          }
        } finally {
          if (isMounted) setLoadingCharts(false);
        }
      };

      fetchDashboardCharts();
      return () => {
        isMounted = false;
      };
    }
  }, [activeTab, selectedObraId]);

  // Filtrar y calcular la cuenta corriente en base a los inmuebles y contrato real
  const cuentaCorrienteData: CuentaCorrienteRow[] = inmuebles
    .filter((inm) => selectedObraId === null || inm.id_obra === selectedObraId)
    .map((inm) => {
      const obraAsociada = obras.find((o) => o.id_obra === inm.id_obra);
      const precioMetro = Number(obraAsociada?.precio_x_metro || 0);
      const metrosFrente = Number(inm.metros_frente || 0);
      const costoObra = metrosFrente * precioMetro;
      
      // Corrección [BUG-FRONT-01]: Solo calcular servDom si tiene conexión de gabinete activa
      const tieneGabinete = Boolean(inm.conexion_gabinete);
      const servDom = tieneGabinete ? Number(obraAsociada?.costo_gabinete || 300000) : 0;
      const costoTotal = costoObra + servDom;

      // Lectura del Contrato Real
      const tieneContrato = Boolean(inm.id_contrato);
      const planPagos = inm.plan_cuotas_obra ?? null;
      const cuotaBase = inm.cuota_base_obra ? Number(inm.cuota_base_obra) : 0;
      const anticipo = inm.monto_anticipo ? Number(inm.monto_anticipo) : 0;

      return {
        id_inmueble: inm.id_inmueble,
        id_obra: inm.id_obra,
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
        conexion_gabinete: tieneGabinete,
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

  // Filtrado reactivo en memoria exclusivamente para renderizar en la tabla
  const filteredCuentaCorrienteData = cuentaCorrienteData.filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();

    const titular = String(row.titular_nombre || '').toLowerCase();
    const frentista = String(row.frentista_nombre || '').toLowerCase();
    const idCliente = String(row.clave || '').toLowerCase();
    const calle = String(row.calle || '').toLowerCase();

    return (
      titular.includes(term) ||
      frentista.includes(term) ||
      idCliente.includes(term) ||
      calle.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Barra de Pestañas Superior */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Dashboard de Cobranzas
        </button>

        <button
          onClick={() => setActiveTab('cuenta_corriente')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
            activeTab === 'cuenta_corriente'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Cuenta Corriente
        </button>

        <button
          onClick={() => setActiveTab('gestion_obras')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
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

      {/* PESTAÑA 2: CUENTA CORRIENTE Y TESORERÍA */}
      {activeTab === 'cuenta_corriente' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <ResumenObraHeader
            obras={obras}
            selectedObraId={selectedObraId}
            onSelectObra={setSelectedObraId}
            totalVecinos={cuentaCorrienteData.length}
          />

          {/* SELECTOR DE SUB-PESTAÑAS */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setSubTabFinanzas('PADRON')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                subTabFinanzas === 'PADRON'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cuentas Corrientes (Padrón)
            </button>

            <button
              type="button"
              onClick={() => setSubTabFinanzas('CHEQUES')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                subTabFinanzas === 'CHEQUES'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cartera de Valores y Cheques
            </button>
          </div>

          {/* CONTENIDO SEGÚN SUB-PESTAÑA SELECCIONADA */}
          {subTabFinanzas === 'PADRON' ? (
            <div className="space-y-4">
              {/* BARRA DE ACCIONES Y BÚSQUEDA RÁPIDA (PADRÓN) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por Titular de Lote o ID-Cliente..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 shadow-xs transition"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md transition cursor-pointer"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedObraId) {
                        showToast('Debe seleccionar una obra para importar planes', 'error');
                        return;
                      }
                      setModalImportarPlanesOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar Planes Masivos
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalRoelaOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                    Importar Rendición SIRO
                  </button>
                </div>
              </div>

              {/* Tabla de Cuentas Corrientes */}
              <CuentaCorrienteTable
                data={filteredCuentaCorrienteData}
                loading={loading}
                onSelectCuenta={setSelectedCuentaModal}
              />
            </div>
          ) : (
            /* VISTA DE CUSTODIA: CARTERA DE CHEQUES Y ECHEQS */
            <CarteraChequesTable selectedObraId={selectedObraId} />
          )}

          {/* MODALES DISPONIBLES EN AMBAS SUB-PESTAÑAS */}
          <PlanCuotasModal
            cuenta={selectedCuentaModal}
            isOpen={Boolean(selectedCuentaModal)}
            onClose={() => setSelectedCuentaModal(null)}
            showToast={showToast}
            onPlanCreado={fetchData}
          />

          <ImportarRoelaModal
            isOpen={modalRoelaOpen}
            onClose={() => setModalRoelaOpen(false)}
            showToast={showToast}
            onSuccess={fetchData}
          />

          {selectedObraId && (
            <ImportarPlanesModal
              isOpen={modalImportarPlanesOpen}
              obraId={selectedObraId}
              nombreObra={obras.find((o) => o.id_obra === selectedObraId)?.nombre_obra}
              onClose={() => setModalImportarPlanesOpen(false)}
              onSuccess={fetchData}
              showToast={showToast}
            />
          )}
        </div>
      )}

      {/* PESTAÑA 3: DASHBOARD GERENCIAL */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header con Selector de Obra para el Dashboard */}
          <ResumenObraHeader
            obras={obras}
            selectedObraId={selectedObraId}
            onSelectObra={setSelectedObraId}
            totalVecinos={cuentaCorrienteData.length}
          />

          {/* 6 Tarjetas de KPIs Analíticos */}
          <DashboardKPIs selectedObraId={selectedObraId} />

          {/* Gráficos Analíticos: Curva de Recaudación y Reporte de Mora */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <CurvaRecaudacionChart data={curvaData} loading={loadingCharts} />
            <AgingMoraReport data={agingData} loading={loadingCharts} />
          </div>
        </div>
      )}
    </div>
  );
};