import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import logoCecsa from '../assets/recibos/logo-cecsa.jpg';

export const LoginView: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Destino tras login exitoso (por defecto al dashboard financiero)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Si ya está autenticado, no permitir ver login
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor ingrese su correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setErrorMessage('Credenciales inválidas. Verifique su email o clave.');
        } else if (err.response?.status === 403) {
          setErrorMessage('Su usuario se encuentra inactivo o suspendido.');
        } else {
          setErrorMessage(err.response?.data?.message || 'Error de conexión con el servidor.');
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Fondo estético institucional */}
      <div className="absolute inset-0 bg-radial from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
        {/* Cabecera CECSA con Logo Oficial y Título SGOGH Estilizado */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl shadow-xl shadow-brand-500/10 border border-slate-200/80 mb-5 inline-flex items-center justify-center">
            <img
              src={logoCecsa}
              alt="Logo CECSA"
              className="h-11 w-auto object-contain rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 font-mono">
              SGOGH
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Gestión de Obras y Finanzas
            </div>
          </div>
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@cecsa.com.ar"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type={mostrarPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingresando al sistema...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Gruppi e Hijos S.A. • Sistema de Control y Auditoría Interna
          </p>
        </div>
      </div>
    </div>
  );
};