import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
        isSuccess
          ? 'bg-white/95 text-slate-800 border-emerald-500 shadow-emerald-500/10'
          : 'bg-white/95 text-slate-800 border-rose-500 shadow-rose-500/10'
      }`}
    >
      <div
        className={`p-1.5 rounded-lg ${
          isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {isSuccess ? 'Operación Exitosa' : 'Atención / Error'}
        </span>
        <span className="text-sm font-medium text-slate-700">{message}</span>
      </div>

      <button
        onClick={onClose}
        className="ml-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};