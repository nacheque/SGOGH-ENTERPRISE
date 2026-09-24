import { PagosRepository } from '../repositories/pagos.repository';
import { CreatePagoDTO, PagoResponseDTO, CuotaConPagoDTO, ChequeCarteraDTO } from '../types/pagos.types';

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

    const medio = (dto.medio_pago || '').toUpperCase();
    // Validación estricta para valores (Cheques físicos y ECHEQs)
    if (medio === 'CHEQUE' || medio === 'ECHEQ') {
      if (!dto.numero_cheque || dto.numero_cheque.trim() === '') {
        throw new Error('El campo numero_cheque es obligatorio para pagos con CHEQUE o ECHEQ.');
      }
      if (!dto.banco_emisor || dto.banco_emisor.trim() === '') {
        throw new Error('El campo banco_emisor es obligatorio para pagos con CHEQUE o ECHEQ.');
      }

      // Validar CUIT del librador (exactamente 11 dígitos numéricos limpios)
      const cuitLimpio = (dto.cuit_librador || '').replace(/[-\s]/g, '');
      if (!/^\d{11}$/.test(cuitLimpio)) {
        throw new Error('El cuit_librador debe contener exactamente 11 dígitos numéricos.');
      }
      dto.cuit_librador = cuitLimpio;

      // Validar formato de fechas (YYYY-MM-DD)
      const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
      if (!dto.fecha_emision || !regexFecha.test(dto.fecha_emision)) {
        throw new Error('El campo fecha_emision es obligatorio y debe tener formato YYYY-MM-DD.');
      }
      if (!dto.fecha_cobro || !regexFecha.test(dto.fecha_cobro)) {
        throw new Error('El campo fecha_cobro es obligatorio y debe tener formato YYYY-MM-DD.');
      }

      // Regla de coherencia temporal: fecha_cobro >= fecha_emision
      if (new Date(dto.fecha_cobro) < new Date(dto.fecha_emision)) {
        throw new Error('La fecha_cobro no puede ser anterior a la fecha_emision.');
      }
    }

    return await this.pagosRepo.registrarPagoTransaccional({
      ...dto,
      id_cuota: Number(dto.id_cuota),
      monto: Number(dto.monto),
      medio_pago: dto.medio_pago.toUpperCase().trim(),
      porcentaje_actualizacion:
        dto.porcentaje_actualizacion !== undefined && dto.porcentaje_actualizacion !== null
          ? Number(dto.porcentaje_actualizacion)
          : null,
    });
  }

  async actualizarIndiceCuota(idCuota: number, porcentaje: number): Promise<void> {
    if (!idCuota || isNaN(idCuota)) {
      throw new Error('El id_cuota proporcionado no es válido.');
    }
    if (porcentaje === undefined || isNaN(Number(porcentaje))) {
      throw new Error('El porcentaje de actualización debe ser un número válido.');
    }

    await this.pagosRepo.actualizarIndiceCuota(Number(idCuota), Number(porcentaje));
  }

  async listarCuotasPorInmueble(id_inmueble: number): Promise<CuotaConPagoDTO[]> {
    if (!id_inmueble || isNaN(id_inmueble)) {
      throw new Error('El identificador id_inmueble debe ser un número válido.');
    }
    return await this.pagosRepo.getCuotasByInmueble(id_inmueble);
  }

  async obtenerCarteraCheques(idObra?: number | null, estadoCustodia?: string | null): Promise<ChequeCarteraDTO[]> {
    const estado = estadoCustodia ? estadoCustodia.toUpperCase().trim() : null;
    const obraId = idObra && !isNaN(Number(idObra)) ? Number(idObra) : null;

    return await this.pagosRepo.listarCarteraCheques(obraId, estado);
  }
}