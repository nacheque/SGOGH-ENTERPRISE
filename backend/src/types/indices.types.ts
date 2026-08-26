export interface CreateIndiceDTO {
    id_obra: number;
    periodo: string; // Formato 'YYYY-MM'
    porcentaje_variacion: number; // Ej: 1.99 %
}

export interface IndiceActualizacionResponseDTO {
    id_indice: number;
    id_obra: number;
    periodo: string;
    coeficiente_incremento: string | number;
}

export interface RegistroIndiceResultadoDTO {
    indice: IndiceActualizacionResponseDTO;
    cuotas_actualizadas: number;
    mensaje: string;
}