import { InmueblesRepository } from '../repositories/inmuebles.repository';
import { CreateInmuebleConPersonasDTO, InmuebleCompletoResponseDTO } from '../types/inmueble.types';

export class InmueblesService {
  private repo: InmueblesRepository;

  constructor() {
    this.repo = new InmueblesRepository();
  }

  async registrarInmuebleConPersonas(
    idObra: number,
    dto: CreateInmuebleConPersonasDTO
  ): Promise<InmuebleCompletoResponseDTO> {
    // Validaciones de negocio
    if (!idObra || isNaN(idObra)) {
      throw new Error('El ID de obra debe ser un número válido.');
    }

    if (!dto.calle || dto.calle.trim() === '') {
      throw new Error('El campo calle es obligatorio.');
    }

    if (dto.metros_frente === undefined || Number(dto.metros_frente) <= 0) {
      throw new Error('Los metros de frente deben ser un valor mayor a 0.');
    }

    if (!dto.frentista || !dto.frentista.nombre_completo || dto.frentista.nombre_completo.trim() === '') {
      throw new Error('Los datos del frentista con su nombre_completo son obligatorios.');
    }

    return await this.repo.crearInmuebleCompleto(idObra, {
      ...dto,
      metros_frente: Number(dto.metros_frente),
    });
  }
}