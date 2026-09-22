// ==========================================
// MÓDULO DE PERSONAS (Titulares / Frentistas)
// ==========================================
export interface Persona {
  id_persona: number;
  nombre_completo: string;
  dni?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  domicilio_particular?: string;
  created_at?: string;
}

export interface CreatePersonaDTO {
  nombre_completo: string;
  dni?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  domicilio_particular?: string;
}

export interface PersonaInmuebleDTO {
  nombre_completo: string;
  dni?: string | null;
  cuit?: string | null;
  telefono?: string | null;
  email?: string | null;
  domicilio_particular?: string | null;
}

export interface TitularInputDTO {
  nombre_completo: string;
  dni?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  domicilio_notificacion?: string;
}