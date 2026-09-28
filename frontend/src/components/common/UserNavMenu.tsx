import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, LogOut, Shield } from 'lucide-react';

export const UserNavMenu: React.FC = () => {
  const { usuario, logout } = useAuth();

  if (!usuario) return null;

  const esAdmin = usuario.rol === 'ADMIN';

  return (
    <div className="flex items-center gap-3">
      {/* Datos del Usuario */}
      <div className="flex items-center gap-2.5 bg-slate-800/60 border border-slate-700/60 py-1.5 px-3 rounded-xl">
        <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300">
          <User className="w-4 h-4" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-slate-200 leading-tight">
            {usuario.nombre}
          </span>
          <span className="text-[10px] text-slate-400 font-mono leading-tight">
            {usuario.email}
          </span>
        </div>

        {/* Badge de Rol */}
        <span
          className={`ml-1.5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
            esAdmin
              ? 'bg-purple-950/80 text-purple-300 border-purple-800/60'
              : 'bg-blue-950/80 text-blue-300 border-blue-800/60'
          }`}
        >
          <Shield className="w-2.5 h-2.5" />
          {usuario.rol}
        </span>
      </div>

      {/* Botón Salir */}
      <button
        type="button"
        onClick={logout}
        title="Cerrar Sesión"
        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};