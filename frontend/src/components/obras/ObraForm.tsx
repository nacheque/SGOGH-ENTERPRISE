import React, { useState } from 'react';
import type { CreateObraDTO } from '../../types';
import { Plus, HardHat, Loader2 } from 'lucide-react';

interface ObraFormProps {
  onSubmit: (data: CreateObraDTO) => Promise<void>;
  submitting: boolean;
}

export const ObraForm: React.FC<ObraFormProps> = ({ onSubmit, submitting }) => {
  const [formData, setFormData] = useState<CreateObraDTO>({
    nombre_obra: '',
    descripcion: '',
    precio_x_metro: 0,
    costo_gabinete: 300000,
    estado: 'EN_PROGRESO',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Limpiar formulario tras éxito
    setFormData({
      nombre_obra: '',
      descripcion: '',
      precio_x_metro: 0,
      costo_gabinete: 300000,
      estado: 'EN_PROGRESO',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-brand-600" />
          Nueva Obra de Infraestructura
        </h2>
        <span className="text-xs text-slate-400 font-medium">Sprint 1 • Alta</span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Nombre de la Obra <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nombre_obra}
              onChange={(e) => setFormData({ ...formData, nombre_obra: e.target.value })}
              placeholder="Ej. Red de Agua Etapa 1"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Precio Base x Metro ($) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.precio_x_metro || ''}
                onChange={(e) =>
                  setFormData({ ...formData, precio_x_metro: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Costo Gabinete Base ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.costo_gabinete || ''}
                onChange={(e) =>
                  setFormData({ ...formData, costo_gabinete: parseFloat(e.target.value) || 0 })
                }
                className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Descripción / Observaciones
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Detalles sobre el convenio o trazado"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardHat className="w-4 h-4" />}
              Registrar Obra
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};