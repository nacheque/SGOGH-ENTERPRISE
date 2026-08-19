import React, { useState, useEffect } from 'react';
import type { Persona, CreatePersonaDTO } from '../types';
import { getPersonas, createPersona } from '../api/personas.api';
import { useDebounce } from '../hooks/useDebounce';
import { PersonaForm } from '../components/personas/PersonaForm';
import { PersonaTable } from '../components/personas/PersonaTable';

interface Props {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const PersonasView: React.FC<Props> = ({ showToast }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Manejo del buscador
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 350);

  // Carga de datos con debounce[cite: 1]
  const loadPersonas = async (query?: string) => {
    try {
      setLoading(true);
      const data = await getPersonas(query);
      setPersonas(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonas(debouncedSearch);
  }, [debouncedSearch]);

  // Manejador del alta
  const handleCreatePersona = async (formData: CreatePersonaDTO) => {
    if (!formData.nombre_completo.trim()) {
      showToast('El nombre completo es obligatorio', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await createPersona(formData);
      showToast('Vecino/Titular incorporado al padrón correctamente', 'success');
      await loadPersonas(debouncedSearch);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PersonaForm onSubmit={handleCreatePersona} submitting={submitting} />
      <PersonaTable
        personas={personas}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
      />
    </div>
  );
};