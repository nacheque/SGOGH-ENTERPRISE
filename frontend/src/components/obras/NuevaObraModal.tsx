import React, { useState } from 'react';
import type { CreateObraDTO } from '../../types/obras.types';
import { createObra } from '../../api/obrasRediseño.api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NuevaObraModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateObraDTO>({
    nombre_obra: '',
    ubicacion: '',
    anio: new Date().getFullYear(),
    precio_x_metro: 0,
    costo_gabinete: 0,
    estado: 'ACTIVA',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createObra(formData);
      setFormData({
        nombre_obra: '',
        ubicacion: '',
        anio: new Date().getFullYear(),
        precio_x_metro: 0,
        costo_gabinete: 0,
        estado: 'ACTIVA',
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al crear obra:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">Registrar Nueva Obra</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nombre de la Obra *</label>
            <input
              type="text"
              required
              placeholder="Ej. Red de Gas Natural Barrio Centro"
              value={formData.nombre_obra}
              onChange={(e) => setFormData({ ...formData, nombre_obra: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Ubicación / Localidad *</label>
              <input
                type="text"
                required
                placeholder="Ej. Villa General Belgrano"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Año *</label>
              <input
                type="number"
                required
                value={formData.anio}
                onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) || 2026 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Precio Base x Metro ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.precio_x_metro}
                onChange={(e) => setFormData({ ...formData, precio_x_metro: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Costo Gabinete Base ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.costo_gabinete}
                onChange={(e) => setFormData({ ...formData, costo_gabinete: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Crear Obra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};