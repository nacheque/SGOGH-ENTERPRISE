import React, { useState } from 'react';
import { X, Building2, User, FileText, Loader2, Check } from 'lucide-react';
import type { CreateInmuebleConPersonasDTO } from '../../types/inmuebles.types';
import { createInmuebleEnObra } from '../../api/obras.api';

interface Props {
  isOpen: boolean;
  idObra: number;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const NuevoInmuebleModal: React.FC<Props> = ({
  isOpen,
  idObra,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [loading, setLoading] = useState(false);

  // Sección 1: Físicos y Catastrales
  const [calle, setCalle] = useState('');
  const [numero, setNumero] = useState('');
  const [manzana, setManzana] = useState('');
  const [loteMuni, setLoteMuni] = useState('');
  const [loteProv, setLoteProv] = useState('');
  const [metrosFrente, setMetrosFrente] = useState<string>('');
  const [conexionGabinete, setConexionGabinete] = useState(false);
  const [gabineteColocado, setGabineteColocado] = useState(false);
  const [observacion, setObservacion] = useState('');

  // Sección 2: Frentista
  const [frentistaNombre, setFrentistaNombre] = useState('');

  // Sección 3: Titular del Servicio
  const [esMismoFrentista, setEsMismoFrentista] = useState(true);
  const [titularNombre, setTitularNombre] = useState('');
  const [dni, setDni] = useState('');
  const [cuit, setCuit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [domicilioNotificacion, setDomicilioNotificacion] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setCalle('');
    setNumero('');
    setManzana('');
    setLoteMuni('');
    setLoteProv('');
    setMetrosFrente('');
    setConexionGabinete(false);
    setGabineteColocado(false);
    setObservacion('');
    setFrentistaNombre('');
    setEsMismoFrentista(true);
    setTitularNombre('');
    setDni('');
    setCuit('');
    setTelefono('');
    setEmail('');
    setDomicilioNotificacion('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const metros = parseFloat(metrosFrente);
    if (!calle.trim()) {
      showToast('La calle es obligatoria', 'error');
      return;
    }
    if (isNaN(metros) || metros <= 0) {
      showToast('Los metros de frente deben ser un número válido mayor a 0', 'error');
      return;
    }
    if (!frentistaNombre.trim()) {
      showToast('El nombre del frentista es obligatorio', 'error');
      return;
    }
    if (!esMismoFrentista && !titularNombre.trim()) {
      showToast('Debe ingresar el nombre del titular del servicio', 'error');
      return;
    }

    const payload: CreateInmuebleConPersonasDTO = {
      calle: calle.trim(),
      numero: numero.trim() || undefined,
      manzana: manzana.trim() || undefined,
      lote_catast_muni: loteMuni.trim() || undefined,
      lote_catast_provincia: loteProv.trim() || undefined,
      metros_frente: metros,
      conexion_gabinete: conexionGabinete,
      gabinete_colocado: gabineteColocado,
      observacion: observacion.trim() || undefined,
      // Corrección aquí:
      frentista: {
        nombre_completo: frentistaNombre.trim(),
      },
      titular: {
        es_mismo_frentista: esMismoFrentista,
        datos: {
          nombre_completo: esMismoFrentista ? frentistaNombre.trim() : titularNombre.trim(),
          dni: dni.trim() || undefined,
          cuit: cuit.trim() || undefined,
          telefono: telefono.trim() || undefined,
          email: email.trim() || undefined,
          domicilio_notificacion: domicilioNotificacion.trim() || undefined,
        },
      },
    };

    try {
      setLoading(true);
      await createInmuebleEnObra(idObra, payload);
      showToast('Inmueble incorporado al padrón correctamente', 'success');
      resetForm();
      onClose();
      onSuccess();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al registrar el inmueble', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="text-base font-bold text-slate-800">Cargar Inmueble al Padrón</h3>
              <p className="text-xs text-slate-500">Alta física catastral y vinculación frentista / titular</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* SECCIÓN 1: DATOS FÍSICOS Y CATASTRALES */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>1. Datos Físicos y Catastrales del Inmueble</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="font-semibold text-slate-600 block mb-1">Calle *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Av. Los Alamos"
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Altura / N°</label>
                <input
                  type="text"
                  placeholder="Ej. 120 o S/N"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Manzana</label>
                <input
                  type="text"
                  placeholder="Mz 04"
                  value={manzana}
                  onChange={(e) => setManzana(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Lote Cat. Mun.</label>
                <input
                  type="text"
                  placeholder="Lote 12"
                  value={loteMuni}
                  onChange={(e) => setLoteMuni(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Lote Cat. Prov.</label>
                <input
                  type="text"
                  placeholder="04-12-005"
                  value={loteProv}
                  onChange={(e) => setLoteProv(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Metros Frente *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="10.50"
                  value={metrosFrente}
                  onChange={(e) => setMetrosFrente(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={conexionGabinete}
                  onChange={(e) => setConexionGabinete(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 accent-brand-600"
                />
                <span className="font-semibold text-slate-700">Conexión de Gabinete</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={gabineteColocado}
                  onChange={(e) => setGabineteColocado(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 accent-brand-600"
                />
                <span className="font-semibold text-slate-700">Gabinete Colocado</span>
              </label>

              <div>
                <input
                  type="text"
                  placeholder="Observación (ej: ESQ.)"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: FRENTISTA */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>2. Frentista (Ocupante / Poseedor del Lote)</span>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Nombre y Apellido / Razón Social *</label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Carlos Pérez"
                value={frentistaNombre}
                onChange={(e) => setFrentistaNombre(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          {/* SECCIÓN 3: TITULAR DEL SERVICIO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>3. Titular del Servicio (Datos Fiscales y Contacto)</span>
              </div>
            </div>

            {/* Toggle de vinculación */}
            <div className="bg-brand-50/50 p-3 rounded-xl border border-brand-100 flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                ¿El titular del servicio es el mismo frentista?
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={esMismoFrentista}
                  onChange={(e) => setEsMismoFrentista(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {/* Nombre del titular (si difiere) */}
            {!esMismoFrentista && (
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Nombre Completo del Titular *</label>
                <input
                  type="text"
                  required={!esMismoFrentista}
                  placeholder="Ej. Empresa SA / Propietario Registral"
                  value={titularNombre}
                  onChange={(e) => setTitularNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
                />
              </div>
            )}

            {/* Datos tributarios y de contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">DNI</label>
                <input
                  type="text"
                  placeholder="Ej. 28456123"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">CUIT</label>
                <input
                  type="text"
                  placeholder="Ej. 20-28456123-8"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="Ej. +54 9 351 1234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Domicilio de Notificación</label>
              <input
                type="text"
                placeholder="Dirección fiscal o postal para remitir avisos/intimaciones"
                value={domicilioNotificacion}
                onChange={(e) => setDomicilioNotificacion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Inmueble</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};