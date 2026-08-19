import React, { useState, useEffect } from 'react';
import type { Obra, CreateObraDTO } from '../types';
import { getObras, createObra } from '../api/obras.api';
import { ObraForm } from '../components/obras/ObraForm';
import { ObraTable } from '../components/obras/ObraTable';

interface Props {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const ObrasView: React.FC<Props> = ({ showToast }) => {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getObras();
      setObras(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateObra = async (formData: CreateObraDTO) => {
    if (!formData.nombre_obra.trim()) {
      showToast('El nombre de la obra es obligatorio', 'error');
      return;
    }
    if (formData.precio_x_metro <= 0) {
      showToast('El precio por metro debe ser mayor a 0', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await createObra(formData);
      showToast('Obra de red creada exitosamente', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ObraForm onSubmit={handleCreateObra} submitting={submitting} />
      <ObraTable obras={obras} loading={loading} />
    </div>
  );
};