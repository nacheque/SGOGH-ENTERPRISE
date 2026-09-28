import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { RolUsuario } from '../../types/auth.types';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface Props {
  rolesPermitidos?: RolUsuario[];
}

export const ProtectedRoute: React.FC<Props> = ({ rolesPermitidos }) => {
  const { isAuthenticated, isLoading, usuario, tieneRol } = useAuth();
  const location = useLocation();

  // 1. Pantalla de espera institucional
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          Validando credenciales CECSA...
        </p>
      </div>
    );
  }

  // 2. Si no está autenticado, redirigir a Login con preservación de URL previa
  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Control de Acceso Basado en Roles (RBAC)
  if (rolesPermitidos && rolesPermitidos.length > 0 && !tieneRol(rolesPermitidos)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-6 text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Acceso No Autorizado (403)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tu usuario cuenta con el rol <strong className="font-mono text-slate-700">{usuario.rol}</strong>, 
              el cual no tiene los privilegios necesarios para acceder a este módulo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Volver a la vista anterior
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};