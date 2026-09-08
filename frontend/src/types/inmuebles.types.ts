export interface TitularInputDTO {
  nombre_completo: string;
  dni?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  domicilio_notificacion?: string;
}

export interface CreateInmuebleConPersonasDTO {
  calle: string;
  numero?: string;
  manzana?: string;
  lote_catast_muni?: string;
  lote_catast_provincia?: string;
  metros_frente: number;
  conexion_gabinete?: boolean;
  gabinete_colocado?: boolean;
  observacion?: string;
  // Objeto frentista esperado por el backend
  frentista: {
    nombre_completo: string;
  };
  titular: {
    es_mismo_frentista: boolean;
    datos: TitularInputDTO;
  };
}