import * as XLSX from 'xlsx';
import { ConciliacionesRepository } from '../repositories/conciliaciones.repository';
import {
  PreviewConciliacionResponseDTO,
  PreviewItemDTO,
  ConfirmarConciliacionDTO,
  ConfirmacionResponseDTO,
} from '../types/conciliaciones.types';

export class ConciliacionesService {
  private repo: ConciliacionesRepository;

  constructor() {
    this.repo = new ConciliacionesRepository();
  }

  private limpiarClaveRoela(raw: string | number): string {
    let str = String(raw).trim();
    if (str.startsWith('7')) {
      str = str.substring(1);
    }
    return str.replace(/^0+/, '');
  }

  private formatearFecha(rawFecha: any): string {
    if (!rawFecha) return new Date().toISOString().split('T')[0];

    if (typeof rawFecha === 'number') {
      const parsedDate = new Date(Math.round((rawFecha - 25569) * 86400 * 1000));
      return parsedDate.toISOString().split('T')[0];
    }

    const str = String(rawFecha).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        const dia = parts[0].padStart(2, '0');
        const mes = parts[1].padStart(2, '0');
        const anio = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${anio}-${mes}-${dia}`;
      }
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
  }

  /**
   * PASO 1: Preview en memoria (Dry-Run / Solo Lectura) con Cascada
   */
  async simularConciliacionRoela(fileBuffer: Buffer): Promise<PreviewConciliacionResponseDTO> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const rowStr = JSON.stringify(rows[i] || []).toLowerCase();
      if (rowStr.includes('cliente') && rowStr.includes('importe') && rowStr.includes('fecha de pago')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('No se pudo identificar la cabecera de datos en el reporte de ROELA.');
    }

    const dataRows = rows.slice(headerRowIndex + 1);
    const items: PreviewItemDTO[] = [];
    let listosParaImputar = 0;
    let conInconsistencias = 0;
    let montoTotalAConciliar = 0;

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;

      const rowText = row.join(' ').toLowerCase();
      if (rowText.includes('convenio:') || rowText.includes('sucursal:') || rowText.includes('total')) {
        continue;
      }

      const rawCliente = row[2];
      const rawImporte = row[3];
      const rawFechaPago = row[5];

      if (!rawCliente || rawImporte === undefined || rawImporte === null) continue;

      const claveCliente = this.limpiarClaveRoela(rawCliente);
      const fechaPago = this.formatearFecha(rawFechaPago);

      let monto: number;
      if (typeof rawImporte === 'number') {
        monto = Number(rawImporte.toFixed(2));
      } else {
        const montoLimpio = String(rawImporte).replace(/\./g, '').replace(',', '.').trim();
        monto = Number(parseFloat(montoLimpio).toFixed(2));
      }

      if (isNaN(monto) || monto <= 0) continue;

      // 1. Inmueble
      const inmueble = await this.repo.findInmuebleByClave(claveCliente);
      if (!inmueble) {
        conInconsistencias++;
        items.push({
          id_inmueble: null,
          clave_cliente: claveCliente,
          frentista: null,
          fecha_pago: fechaPago,
          monto,
          id_cuota: null,
          nro_cuota: null,
          monto_cuota_actual: null,
          nuevo_estado: null,
          saldo_remanente: null,
          estado_preview: 'INMUEBLE_NO_ENCONTRADO',
          motivo_error: `No se encontró el inmueble con clave '${claveCliente}'.`,
        });
        continue;
      }

      // 2. Duplicado
      const esDuplicado = await this.repo.existePagoDuplicado(inmueble.id_inmueble, fechaPago, monto);
      if (esDuplicado) {
        conInconsistencias++;
        items.push({
          id_inmueble: inmueble.id_inmueble,
          clave_cliente: claveCliente,
          frentista: inmueble.frentista,
          fecha_pago: fechaPago,
          monto,
          id_cuota: null,
          nro_cuota: null,
          monto_cuota_actual: null,
          nuevo_estado: null,
          saldo_remanente: null,
          estado_preview: 'DUPLICADO',
          motivo_error: `El pago de $${monto} en fecha ${fechaPago} ya fue registrado previamente.`,
        });
        continue;
      }

      // 3. Cuotas impagas (ordenadas cronológicamente para cascada)
      const cuotasImpagas = await this.repo.findCuotasExigiblesByInmueble(inmueble.id_inmueble);
      if (cuotasImpagas.length === 0) {
        conInconsistencias++;
        items.push({
          id_inmueble: inmueble.id_inmueble,
          clave_cliente: claveCliente,
          frentista: inmueble.frentista,
          fecha_pago: fechaPago,
          monto,
          id_cuota: null,
          nro_cuota: null,
          monto_cuota_actual: null,
          nuevo_estado: null,
          saldo_remanente: null,
          estado_preview: 'SIN_DEUDA',
          motivo_error: 'El inmueble no posee cuotas pendientes de cobro.',
        });
        continue;
      }

      // 4. Imputación en Cascada
      let saldoDisponible = monto;

      for (const cuota of cuotasImpagas) {
        if (saldoDisponible <= 0.009) break;

        const exigible = Number(cuota.monto_actualizado);
        let montoAplicado = 0;
        let nuevoEstado: 'PAGADA' | 'PAGO_PARCIAL';
        let saldoRemanente = 0;

        if (saldoDisponible >= exigible) {
          montoAplicado = exigible;
          nuevoEstado = 'PAGADA';
          saldoRemanente = 0;
          saldoDisponible = Number((saldoDisponible - exigible).toFixed(2));
        } else {
          montoAplicado = saldoDisponible;
          nuevoEstado = 'PAGO_PARCIAL';
          saldoRemanente = Number((exigible - saldoDisponible).toFixed(2));
          saldoDisponible = 0;
        }

        listosParaImputar++;
        montoTotalAConciliar = Number((montoTotalAConciliar + montoAplicado).toFixed(2));

        items.push({
          id_inmueble: inmueble.id_inmueble,
          clave_cliente: claveCliente,
          frentista: inmueble.frentista,
          fecha_pago: fechaPago,
          monto: montoAplicado,
          id_cuota: cuota.id_cuota,
          nro_cuota: cuota.nro_cuota,
          monto_cuota_actual: exigible,
          nuevo_estado: nuevoEstado,
          saldo_remanente: saldoRemanente,
          estado_preview: 'LISTO_PARA_IMPUTAR',
          motivo_error: null,
        });
      }

      if (saldoDisponible > 0.01) {
        conInconsistencias++;
        items.push({
          id_inmueble: inmueble.id_inmueble,
          clave_cliente: claveCliente,
          frentista: inmueble.frentista,
          fecha_pago: fechaPago,
          monto: saldoDisponible,
          id_cuota: null,
          nro_cuota: null,
          monto_cuota_actual: null,
          nuevo_estado: null,
          saldo_remanente: null,
          estado_preview: 'SIN_DEUDA',
          motivo_error: `Saldo excedente no aplicado: $${saldoDisponible} supera la totalidad de la deuda.`,
        });
      }
    }

    return {
      total_filas: items.length,
      listos_para_imputar: listosParaImputar,
      con_inconsistencias: conInconsistencias,
      monto_total_a_conciliar: montoTotalAConciliar,
      items,
    };
  }

  /**
   * PASO 2: Confirmación y persistencia en lote
   */
  async confirmarConciliacion(dto: ConfirmarConciliacionDTO): Promise<ConfirmacionResponseDTO> {
    if (!dto.pagosAImputar || dto.pagosAImputar.length === 0) {
      throw new Error('No se enviaron pagos para imputar.');
    }

    const detalles = await this.repo.imputarLoteTransaccional(dto.pagosAImputar);
    const montoTotalImputado = Number(
      detalles.reduce((acc, curr) => acc + curr.monto, 0).toFixed(2)
    );

    return {
      imputados_exitosamente: detalles.length,
      monto_total_imputado: montoTotalImputado,
      detalles,
    };
  }
}