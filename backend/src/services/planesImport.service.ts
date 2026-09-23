import * as xlsx from 'xlsx';
import { PlanesImportRepository } from '../repositories/planesImport.repository';
import {
  PlanesPreviewResponseDTO,
  PlanImportItemPreviewDTO,
  FilaPlanConfirmarDTO,
  ConfirmarPlanesResponseDTO,
  TipoContrato,
} from '../types/planesImport.type';

export class PlanesImportService {
  constructor(private planesImportRepo: PlanesImportRepository) {}

  private normalizarTexto(txt: any): string {
    if (txt === null || txt === undefined) return '';
    return String(txt)
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_.\-\/\r\n]+/g, '')
      .toUpperCase();
  }

  private formatearFecha(val: any): string | null {
    if (!val) return null;

    if (typeof val === 'number') {
      const parsedDate = xlsx.SSF.parse_date_code(val);
      if (parsedDate) {
        const y = parsedDate.y;
        const m = String(parsedDate.m).padStart(2, '0');
        const d = String(parsedDate.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }

    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString().split('T')[0];
    }

    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    const partes = str.split(/[\/\-]/);
    if (partes.length === 3 && partes[2].length === 4) {
      const d = partes[0].padStart(2, '0');
      const m = partes[1].padStart(2, '0');
      const y = partes[2];
      return `${y}-${m}-${d}`;
    }

    const timestamp = Date.parse(str);
    if (!isNaN(timestamp)) {
      return new Date(timestamp).toISOString().split('T')[0];
    }

    return null;
  }

  public sumarMeses(fechaStr: string, meses: number): string {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setMonth(date.getMonth() + meses);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Simulación y validación en memoria (Dry-run)
   */
  async procesarPreview(idObra: number, buffer: Buffer): Promise<PlanesPreviewResponseDTO> {
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: false });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawRows || rawRows.length === 0) {
      throw new Error('El archivo Excel provisto está vacío.');
    }

    // Detección dinámica del encabezado
    let headerIndex = -1;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const rowNorm = (rawRows[i] || []).map((c) => this.normalizarTexto(c));
      if (rowNorm.some((col) => col.includes('IDCLIENTE'))) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error("No se encontró la fila de encabezados con la columna 'ID_CLIENTE'.");
    }

    const headers = rawRows[headerIndex].map((h) => this.normalizarTexto(h));
    const findIndex = (terms: string[]) => headers.findIndex((h) => terms.some((t) => h.includes(t)));

    const colIdCliente = findIndex(['IDCLIENTE']);
    const colCalle = findIndex(['CALLE']);
    const colAltura = findIndex(['ALTURA']);
    const colTipoContrato = findIndex(['TIPOCONTRATO']);
    const colMontoAnticipo = findIndex(['MONTOANTICIPO', 'ANTICIPO']);
    const colFechaVenc = findIndex(['FECHAPRIMERVENCIMIENTO', 'FECHAINICIO', 'PRIMERVENCIMIENTO']);
    const colCuotasObra = findIndex(['CUOTASOBRA', 'PLANOBRA']);
    const colCuotasGabinete = findIndex(['CUOTASGABINETE', 'PLANGABINETE']);

    const items: PlanImportItemPreviewDTO[] = [];
    const clavesProcesadas = new Set<string>();

    for (let r = headerIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0) continue;

      const rawIdCliente = row[colIdCliente];
      if (rawIdCliente === null || rawIdCliente === undefined || String(rawIdCliente).trim() === '') {
        continue;
      }

      const claveCliente = String(rawIdCliente).trim().replace(/\.0+$/, '');
      const filaExcel = r + 1;

      const rawCalle = colCalle !== -1 ? String(row[colCalle] || '').trim() : '';
      const rawAltura = colAltura !== -1 ? String(row[colAltura] || '').trim() : '';
      const domicilioExcel = [rawCalle, rawAltura].filter(Boolean).join(' ') || undefined;

      const tipoContratoRaw = colTipoContrato !== -1 ? this.normalizarTexto(row[colTipoContrato]) : '';
      const tipoContrato: TipoContrato = tipoContratoRaw.includes('FIJO') ? 'FIJO' : 'VARIABLE_ICC';

      const montoAnticipo = colMontoAnticipo !== -1 ? Number(row[colMontoAnticipo]) || 0 : 0;
      const fechaInicioStr = colFechaVenc !== -1 ? this.formatearFecha(row[colFechaVenc]) : null;

      const planCuotasObra = colCuotasObra !== -1 ? parseInt(String(row[colCuotasObra]), 10) || 0 : 0;
      const planCuotasGabinete = colCuotasGabinete !== -1 ? parseInt(String(row[colCuotasGabinete]), 10) || 0 : 0;

      // 1. Duplicado en Excel
      if (clavesProcesadas.has(claveCliente)) {
        items.push({
          fila_excel: filaExcel,
          clave_cliente: claveCliente,
          tipo_contrato: tipoContrato,
          monto_anticipo: montoAnticipo,
          fecha_inicio: fechaInicioStr || '',
          plan_cuotas_obra: planCuotasObra,
          monto_total_obra: 0,
          plan_cuotas_gabinete: planCuotasGabinete,
          monto_total_gabinete: 0,
          discrepancia_domicilio: false,
          estado: 'DUPLICADO_EN_EXCEL',
          motivo_rechazo: 'La clave cliente aparece repetida en la planilla.',
        });
        continue;
      }
      clavesProcesadas.add(claveCliente);

      // 2. Consulta al Repositorio
      const inm = await this.planesImportRepo.obtenerInmuebleParaPreview(idObra, claveCliente);
      if (!inm) {
        items.push({
          fila_excel: filaExcel,
          clave_cliente: claveCliente,
          tipo_contrato: tipoContrato,
          monto_anticipo: montoAnticipo,
          fecha_inicio: fechaInicioStr || '',
          plan_cuotas_obra: planCuotasObra,
          monto_total_obra: 0,
          plan_cuotas_gabinete: planCuotasGabinete,
          monto_total_gabinete: 0,
          discrepancia_domicilio: false,
          estado: 'CLAVE_NO_EXISTE',
          motivo_rechazo: `No existe un lote con la clave '${claveCliente}' en esta obra.`,
        });
        continue;
      }

      const domicilioSistema = [inm.calle, inm.numero].filter(Boolean).join(' ') || undefined;

      // 3. Verificación de contrato previo
      const yaTieneContrato = await this.planesImportRepo.existeContratoParaInmueble(inm.id_inmueble);
      if (yaTieneContrato) {
        items.push({
          fila_excel: filaExcel,
          clave_cliente: claveCliente,
          id_inmueble: inm.id_inmueble,
          titular_nombre: inm.titular_nombre || undefined,
          domicilio_sistema: domicilioSistema,
          domicilio_excel: domicilioExcel,
          discrepancia_domicilio: false,
          tipo_contrato: tipoContrato,
          monto_anticipo: montoAnticipo,
          fecha_inicio: fechaInicioStr || '',
          plan_cuotas_obra: planCuotasObra,
          monto_total_obra: 0,
          plan_cuotas_gabinete: planCuotasGabinete,
          monto_total_gabinete: 0,
          estado: 'PLAN_YA_EXISTE',
          motivo_rechazo: 'El lote ya posee un contrato emitido.',
        });
        continue;
      }

      // 4. Validación de datos numéricos y fecha
      const errores: string[] = [];
      if (planCuotasObra <= 0) errores.push('Las cuotas de obra deben ser mayores a 0.');
      if (montoAnticipo < 0) errores.push('El anticipo no puede ser negativo.');
      if (!fechaInicioStr) errores.push('Fecha de primer vencimiento inválida o vacía.');

      // Regla de Negocio: Coherencia Catastral vs Cuotas de Gabinete
      const tieneConexionGabinete = Boolean(inm.conexion_gabinete);

      if (tieneConexionGabinete && planCuotasGabinete <= 0) {
        errores.push('Requiere conexión a gabinete: las cuotas de gabinete deben ser al menos 1.');
      } else if (!tieneConexionGabinete && planCuotasGabinete > 0) {
        errores.push('El inmueble no posee conexión a gabinete configurada en el padrón.');
      }

      if (errores.length > 0) {
        items.push({
          fila_excel: filaExcel,
          clave_cliente: claveCliente,
          id_inmueble: inm.id_inmueble,
          titular_nombre: inm.titular_nombre || undefined,
          domicilio_sistema: domicilioSistema,
          domicilio_excel: domicilioExcel,
          discrepancia_domicilio: false,
          tipo_contrato: tipoContrato,
          monto_anticipo: montoAnticipo,
          fecha_inicio: fechaInicioStr || '',
          plan_cuotas_obra: planCuotasObra,
          monto_total_obra: 0,
          plan_cuotas_gabinete: planCuotasGabinete,
          monto_total_gabinete: 0,
          estado: 'DATOS_INVALIDOS',
          motivo_rechazo: errores.join(' '),
        });
        continue;
      }

      // Advertencia no bloqueante por discrepancia de domicilio
      let discrepanciaDomicilio = false;
      if (rawCalle && inm.calle) {
        discrepanciaDomicilio = this.normalizarTexto(rawCalle) !== this.normalizarTexto(inm.calle);
      }

      // Proyecciones automáticas
      const metrosFrente = Number(inm.metros_frente) || 0;
      const precioXMetro = Number(inm.precio_x_metro) || 0;
      const costoGabinete = Number(inm.costo_gabinete) || 0;

      const montoTotalObra = Number((metrosFrente * precioXMetro).toFixed(2));
      const montoTotalGabinete = planCuotasGabinete > 0 ? Number(costoGabinete.toFixed(2)) : 0;

      items.push({
        fila_excel: filaExcel,
        clave_cliente: claveCliente,
        id_inmueble: inm.id_inmueble,
        titular_nombre: inm.titular_nombre || undefined,
        domicilio_sistema: domicilioSistema,
        domicilio_excel: domicilioExcel,
        discrepancia_domicilio: discrepanciaDomicilio,
        tipo_contrato: tipoContrato,
        monto_anticipo: montoAnticipo,
        fecha_inicio: fechaInicioStr!,
        plan_cuotas_obra: planCuotasObra,
        monto_total_obra: montoTotalObra,
        plan_cuotas_gabinete: planCuotasGabinete,
        monto_total_gabinete: montoTotalGabinete,
        estado: 'LISTO',
      });
    }

    const validos = items.filter((i) => i.estado === 'LISTO').length;
    return {
      total_filas: items.length,
      validos,
      con_observaciones: items.length - validos,
      items,
    };
  }

  /**
   * Ejecuta la confirmación transaccional delegándola al repositorio
   */
  async confirmarImportacion(idObra: number, filas: FilaPlanConfirmarDTO[]): Promise<ConfirmarPlanesResponseDTO> {
    return this.planesImportRepo.confirmarPlanesTx(idObra, filas, this.sumarMeses.bind(this));
  }
}