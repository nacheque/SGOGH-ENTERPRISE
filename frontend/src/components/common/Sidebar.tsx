import React from 'react';
import { HardHat, DollarSign } from 'lucide-react';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<Props> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'obras', label: 'Gestión de Obras', icon: HardHat },
    { id: 'finanzas', label: 'SG Adm. y Finanzas', icon: DollarSign },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      <div className="p-5 border-b border-slate-800">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Sistema</span>
        <span className="text-lg font-black text-white">SGOGH ENTERPRISE</span>
      </div>

      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Módulos anteriores archivados / comentados */}
        {/* 
        <button onClick={() => onNavigate('personas')} ...>Padrón de Personas</button>
        <button onClick={() => onNavigate('inmuebles')} ...>Catastro de Inmuebles</button>
        */}
      </nav>
    </aside>
  );
};