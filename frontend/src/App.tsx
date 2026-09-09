import { useState, useEffect } from 'react';
import { Landmark, Activity } from 'lucide-react';
import { FinanzasView } from './views/FinanzasView';
import { Toast } from './components/common/Toast';
import api from './api/axios';

export default function App() {
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
      {/* SIDEBAR CORPORATIVO SGOGH / CECSA */}
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

          {/* Módulo Principal Unificado */}
          <nav className="space-y-1">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-brand-600 text-white shadow-md cursor-default"
            >
              <Landmark className="w-4 h-4" /> SG Adm. y Finanzas
            </button>
          </nav>
        </div>

        {/* Indicador de Estado del Backend */}
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

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm shrink-0">
          <h2 className="text-base font-bold text-slate-800">
            Módulo Integral • SG Administración, Finanzas y Obras
          </h2>
          <span className="text-xs text-slate-400 font-medium font-mono">Sprint 3</span>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          <FinanzasView showToast={showToast} />
        </div>
      </main>

      {/* NOTIFICACIÓN FLOTANTE */}
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