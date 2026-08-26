export interface CreateInmuebleDTO {
  clave_cliente: string;
  id_obra: number;
  id_frentista?: number | null;
  id_titular?: number | null;
  calle: string;
  numero?: string | null;
  manzana?: string | null;
  lote_catast_muni?: string | null;
  lote_catast_provincia?: string | null;
  metros_frente: number;
  conexion_gabinete: boolean;
  gabinete_colocado?: boolean;
  observacion?: string | null;
}

export interface InmuebleResponseDTO {
  id_inmueble: number;
  clave_cliente: string;
  id_obra: number;
  nombre_obra: string;
  precio_x_metro: string | number;
  costo_gabinete: string | number;
  id_frentista: number | null;
  frentista_nombre: string | null;
  frentista_dni: string | null;
  id_titular: number | null;
  titular_nombre: string | null;
  titular_dni: string | null;
  calle: string;
  numero: string | null;
  manzana: string | null;
  lote_catast_muni: string | null;
  lote_catast_provincia: string | null;
  metros_frente: string | number;
  conexion_gabinete: boolean;
  gabinete_colocado: boolean;
  observacion: string | null;
}