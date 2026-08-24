import React, { useState } from 'react';
import type { Obra, Persona, CreateInmuebleDTO } from '../../types';
import { PlusCircle, Loader2 } from 'lucide-react';

interface Props {
  obras: Obra[];
  personas: Persona[];
  onSubmit: (data: CreateInmuebleDTO) => Promise<void>;
}

export const InmuebleForm: React.FC<Props> = ({ obras, personas, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateInmuebleDTO>({
    clave_cliente: '',
    id_obra: obras[0]?.id_obra || 0,
    id_frentista: null,
    id_titular: null,
    calle: '',
    numero: '',
    manzana: '',
    lote_catast_muni: '',
    lote_catast_provincia: '',
    metros_frente: 0,
    conexion_gabinete: false,
    gabinete_colocado: false,
    observacion: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clave_cliente || !formData.id_obra || !formData.calle || formData.metros_frente <= 0) {
      alert('Por favor complete la Clave, Obra, Calle y Metros de Frente.');
      return;
    }
    try {
      setLoading(true);
      await onSubmit(formData);
      setFormData({
        clave_cliente: '',
        id_obra: obras[0]?.id_obra || 0,
        id_frentista: null,
        id_titular: null,
        calle: '',
        numero: '',
        manzana: '',
        lote_catast_muni: '',
        lote_catast_provincia: '',
        metros_frente: 0,
        conexion_gabinete: false,
        gabinete_colocado: false,
        observacion: '',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-brand-600" /> Alta de Inmueble / Lote Catastral
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Clave Cliente */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Clave Cliente *</label>
          <input
            type="text"
            required
            placeholder="Ej. OBRA1-0012"
            value={formData.clave_cliente}
            onChange={(e) => setFormData({ ...formData, clave_cliente: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-500"
          />
        </div>

        {/* Obra de Red */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Obra de Red *</label>
          <select
            required
            value={formData.id_obra}
            onChange={(e) => setFormData({ ...formData, id_obra: Number(e.target.value) })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-500 bg-white"
          >
            <option value={0} disabled>-- Seleccionar Obra --</option>
            {obras.map((o) => (
              <option key={o.id_obra} value={o.id_obra}>{o.nombre_obra}</option>
            ))}
          </select>
        </div>

        {/* Frentista */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Frentista (Habita / Paga)</label>
          <select
            value={formData.id_frentista || ''}
            onChange={(e) => setFormData({ ...formData, id_frentista: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-500 bg-white"
          >
            <option value="">-- Sin frentista asignado --</option>
            {personas.map((p) => (
              <option key={p.id_persona} value={p.id_persona}>{p.nombre_completo}</option>
            ))}
          </select>
        </div>

        {/* Titular Dominial */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Titular del Servicio (Dominial)</label>
          <select
            value={formData.id_titular || ''}
            onChange={(e) => setFormData({ ...formData, id_titular: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-500 bg-white"
          >
            <option value="">-- Sin titular asignado --</option>
            {personas.map((p) => (
              <option key={p.id_persona} value={p.id_persona}>{p.nombre_completo}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Domicilio y Catastro */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Calle / Ubicación *</label>
          <input
            type="text"
            required
            placeholder="Ej. Av. San Martín"
            value={formData.calle}
            onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Número / Altura</label>
          <input
            type="text"
            placeholder="1234 o S/N"
            value={formData.numero || ''}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Manzana (MZA)</label>
          <input
            type="text"
            placeholder="Ej. Mz 04"
            value={formData.manzana || ''}
            onChange={(e) => setFormData({ ...formData, manzana: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Lote Catast. Municipal</label>
          <input
            type="text"
            placeholder="Ej. Lote 12"
            value={formData.lote_catast_muni || ''}
            onChange={(e) => setFormData({ ...formData, lote_catast_muni: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Lote Catast. Provincial</label>
          <input
            type="text"
            placeholder="Ej. Parc 05"
            value={formData.lote_catast_provincia || ''}
            onChange={(e) => setFormData({ ...formData, lote_catast_provincia: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Metros de Frente *</label>
          <input
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            value={formData.metros_frente || ''}
            onChange={(e) => setFormData({ ...formData, metros_frente: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Observación</label>
          <input
            type="text"
            placeholder="Aclaraciones particulares del lote..."
            value={formData.observacion || ''}
            onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={formData.conexion_gabinete}
              onChange={(e) => setFormData({ ...formData, conexion_gabinete: e.target.checked })}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Requiere Serv. Dom (Gabinete)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={formData.gabinete_colocado}
              onChange={(e) => setFormData({ ...formData, gabinete_colocado: e.target.checked })}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Gabinete ya colocado
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Registrar Inmueble
        </button>
      </div>
    </form>
  );
};