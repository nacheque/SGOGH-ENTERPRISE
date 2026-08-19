import React, { useState } from 'react';
import type { CreatePersonaDTO } from '../../types';
import { UserPlus, Loader2, Phone, Mail, Home } from 'lucide-react';

interface PersonaFormProps {
  // Callback que delega la petición HTTP al contenedor padre
  onSubmit: (data: CreatePersonaDTO) => Promise<void>;
  submitting: boolean;
}

export const PersonaForm: React.FC<PersonaFormProps> = ({ onSubmit, submitting }) => {
  // Estado local para los campos del formulario
  const [form, setForm] = useState<CreatePersonaDTO>({
    nombre_completo: '',
    dni: '',
    cuit: '',
    telefono: '',
    email: '',
    domicilio_particular: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
    // Limpieza tras guardado exitoso
    setForm({
      nombre_completo: '',
      dni: '',
      cuit: '',
      telefono: '',
      email: '',
      domicilio_particular: '',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-brand-600" />
          Alta de Vecino / Titular / Frentista
        </h2>
        <span className="text-xs text-slate-400 font-medium">Sprint 1 • Alta Padrón</span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">
              Nombre Completo / Razón Social <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.nombre_completo}
              onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
              placeholder="Ej. Juan Pérez o Desarrollos S.A."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">DNI</label>
            <input
              type="text"
              value={form.dni}
              onChange={(e) => setForm({ ...form, dni: e.target.value })}
              placeholder="Sin puntos (ej. 32123456)"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">CUIT / CUIL</label>
            <input
              type="text"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
              placeholder="Ej. 20-32123456-8"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" /> Teléfono de Contacto
            </label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="Ej. +54 9 351 1234567"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" /> Correo Electrónico
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="vecino@correo.com"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
              <Home className="w-3 h-3 text-slate-400" /> Domicilio Notificación
            </label>
            <input
              type="text"
              value={form.domicilio_particular}
              onChange={(e) => setForm({ ...form, domicilio_particular: e.target.value })}
              placeholder="Dirección fiscal o postal"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Registrar en Padrón
          </button>
        </div>
      </form>
    </div>
  );
};