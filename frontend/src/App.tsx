import { useState, useEffect } from 'react';
import { HardHat, Landmark, Activity } from 'lucide-react';
import { ObrasView } from './views/ObrasView';
import { FinanzasView } from './views/FinanzasView';
import { Toast } from './components/common/Toast';
import api from './api/axios';

// Consolidación en los 2 módulos principales
type Tab = 'obras' | 'finanzas';

export default function App() {
  // -------------------------------------------------------------
  // ESTADOS GLOBALES DE NAVEGACIÓN Y SISTEMA
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<Tab>('obras');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Emisor centralizado de notificaciones Toast para las subvistas
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  // -------------------------------------------------------------
  // HEALTH CHECK AUTOMÁTICO AL MONTAR Y PERIÓDICO
  // -------------------------------------------------------------
  // Comprueba la conectividad activa con el backend y PostgreSQL en AWS Lightsail
  useEffect(() => {
    const checkStatus = () => {
      api.get('/health')
        .then(() => setBackendStatus('online'))
        .catch(() => {
          // Fallback a /obras por si la ruta /health no está expuesta directamente
          api.get('/obras')
            .then(() => setBackendStatus('online'))
            .catch(() => setBackendStatus('offline'));
        });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* ========================================================= */}
      {/* BARRA LATERAL (SIDEBAR CORPORATIVO SGOGH / CECSA)         */}
      {/* ========================================================= */}
      <aside className="w-64 bg-cecsa-sidebar text-slate-300 flex flex-col justify-between p-4 border-r border-slate-800 shrink-0">
        <div>
          {/* Cabecera / Identidad Corporativa */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/80">
            <div className="p-2 bg-brand-600 rounded-lg text-white font-black tracking-widest text-sm shadow-md">
              CAT
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide text-sm">CECSA</h1>
              <p className="text-[10px] text-slate-400 font-mono">SGOGH ENTERPRISE</p>
            </div>
          </div>

          {/* Menú de Navegación Consolidado (2 Módulos) */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('obras')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'obras'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'hover:bg-cecsa-hover text-slate-400'
              }`}
            >
              <HardHat className="w-4 h-4" /> Gestión de Obras
            </button>

            <button
              onClick={() => setActiveTab('finanzas')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'finanzas'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'hover:bg-cecsa-hover text-slate-400'
              }`}
            >
              <Landmark className="w-4 h-4" /> SG Adm. y Finanzas
            </button>

            {/* Accesos archivados/ocultos: el padrón ahora se gestiona dentro de cada obra */}
            {/* 
            <button onClick={() => setActiveTab('personas')} ...>Padrón de Personas</button>
            <button onClick={() => setActiveTab('inmuebles')} ...>Catastro Inmuebles</button>
            */}
          </nav>
        </div>

        {/* Indicador de Estado del Servidor Backend */}
        <div className="p-3 bg-cecsa-dark rounded-lg flex items-center gap-2 border border-slate-800 text-xs">
          <Activity
            className={`w-4 h-4 ${
              backendStatus === 'online'
                ? 'text-emerald-400 animate-pulse'
                : backendStatus === 'offline'
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}
          />
          <span className="text-[11px] text-slate-300 font-medium">
            API:{' '}
            {backendStatus === 'online'
              ? 'Conectada (AWS)'
              : backendStatus === 'offline'
              ? 'Sin Conexión'
              : 'Verificando...'}
          </span>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* ÁREA DE CONTENIDO PRINCIPAL                               */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header Superior */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm shrink-0">
          <h2 className="text-base font-bold text-slate-800">
            {activeTab === 'obras' && 'Módulo 1 • Gestión de Obras de Infraestructura'}
            {activeTab === 'finanzas' && 'Módulo 7 • SG Administración y Finanzas'}
          </h2>
          <span className="text-xs text-slate-400 font-medium font-mono">Sprint 3 | Build 2.0</span>
        </header>

        {/* Contenedor dinámico de la vista activa */}
        <div className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'obras' && <ObrasView showToast={showToast} />}
          {activeTab === 'finanzas' && <FinanzasView showToast={showToast} />}
        </div>
      </main>

      {/* ========================================================= */}
      {/* NOTIFICACIÓN FLOTANTE (TOAST)                             */}
      {/* ========================================================= */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}