import { useState, useEffect } from 'react';
import { HardHat, Users, Building2, Activity } from 'lucide-react';
import { ObrasView } from './views/ObrasView';
import { PersonasView } from './views/PersonasView';
import { InmueblesView } from './views/InmueblesView';
import { Toast } from './components/common/Toast';
import api from './api/axios';

// Definición de las pestañas principales del Dashboard
type Tab = 'obras' | 'personas' | 'inmuebles';

export default function App() {
  // -------------------------------------------------------------
  // ESTADOS GLOBALES DE NAVEGACIÓN Y SISTEMA
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<Tab>('obras');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Función puente para emitir notificaciones desde cualquier subvista
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // -------------------------------------------------------------
  // HEALTH CHECK AUTOMÁTICO AL MONTAR LA APLICACIÓN
  // -------------------------------------------------------------
  // Comprueba la conectividad activa con el backend y PostgreSQL en AWS Lightsail
  useEffect(() => {
    api.get('/health')
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
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

          {/* Menú de Navegación por Módulos */}
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
              onClick={() => setActiveTab('personas')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'personas'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'hover:bg-cecsa-hover text-slate-400'
              }`}
            >
              <Users className="w-4 h-4" /> Padrón de Personas
            </button>

            <button
              onClick={() => setActiveTab('inmuebles')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'inmuebles'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'hover:bg-cecsa-hover text-slate-400'
              }`}
            >
              <Building2 className="w-4 h-4" /> Catastro Inmuebles
            </button>
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
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
          <h2 className="text-base font-bold text-slate-800">
            {activeTab === 'obras' && 'Módulo 1 • Gestión de Obras de Infraestructura'}
            {activeTab === 'personas' && 'Módulo 2 • Padrón General de Personas y Titulares'}
            {activeTab === 'inmuebles' && 'Módulo 3 • Catastro, Lotes y Vinculaciones'}
          </h2>
          <span className="text-xs text-slate-400 font-medium font-mono">Sprint 1 | Build 1.0</span>
        </header>

        {/* Contenedor dinámico según pestaña activa */}
        <div className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'obras' && <ObrasView showToast={showToast} />}
          {activeTab === 'personas' && <PersonasView showToast={showToast} />}
          {activeTab === 'inmuebles' && <InmueblesView showToast={showToast} />}
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