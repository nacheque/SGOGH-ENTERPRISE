// ==========================================
// MÓDULO DE OBRAS
// ==========================================
export type EstadoObra = 'PLANIFICADA' | 'EN_PROGRESO' | 'FINALIZADA' | 'PAUSADA';

export interface Obra {
  id_obra: number;
  nombre_obra: string;
  descripcion?: string;
  precio_x_metro: number;
  costo_gabinete: number;
  fecha_inicio?: string;
  estado: EstadoObra;
  created_at?: string;
}

export interface CreateObraDTO {
  nombre_obra: string;
  descripcion?: string;
  precio_x_metro: number;
  costo_gabinete?: number;
  fecha_inicio?: string;
  estado?: EstadoObra;
}

// DTO del Padrón Consolidado que devuelve getPadronByObra
export interface PadronInmuebleDTO {
  id_inmueble: number;
  id_obra: number;
  clave_cliente: string;
  manzana: string | null;
  lote_catast_muni: string | null;
  lote_catast_provincia: string | null;
  calle: string;
  numero: string | null;
  metros_frente: number;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  observacion: string | null;
  // Frentista
  frentista_nombre: string | null;
  frentista_dni: string | null;
  frentista_cuit: string | null;
  frentista_telefono: string | null;
  frentista_email: string | null;
  domicilio_notificacion: string | null;
  // Titular de Servicio
  titular_nombre: string | null;
  titular_dni: string | null;
  titular_cuit: string | null;
  titular_telefono: string | null;
  titular_email: string | null;
  titular_domicilio: string | null;
}