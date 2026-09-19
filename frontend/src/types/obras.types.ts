export interface ObraDTO {
  id_obra: number;
  nombre_obra: string;
  ubicacion: string;
  anio: number;
  precio_x_metro: number | string;
  costo_gabinete: number | string;
  estado: string;
}

export interface CreateObraDTO {
  nombre_obra: string;
  ubicacion: string;
  anio: number;
  precio_x_metro: number;
  costo_gabinete: number;
  estado?: string;
}

export interface PadronInmuebleDTO {
  id_inmueble: number;
  clave_cliente: string;
  calle: string;
  numero: string;
  manzana: string | null;
  lote_catast_muni: string | null;
  lote_catast_provincia: string | null;
  metros_frente: number;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  observacion: string | null;

  // Datos Frentista
  frentista_nombre: string | null;
  frentista_dni: string | null;
  frentista_cuit: string | null;
  frentista_telefono: string | null;
  frentista_email: string | null;

  // Datos Titular
  titular_nombre: string | null;
  titular_dni: string | null;
  titular_cuit: string | null;
  titular_telefono?: string | null;
  titular_email?: string | null;
  titular_domicilio?: string | null;
  domicilio_notificacion?: string | null;
}