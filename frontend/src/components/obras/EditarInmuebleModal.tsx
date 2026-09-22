import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, Home, User, Users } from 'lucide-react';
import type { PadronInmuebleDTO, UpdateInmuebleDTO, PersonaInmuebleDTO } from '../../types';
import { updateInmueble } from '../../api/inmuebles.api';

interface Props {
  isOpen: boolean;
  inmueble: PadronInmuebleDTO | null;
  obraId: number;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const initialFormState: UpdateInmuebleDTO = {
  clave_cliente: '',
  manzana: '',
  lote_catast_muni: '',
  lote_catast_provincia: '',
  calle: '',
  numero: '',
  metros_frente: 0,
  conexion_gabinete: false,
  gabinete_colocado: false,
  observacion: '',
  titular: {
    nombre_completo: '',
    dni: '',
    cuit: '',
    telefono: '',
    email: '',
    domicilio_particular: '',
  },
  mismo_frentista_que_titular: true,
  frentista: {
    nombre_completo: '',
    dni: '',
    cuit: '',
    telefono: '',
    email: '',
    domicilio_particular: '',
  },
};

export const EditarInmuebleModal: React.FC<Props> = ({
  isOpen,
  inmueble,
  obraId,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [formData, setFormData] = useState<UpdateInmuebleDTO>(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (inmueble) {
      const titularNom = inmueble.titular_nombre?.trim() || '';
      const frentistaNom = inmueble.frentista_nombre?.trim() || '';

      // Si frentista está vacío o coincide con el titular, asumimos que son la misma entidad
      const esMismoFrentista =
        !frentistaNom || frentistaNom.toLowerCase() === titularNom.toLowerCase();

      setFormData({
        clave_cliente: inmueble.clave_cliente || '',
        manzana: inmueble.manzana || '',
        lote_catast_muni: inmueble.lote_catast_muni || '',
        lote_catast_provincia: inmueble.lote_catast_provincia || '',
        calle: inmueble.calle || '',
        numero: inmueble.numero || '',
        metros_frente: Number(inmueble.metros_frente) || 0,
        conexion_gabinete: Boolean(inmueble.conexion_gabinete),
        gabinete_colocado: Boolean(inmueble.gabinete_colocado),
        observacion: inmueble.observacion || '',
        titular: {
          nombre_completo: titularNom || frentistaNom,
          dni: inmueble.titular_dni || '',
          cuit: inmueble.titular_cuit || '',
          telefono: inmueble.titular_telefono || '',
          email: inmueble.titular_email || '',
          domicilio_particular: inmueble.titular_domicilio || '',
        },
        mismo_frentista_que_titular: esMismoFrentista,
        frentista: {
          nombre_completo: esMismoFrentista ? '' : frentistaNom,
          dni: esMismoFrentista ? '' : inmueble.frentista_dni || '',
          cuit: esMismoFrentista ? '' : inmueble.frentista_cuit || '',
          telefono: esMismoFrentista ? '' : inmueble.frentista_telefono || '',
          email: esMismoFrentista ? '' : inmueble.frentista_email || '',
          domicilio_particular: esMismoFrentista ? '' : inmueble.domicilio_notificacion || '',
        },
      });
    }
  }, [inmueble]);

  if (!isOpen || !inmueble) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones nativas requeridas
    if (!formData.clave_cliente.trim()) {
      return showToast('El ID-Cliente es obligatorio', 'error');
    }
    if (!formData.manzana.trim()) {
      return showToast('La manzana es obligatoria', 'error');
    }
    if (!formData.calle.trim()) {
      return showToast('La calle es obligatoria', 'error');
    }
    if (Number(formData.metros_frente) <= 0) {
      return showToast('Los metros de frente deben ser un número mayor a 0', 'error');
    }
    if (!formData.titular.nombre_completo.trim()) {
      return showToast('El nombre del titular es obligatorio', 'error');
    }
    if (!formData.mismo_frentista_que_titular && !formData.frentista?.nombre_completo?.trim()) {
      return showToast('Debe ingresar el nombre del frentista si no coincide con el titular', 'error');
    }

    try {
      setSubmitting(true);
      const res = await updateInmueble(inmueble.id_inmueble, formData);
      showToast(res.message || 'Lote actualizado exitosamente', 'success');

      // Notificación cross-view para refrescar FinanzasView en segundo plano
      window.dispatchEvent(new CustomEvent('padron:actualizado', { detail: { obraId } }));

      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error al actualizar el lote';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const updateFrentistaField = (field: keyof PersonaInmuebleDTO, value: string) => {
    setFormData((prev) => ({
      ...prev,
      frentista: {
        nombre_completo: prev.frentista?.nombre_completo || '',
        dni: prev.frentista?.dni || '',
        cuit: prev.frentista?.cuit || '',
        telefono: prev.frentista?.telefono || '',
        email: prev.frentista?.email || '',
        domicilio_particular: prev.frentista?.domicilio_particular || '',
        [field]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Modificar Inmueble (Lote #{inmueble.id_inmueble})
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ID-Cliente actual: {inmueble.clave_cliente || 'Sin Asignar'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* BLOQUE A: Datos Catastrales y Físicos */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-200 pb-2">
              <Home className="w-4 h-4 text-brand-600" />
              <span>Datos Catastrales y Físicos</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ID-Cliente *</label>
                <input
                  type="text"
                  required
                  value={formData.clave_cliente}
                  onChange={(e) => setFormData({ ...formData, clave_cliente: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Manzana *</label>
                <input
                  type="text"
                  required
                  value={formData.manzana}
                  onChange={(e) => setFormData({ ...formData, manzana: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lote Cat. Municipal</label>
                <input
                  type="text"
                  value={formData.lote_catast_muni || ''}
                  onChange={(e) => setFormData({ ...formData, lote_catast_muni: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lote Cat. Provincial</label>
                <input
                  type="text"
                  value={formData.lote_catast_provincia || ''}
                  onChange={(e) => setFormData({ ...formData, lote_catast_provincia: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Calle *</label>
                <input
                  type="text"
                  required
                  value={formData.calle}
                  onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Número / Altura</label>
                <input
                  type="text"
                  value={formData.numero || ''}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Metros de Frente *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.metros_frente}
                  onChange={(e) =>
                    setFormData({ ...formData, metros_frente: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono font-bold"
                />
              </div>

              <div className="flex gap-4 pt-4 md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.conexion_gabinete}
                    onChange={(e) =>
                      setFormData({ ...formData, conexion_gabinete: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Conexión a Gabinete</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.gabinete_colocado}
                    onChange={(e) =>
                      setFormData({ ...formData, gabinete_colocado: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Gabinete Colocado</span>
                </label>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Observaciones</label>
              <input
                type="text"
                value={formData.observacion || ''}
                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                placeholder="Notas o referencias..."
              />
            </div>
          </div>

          {/* BLOQUE B: Titular del Servicio */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-200 pb-2">
              <User className="w-4 h-4 text-brand-600" />
              <span>Titular del Servicio</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.titular.nombre_completo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      titular: { ...formData.titular, nombre_completo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">DNI</label>
                <input
                  type="text"
                  value={formData.titular.dni || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      titular: { ...formData.titular, dni: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">CUIT</label>
                <input
                  type="text"
                  value={formData.titular.cuit || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      titular: { ...formData.titular, cuit: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formData.titular.telefono || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      titular: { ...formData.titular, telefono: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={formData.titular.email || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      titular: { ...formData.titular, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Domicilio Particular (Notificación)</label>
              <input
                type="text"
                value={formData.titular.domicilio_particular || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    titular: { ...formData.titular, domicilio_particular: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                placeholder="Dejar vacío si coincide con el inmueble de la obra"
              />
            </div>
          </div>

          {/* BLOQUE C: Frentista / Titular del Lote */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Users className="w-4 h-4 text-brand-600" />
                <span>Titular de Lote / Frentista</span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <input
                  type="checkbox"
                  checked={formData.mismo_frentista_que_titular}
                  onChange={(e) =>
                    setFormData({ ...formData, mismo_frentista_que_titular: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Mismo frentista que titular</span>
              </label>
            </div>

            {!formData.mismo_frentista_que_titular && (
              <div className="space-y-4 animate-in fade-in duration-150 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">Nombre Completo *</label>
                    {/* Nombre Completo */}
                    <input
                    type="text"
                    required={!formData.mismo_frentista_que_titular}
                    value={formData.frentista?.nombre_completo || ''}
                    onChange={(e) => updateFrentistaField('nombre_completo', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">DNI</label>
                    {/* DNI */}
                    <input
                    type="text"
                    value={formData.frentista?.dni || ''}
                    onChange={(e) => updateFrentistaField('dni', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">CUIT</label>
                    {/* CUIT */}
                    <input
                    type="text"
                    value={formData.frentista?.cuit || ''}
                    onChange={(e) => updateFrentistaField('cuit', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Teléfono</label>
                    {/* Teléfono */}
                    <input
                    type="text"
                    value={formData.frentista?.telefono || ''}
                    onChange={(e) => updateFrentistaField('telefono', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Email</label>
                    {/* Email */}
                    <input
                    type="email"
                    value={formData.frentista?.email || ''}
                    onChange={(e) => updateFrentistaField('email', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Domicilio Particular</label>
                  {/* Domicilio Particular */}
                    <input
                    type="text"
                    value={formData.frentista?.domicilio_particular || ''}
                    onChange={(e) => updateFrentistaField('domicilio_particular', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                    />
                </div>
              </div>
            )}
          </div>

          {/* Footer de Acciones */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};