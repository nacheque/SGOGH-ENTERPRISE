import React, { useState, useEffect } from 'react';
import type { CreateInmuebleDTO, Obra, Persona } from '../../types';
import { MapPin, Plus, Loader2 } from 'lucide-react';

interface InmuebleFormProps {
  obras: Obra[];
  personas: Persona[];
  onSubmit: (data: CreateInmuebleDTO) => Promise<void>;
  submitting: boolean;
}

export const InmuebleForm: React.FC<InmuebleFormProps> = ({
  obras,
  personas,
  onSubmit,
  submitting,
}) => {
  // Estado local del formulario
  const [form, setForm] = useState<CreateInmuebleDTO>({
    clave_cliente: '',
    id_obra: 0,
    id_titular: null,
    id_frentista: null,
    calle: '',
    numero: '',
    manzana: '',
    lote: '',
    metros_frente: 0,
    conexion_gabinete: false,
    gabinete_colocado: false,
  });

  // Si se cargan las obras y aún no hay una seleccionada por defecto, asignamos la primera
  useEffect(() => {
    if (obras.length > 0 && form.id_obra === 0) {
      setForm((prev) => ({ ...prev, id_obra: obras[0].id_obra }));
    }
  }, [obras, form.id_obra]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
    // Limpiamos los campos conservando la obra seleccionada
    setForm((prev) => ({
      ...prev,
      clave_cliente: '',
      calle: '',
      numero: '',
      manzana: '',
      lote: '',
      metros_frente: 0,
      id_titular: null,
      id_frentista: null,
      conexion_gabinete: false,
      gabinete_colocado: false,
    }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-brand-600" />
          Alta de Inmueble / Lote Catastral
        </h2>
        <span className="text-xs text-slate-400 font-medium">Sprint 1 • Tarea 3.2.4</span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Fila 1: Clave, Obra, Frentista y Titular */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Clave Cliente *
            </label>
            <input
              type="text"
              required
              value={form.clave_cliente}
              onChange={(e) => setForm({ ...form, clave_cliente: e.target.value })}
              placeholder="Ej. OBRA1-0012"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Obra de Red *
            </label>
            <select
              value={form.id_obra}
              onChange={(e) => setForm({ ...form, id_obra: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            >
              {obras.map((o) => (
                <option key={o.id_obra} value={o.id_obra}>
                  {o.nombre_obra}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Frentista (Opcional)
            </label>
            <select
              value={form.id_frentista || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  id_frentista: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            >
              <option value="">-- Sin frentista asignado --</option>
              {personas.map((p) => (
                <option key={p.id_persona} value={p.id_persona}>
                  {p.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Titular Dominial (Opcional)
            </label>
            <select
              value={form.id_titular || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  id_titular: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            >
              <option value="">-- Sin titular asignado --</option>
              {personas.map((p) => (
                <option key={p.id_persona} value={p.id_persona}>
                  {p.nombre_completo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Ubicación física del lote */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Calle / Ubicación *
            </label>
            <input
              type="text"
              required
              value={form.calle}
              onChange={(e) => setForm({ ...form, calle: e.target.value })}
              placeholder="Ej. Av. San Martín"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Número / Altura
            </label>
            <input
              type="text"
              value={form.numero}
              onChange={(e) => setForm({ ...form, numero: e.target.value })}
              placeholder="1234 o S/N"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Manzana / Lote
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.manzana}
                onChange={(e) => setForm({ ...form, manzana: e.target.value })}
                placeholder="Mz"
                className="w-1/2 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
              <input
                type="text"
                value={form.lote}
                onChange={(e) => setForm({ ...form, lote: e.target.value })}
                placeholder="Lt"
                className="w-1/2 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Metros de Frente *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={form.metros_frente || ''}
              onChange={(e) =>
                setForm({ ...form, metros_frente: parseFloat(e.target.value) || 0 })
              }
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>
        </div>

        {/* Fila 3: Opciones de Gabinete y Botón */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.conexion_gabinete}
                onChange={(e) =>
                  setForm({ ...form, conexion_gabinete: e.target.checked })
                }
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Requiere Conexión de Gabinete
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.gabinete_colocado}
                onChange={(e) =>
                  setForm({ ...form, gabinete_colocado: e.target.checked })
                }
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Gabinete ya colocado
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || obras.length === 0}
            className="w-full md:w-auto px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            Registrar Inmueble
          </button>
        </div>
      </form>
    </div>
  );
};