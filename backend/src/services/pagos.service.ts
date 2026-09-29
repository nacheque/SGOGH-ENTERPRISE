import { PagosRepository } from '../repositories/pagos.repository';
import { 
  CreatePagoDTO, 
  PagoResponseDTO, 
  CuotaConPagoDTO, 
  ChequeCarteraDTO, 
  ReciboDatosDTO, 
  RegistrarPagoPayload, 
  PagoDetalleDTO,
  EstadoCheque,
  ChequeActualizadoResponseDTO 
} from '../types/pagos.types';

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

    const medio = (dto.medio_pago || '').toUpperCase().trim();
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;

    // 1. Validación estricta para valores (Cheques físicos y ECHEQs)
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

    // 2. Validación y normalización para Transferencias Bancarias
    if (medio === 'TRANSFERENCIA') {
      if (dto.fecha_acreditacion && !regexFecha.test(dto.fecha_acreditacion)) {
        throw new Error('El campo fecha_acreditacion debe tener formato YYYY-MM-DD.');
      }
    }

    // 3. Validación y normalización para Redes de Recaudación (Pago Fácil / Rapipago)
    let comisionCobro = 0;
    if (medio === 'PAGO_FACIL' || medio === 'RAPIPAGO') {
      if (dto.comision_cobro !== undefined && dto.comision_cobro !== null) {
        comisionCobro = Number(dto.comision_cobro);
        if (isNaN(comisionCobro) || comisionCobro < 0) {
          throw new Error('La comision_cobro debe ser un valor numérico positivo o cero.');
        }
      }

      if (dto.fecha_cobro_cliente && !regexFecha.test(dto.fecha_cobro_cliente)) {
        throw new Error('El campo fecha_cobro_cliente debe tener formato YYYY-MM-DD.');
      }
      if (dto.fecha_rendicion && !regexFecha.test(dto.fecha_rendicion)) {
        throw new Error('El campo fecha_rendicion debe tener formato YYYY-MM-DD.');
      }

      // Coherencia temporal: la rendición no puede ser anterior al cobro en ventanilla
      if (dto.fecha_cobro_cliente && dto.fecha_rendicion) {
        if (new Date(dto.fecha_rendicion) < new Date(dto.fecha_cobro_cliente)) {
          throw new Error('La fecha_rendicion no puede ser anterior a la fecha_cobro_cliente.');
        }
      }
    }

    return await this.pagosRepo.registrarPagoTransaccional({
      ...dto,
      id_cuota: Number(dto.id_cuota),
      monto: Number(dto.monto),
      medio_pago: medio as any,
      comision_cobro: comisionCobro,
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

  /**
   * Genera el DTO con los datos formateados para el recibo oficial
   */
  async obtenerDatosRecibo(idPago: number): Promise<ReciboDatosDTO> {
    if (!idPago || isNaN(idPago) || idPago <= 0) {
      const error: any = new Error('El ID de pago debe ser un entero positivo válido');
      error.statusCode = 400;
      throw error;
    }

    const row = await this.pagosRepo.obtenerDatosRecibo(idPago);

    if (!row) {
      const error: any = new Error('Pago no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 1. Lógica de Nomenclatura del Lote
    let nomenclaturaLote = '';
    const lote = row.lote_catast_muni || row.lote_catast_provincia;

    if (row.manzana && lote) {
      nomenclaturaLote = `Mz: ${row.manzana} - Lote: ${lote}`;
    } else if (lote) {
      nomenclaturaLote = `Lote: ${lote}`;
    } else if (row.calle && row.numero) {
      nomenclaturaLote = `${row.calle} ${row.numero}`;
    } else {
      nomenclaturaLote = `Clave Cliente: ${row.clave_cliente}`;
    }

    // 2. Lógica de Detalle de Medio de Pago
    let detalleMedioPago = '';
    const medio = (row.medio_pago || '').toUpperCase();

    if (medio === 'TRANSFERENCIA') {
      detalleMedioPago = row.referencia_transferencia
        ? `TRANSFERENCIA BANCARIA (Ref: ${row.referencia_transferencia})`
        : 'TRANSFERENCIA BANCARIA';
    } else if (medio === 'CHEQUE' || medio === 'ECHEQ') {
      const nro = row.numero_cheque ? `N° ${row.numero_cheque}` : 'S/N';
      const banco = row.banco_emisor ? `Banco: ${row.banco_emisor}` : 'Banco: S/D';
      detalleMedioPago = `${medio} ${nro} - ${banco}`;
    } else if (medio === 'EFECTIVO') {
      detalleMedioPago = 'EFECTIVO';
    } else {
      detalleMedioPago = medio;
    }

    return {
      id_pago: row.id_pago,
      nro_recibo: row.nro_recibo, // Talonario correlativo institucional "000004"
      fecha_pago: row.fecha_pago,
      titular_nombre: row.titular_nombre || 'S/D',
      titular_dni: row.titular_dni,
      monto_pagado: Number(row.monto_pagado),
      nro_cuota: row.nro_cuota,
      concepto_cuota: row.concepto_cuota,
      obra_nombre: row.nombre_obra,
      obra_localidad: row.obra_localidad,
      medio_pago: row.medio_pago,
      detalle_medio_pago: detalleMedioPago,
      nomenclatura_lote: nomenclaturaLote,
    };
  }

  /**
   * Actualiza el estado operativo de un cheque/echeq (ej: DEPOSITADO, COBRADO)
   */
  async actualizarEstadoCheque(
    idPago: number,
    nuevoEstado: EstadoCheque,
    fechaDeposito?: string
  ): Promise<ChequeActualizadoResponseDTO> {
    if (!idPago || isNaN(idPago) || idPago <= 0) {
      const error: any = new Error('El ID de pago debe ser un entero positivo válido');
      error.statusCode = 400;
      throw error;
    }

    if (!nuevoEstado) {
      const error: any = new Error('El campo estado es requerido');
      error.statusCode = 400;
      throw error;
    }

    const chequeExistente = await this.pagosRepo.buscarChequePorId(idPago);
    if (!chequeExistente) {
      const error: any = new Error(`No se encontró el cheque o pago con ID ${idPago}`);
      error.statusCode = 404;
      throw error;
    }

    if (chequeExistente.medio_pago !== 'CHEQUE' && chequeExistente.medio_pago !== 'ECHEQ') {
      const error: any = new Error(
        `El pago con ID ${idPago} no corresponde a un valor en cartera (medio: ${chequeExistente.medio_pago})`
      );
      error.statusCode = 400;
      throw error;
    }

    const transicionesPermitidas: Record<EstadoCheque, EstadoCheque[]> = {
      CARTERA: ['DEPOSITADO', 'ANULADO', 'RECHAZADO'],
      PENDIENTE: ['DEPOSITADO', 'ANULADO', 'RECHAZADO'], // <--- Agregada
      DEPOSITADO: ['COBRADO', 'RECHAZADO'],
      COBRADO: [],
      RECHAZADO: ['ANULADO'],
      ANULADO: [],
    };

    const estadoActual = chequeExistente.estado;

    // Idempotencia: si ya está en ese estado, retornamos el registro directamente
    if (estadoActual === nuevoEstado) {
      return await this.pagosRepo.actualizarEstadoCheque(idPago, nuevoEstado, fechaDeposito);
    }

    const permitidos = transicionesPermitidas[estadoActual] || [];
    if (!permitidos.includes(nuevoEstado)) {
      const error: any = new Error(
        `Transición no permitida: no se puede cambiar el cheque de '${estadoActual}' a '${nuevoEstado}'`
      );
      error.statusCode = 400;
      throw error;
    }

    return await this.pagosRepo.actualizarEstadoCheque(idPago, nuevoEstado, fechaDeposito);
  }
}