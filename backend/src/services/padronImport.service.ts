import * as XLSX from 'xlsx';
import {
  PadronImportItemDTO,
  PreviewImportPadronResponseDTO,
  ConfirmarImportPadronResponseDTO,
} from '../types/padronImport.types';
import { PadronImportRepository } from '../repositories/padronImport.repository';

export class PadronImportService {
  constructor(private repo: PadronImportRepository) {}

  private normalizarTexto(txt: any): string {
    if (txt === null || txt === undefined) return '';
    return String(txt)
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_.\-\/\r\n]+/g, '')
      .toUpperCase();
  }

  private limpiarValorString(val: any): string | null {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') {
      return Math.trunc(val).toString();
    }
    const str = String(val).trim();
    if (/^\d+\.0+$/.test(str)) {
      return str.split('.')[0];
    }
    return str || null;
  }

  private parseBoolean(val: any): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val === 1;
    if (!val) return false;
    const str = String(val).trim().toUpperCase();
    return ['SI', 'S', '1', 'TRUE', 'VERDADERO'].includes(str);
  }

  private parseNumber(val: any): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/\./g, '').replace(',', '.').trim();
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  }

  async simularImportacion(idObra: number, fileBuffer: Buffer): Promise<PreviewImportPadronResponseDTO> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, raw: true });

    if (rawRows.length < 2) {
      throw new Error('La planilla no contiene suficientes filas de datos.');
    }

    // 1. Detección de cabecera buscando 'ID-CLIENTE'
    let headerIndex = -1;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const rowNorm = (rawRows[i] || []).map((c) => this.normalizarTexto(c));
      if (rowNorm.some((col) => col.includes('IDCLIENTE'))) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error("No se encontró la fila de encabezados con la columna 'ID-CLIENTE'.");
    }

    const headers = rawRows[headerIndex].map((h) => this.normalizarTexto(h));
    const findIndex = (terms: string[]) => headers.findIndex((h) => terms.some((t) => h.includes(t)));

    // Mapeo directo y exacto de las columnas del archivo oficial
    const colIdCliente = findIndex(['IDCLIENTE']);
    const colTitularLote = findIndex(['TITULARDELLOTE', 'TITULARLOTE']);
    const colMetros = findIndex(['METROS']);
    const colCalle = findIndex(['CALLE']);
    const colAltura = findIndex(['ALTURA']);
    const colLoteMuni = findIndex(['LOTESCATASTROMUN', 'LOTEMUN']);
    const colLoteProv = findIndex(['LOTESCATASTROPROVINCIA', 'LOTEPROV']);
    const colMz = findIndex(['MZ']);
    const colObser = findIndex(['OBSER']);
    const colConexGab = findIndex(['CONEXGABINETE']);
    const colGabColoc = findIndex(['GABINETECOLOC']);
    const colTitularServicio = findIndex(['TITULARSERVICIO']);
    const colEmail = findIndex(['CORREOELECTRONICO', 'EMAIL']);
    const colDni = findIndex(['DNI']);
    const colCuil = findIndex(['CUIL', 'CUIT']);
    const colTelefono = findIndex(['TELEFONO']);

    const clavesEnObra = await this.repo.findClavesExistentesByObraId(idObra);
    const clavesEnArchivo = new Set<string>();

    const items: PadronImportItemDTO[] = [];
    let validos = 0;
    let conErrores = 0;

    const dataRows = rawRows.slice(headerIndex + 1);

    for (let idx = 0; idx < dataRows.length; idx++) {
      const row = dataRows[idx];
      if (!row || row.length === 0 || row.every((c) => c === null || c === '')) continue;

      const rawClave = colIdCliente !== -1 ? row[colIdCliente] : null;
      const claveCliente = this.limpiarValorString(rawClave);

      // Omitir filas sin ID-CLIENTE (como esquinas secundarias o renglones vacíos)
      if (!claveCliente) continue;

      const nroFila = headerIndex + idx + 2;
      const metrosFrente = colMetros !== -1 ? this.parseNumber(row[colMetros]) : 0;
      const titularLote = colTitularLote !== -1 && row[colTitularLote] ? String(row[colTitularLote]).trim() : null;
      const titularServicio = colTitularServicio !== -1 && row[colTitularServicio] ? String(row[colTitularServicio]).trim() : null;

      const item: PadronImportItemDTO = {
        fila_excel: nroFila,
        clave_cliente: claveCliente,
        frentista_nombre: titularLote,
        titular_nombre: titularServicio,
        metros_frente: metrosFrente,
        calle: colCalle !== -1 && row[colCalle] ? String(row[colCalle]).trim() : null,
        numero: colAltura !== -1 ? this.limpiarValorString(row[colAltura]) : null,
        lote_catast_muni: colLoteMuni !== -1 && row[colLoteMuni] !== undefined ? this.limpiarValorString(row[colLoteMuni]) : null,
        lote_catast_provincia: colLoteProv !== -1 && row[colLoteProv] !== undefined ? this.limpiarValorString(row[colLoteProv]) : null,
        manzana: colMz !== -1 && row[colMz] !== undefined ? this.limpiarValorString(row[colMz]) : null,
        observacion: colObser !== -1 && row[colObser] ? String(row[colObser]).trim() : null,
        conexion_gabinete: colConexGab !== -1 ? this.parseBoolean(row[colConexGab]) : false,
        gabinete_colocado: colGabColoc !== -1 ? this.parseBoolean(row[colGabColoc]) : false,
        titular_email: colEmail !== -1 && row[colEmail] ? String(row[colEmail]).trim() : null,
        titular_dni: colDni !== -1 ? this.limpiarValorString(row[colDni]) : null,
        titular_cuit: colCuil !== -1 ? this.limpiarValorString(row[colCuil]) : null,
        titular_telefono: colTelefono !== -1 ? this.limpiarValorString(row[colTelefono]) : null,
        estado_validacion: 'LISTO',
        motivo_rechazo: null,
      };

      // Validaciones Dry-run
      const tieneNombre = Boolean(titularServicio || titularLote);

      if (!claveCliente || metrosFrente <= 0 || !tieneNombre) {
        item.estado_validacion = 'DATOS_INVALIDOS';
        item.motivo_rechazo = 'Faltan datos mínimos (requiere ID-CLIENTE, METROS > 0 y al menos Titular del Servicio o Titular del Lote).';
        conErrores++;
      } else if (clavesEnArchivo.has(claveCliente)) {
        item.estado_validacion = 'DUPLICADO_EN_EXCEL';
        item.motivo_rechazo = `El ID-CLIENTE '${claveCliente}' se encuentra duplicado en el archivo.`;
        conErrores++;
      } else if (clavesEnObra.has(claveCliente)) {
        item.estado_validacion = 'CLAVE_YA_EXISTE_EN_OBRA';
        item.motivo_rechazo = `El ID-CLIENTE '${claveCliente}' ya está registrado en esta obra.`;
        conErrores++;
      } else {
        clavesEnArchivo.add(claveCliente);
        validos++;
      }

      items.push(item);
    }

    return {
      total_filas: items.length,
      validos,
      con_errores: conErrores,
      items,
    };
  }

  async confirmarImportacion(idObra: number, items: PadronImportItemDTO[]): Promise<ConfirmarImportPadronResponseDTO> {
    if (!items || items.length === 0) {
      throw new Error('La lista de inmuebles a imputar no contiene registros.');
    }

    const totalInsertados = await this.repo.importarLoteInmuebles(idObra, items);

    return {
      ok: true,
      mensaje: 'Padrón importado exitosamente.',
      total_insertados: totalInsertados,
    };
  }
}