import { ContratosRepository } from '../repositories/contratos.repository';
import { CreateContratoDTO, ContratoResponseDTO, CuotaInsertDTO } from '../types/contratos.types';

export class ContratosService {
  private repo: ContratosRepository;

  constructor() {
    this.repo = new ContratosRepository();
  }

  async emitirContrato(dto: CreateContratoDTO): Promise<ContratoResponseDTO> {
    // 1. Validaciones iniciales
    if (!dto.id_inmueble || !dto.plan_cuotas_obra || !dto.fecha_primer_vencimiento) {
      throw new Error(
        'Faltan campos obligatorios: id_inmueble, plan_cuotas_obra y fecha_primer_vencimiento son requeridos.'
      );
    }

    if (dto.plan_cuotas_obra <= 0) {
      throw new Error('El plan de cuotas de obra debe ser mayor a 0.');
    }

    // 2. Verificar existencia de inmueble
    const inmueble = await this.repo.getInmuebleConObra(dto.id_inmueble);
    if (!inmueble) {
      throw new Error(`No se encontró el inmueble con ID ${dto.id_inmueble}.`);
    }

    // 3. Evitar contratos duplicados sobre el mismo inmueble (Fail Fast)
    const contratoExistente = await this.repo.getContratoByInmuebleId(dto.id_inmueble);
    if (contratoExistente) {
      throw new Error(`El inmueble #${dto.id_inmueble} ya posee un contrato de financiación emitido.`);
    }

    // 4. Calcular costo total de obra y gabinete según catálogo
    const metros = Number(inmueble.metros_frente);
    const precioMetro = Number(inmueble.precio_x_metro);
    const costoGabineteCatalogo = Number(inmueble.costo_gabinete);

    const montoTotalObra = Number((metros * precioMetro).toFixed(2));

    let montoTotalGabinete: number | null = null;
    const planGabinete = dto.plan_cuotas_gabinete ? Number(dto.plan_cuotas_gabinete) : null;

    if (inmueble.conexion_gabinete && planGabinete && planGabinete > 0) {
      montoTotalGabinete = costoGabineteCatalogo;
    }

    // 5. Validaciones de Anticipo
    const anticipo = dto.monto_anticipo ? Number(dto.monto_anticipo) : 0;
    if (anticipo < 0) {
      throw new Error('El anticipo no puede ser un valor negativo.');
    }
    if (anticipo >= montoTotalObra) {
      throw new Error('El anticipo no puede ser igual o mayor al costo total de la obra.');
    }

    const cuotasParaGenerar: CuotaInsertDTO[] = [];
    const fechaVencimientoInicial = new Date(dto.fecha_primer_vencimiento);

    // 6. Generación de Cuota 0 (ANTICIPO) si corresponde
    if (anticipo > 0) {
      const montoAnticipo = Number(anticipo.toFixed(2));
      cuotasParaGenerar.push({
        id_contrato: 0, // Asignado en la transacción SQL del repositorio
        concepto: 'ANTICIPO',
        nro_cuota: 0,
        periodo: `${fechaVencimientoInicial.getFullYear()}-${String(
          fechaVencimientoInicial.getMonth() + 1
        ).padStart(2, '0')}`,
        monto_base: montoAnticipo,
        monto_actualizado: montoAnticipo,
        saldo_remanente: montoAnticipo,
        fecha_vencimiento: dto.fecha_primer_vencimiento,
        estado: 'PENDIENTE',
      });
    }

    // 7. Fraccionamiento del saldo financiado de RED_OBRA
    const saldoFinanciarObra = Number((montoTotalObra - anticipo).toFixed(2));
    const montoBaseObra = Number((saldoFinanciarObra / dto.plan_cuotas_obra).toFixed(2));

    for (let i = 1; i <= dto.plan_cuotas_obra; i++) {
      const fechaVenc = new Date(fechaVencimientoInicial);
      fechaVenc.setMonth(fechaVenc.getMonth() + (i - 1));

      cuotasParaGenerar.push({
        id_contrato: 0,
        concepto: 'RED_OBRA',
        nro_cuota: i,
        periodo: `${fechaVenc.getFullYear()}-${String(fechaVenc.getMonth() + 1).padStart(2, '0')}`,
        monto_base: montoBaseObra,
        monto_actualizado: montoBaseObra,
        saldo_remanente: montoBaseObra,
        fecha_vencimiento: fechaVenc.toISOString().split('T')[0],
        estado: 'PENDIENTE',
      });
    }

    // 8. Generación de cuotas de GABINETE (si aplica)
    if (montoTotalGabinete && planGabinete) {
      const montoBaseGabinete = Number((montoTotalGabinete / planGabinete).toFixed(2));
      for (let i = 1; i <= planGabinete; i++) {
        const fechaVenc = new Date(fechaVencimientoInicial);
        fechaVenc.setMonth(fechaVenc.getMonth() + (i - 1));

        cuotasParaGenerar.push({
          id_contrato: 0,
          concepto: 'GABINETE',
          nro_cuota: i,
          periodo: `${fechaVenc.getFullYear()}-${String(fechaVenc.getMonth() + 1).padStart(2, '0')}`,
          monto_base: montoBaseGabinete,
          monto_actualizado: montoBaseGabinete,
          saldo_remanente: montoBaseGabinete,
          fecha_vencimiento: fechaVenc.toISOString().split('T')[0],
          estado: 'PENDIENTE',
        });
      }
    }

    // 9. Persistencia transaccional
    const tipoIndexacionFinal = (dto.tipo_indexacion || 'ICC').toUpperCase().trim();

    return await this.repo.emitirContratoConCuotas(
      {
        id_inmueble: dto.id_inmueble,
        plan_cuotas_obra: dto.plan_cuotas_obra,
        monto_total_obra: montoTotalObra,
        plan_cuotas_gabinete: planGabinete,
        monto_total_gabinete: montoTotalGabinete,
        fecha_alta: new Date().toISOString().split('T')[0],
        tipo_indexacion: tipoIndexacionFinal,
      },
      cuotasParaGenerar
    );
  }
}