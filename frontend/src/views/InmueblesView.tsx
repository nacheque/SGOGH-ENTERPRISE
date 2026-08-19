import React, { useState, useEffect } from 'react';
import type { Inmueble, CreateInmuebleDTO, Obra, Persona } from '../types';
import { getInmuebles, createInmueble } from '../api/inmuebles.api';
import { getObras } from '../api/obras.api';
import { getPersonas } from '../api/personas.api';
import { InmuebleForm } from '../components/inmuebles/InmuebleForm';
import { InmuebleTable } from '../components/inmuebles/InmuebleTable';

interface Props {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const InmueblesView: React.FC<Props> = ({ showToast }) => {
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Carga simultánea de todas las dependencias necesarias
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [inmData, obrData, perData] = await Promise.all([
        getInmuebles(),
        getObras(),
        getPersonas(),
      ]);
      setInmuebles(inmData);
      setObras(obrData);
      setPersonas(perData);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Manejador del alta de inmuebles
  const handleCreateInmueble = async (formData: CreateInmuebleDTO) => {
    if (!formData.clave_cliente.trim()) {
      showToast('La clave de cliente es obligatoria', 'error');
      return;
    }
    if (!formData.calle.trim()) {
      showToast('La calle es obligatoria', 'error');
      return;
    }
    if (formData.metros_frente <= 0) {
      showToast('Los metros de frente deben ser mayores a 0', 'error');
      return;
    }
    if (!formData.id_obra) {
      showToast('Debes seleccionar una obra válida', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await createInmueble(formData);
      showToast('Inmueble registrado correctamente en el catastro', 'success');

      // Refrescamos solo los inmuebles
      const updated = await getInmuebles();
      setInmuebles(updated);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <InmuebleForm
        obras={obras}
        personas={personas}
        onSubmit={handleCreateInmueble}
        submitting={submitting}
      />
      <InmuebleTable inmuebles={inmuebles} loading={loading} />
    </div>
  );
};