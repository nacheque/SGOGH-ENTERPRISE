import { PagosRepository } from '../repositories/pagos.repository';
import { CreatePagoDTO, PagoResponseDTO, CuotaConPagoDTO } from '../types/pagos.types';

export class PagosService {
  private pagosRepo: PagosRepository;

  constructor() {
    this.pagosRepo = new PagosRepository();
  }

  async procesarPago(dto: CreatePagoDTO): Promise<PagoResponseDTO> {
    if (!dto.id_cuota || dto.monto === undefined || !dto.medio_pago) {
      throw new Error('Faltan campos obligatorios: id_cuota, monto y medio_pago son requeridos.');
    }

    if (Number(dto.monto) <= 0) {
      throw new Error('El monto pagado debe ser mayor a 0.');
    }

    return await this.pagosRepo.registrarPagoTransaccional({
      ...dto,
      id_cuota: Number(dto.id_cuota),
      monto: Number(dto.monto),
      medio_pago: dto.medio_pago.toUpperCase().trim(),
    });
  }

  async listarCuotasPorInmueble(id_inmueble: number): Promise<CuotaConPagoDTO[]> {
    if (!id_inmueble || isNaN(id_inmueble)) {
      throw new Error('El identificador id_inmueble debe ser un número válido.');
    }
    return await this.pagosRepo.getCuotasByInmueble(id_inmueble);
  }
}