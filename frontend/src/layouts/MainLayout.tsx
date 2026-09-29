import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Landmark, Activity, Layers } from 'lucide-react';
import { Toast } from '../components/common/Toast';
import { UserNavMenu } from '../components/common/UserNavMenu';
import api from '../api/axios';

export const MainLayout: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const checkStatus = () => {
      api.get('/health')
        .then(() => setBackendStatus('online'))
        .catch(() => {
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
      {/* SIDEBAR CORPORATIVO SGOGH / CECSA COMPACTO */}
      <aside className="w-52 bg-cecsa-sidebar text-slate-300 flex flex-col justify-between p-3.5 border-r border-slate-800 shrink-0">
        <div>
          {/* Identidad de Marca CECSA */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-900/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide text-sm leading-none">CECSA</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-1">SGOGH</p>
            </div>
          </div>

          {/* Menú de Módulos */}
          <nav className="space-y-1">
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider bg-brand-600 text-white shadow-sm cursor-default"
            >
              <Landmark className="w-3.5 h-3.5 shrink-0" />
              <span>Administración y Finanzas</span>
            </button>
          </nav>
        </div>

        {/* Indicador de Conexión del Backend */}
        <div className="p-2.5 bg-cecsa-dark/80 rounded-xl flex items-center gap-2 border border-slate-800 text-[11px]">
          <Activity
            className={`w-3.5 h-3.5 shrink-0 ${
              backendStatus === 'online'
                ? 'text-emerald-400 animate-pulse'
                : backendStatus === 'offline'
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}
          />
          <span className="text-slate-300 font-medium truncate">
            {backendStatus === 'online'
              ? 'AWS - Conectado'
              : backendStatus === 'offline'
              ? 'AWS - Sin Conexión'
              : 'AWS - Verificando...'}
          </span>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              SGOGH
            </h2>
          </div>

          {/* Menú de Usuario */}
          <UserNavMenu />
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          <Outlet context={{ showToast }} />
        </div>
      </main>

      {/* Notificación Flotante */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};