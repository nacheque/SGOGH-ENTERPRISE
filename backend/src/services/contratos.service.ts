import { ContratosRepository } from '../repositories/contratos.repository';
import { CreateContratoDTO, ContratoResponseDTO, CuotaInsertDTO } from '../types/contratos.types';

export class ContratosService {
  private repo: ContratosRepository;

  constructor() {
    this.repo = new ContratosRepository();
  }

  async emitirContrato(dto: CreateContratoDTO): Promise<ContratoResponseDTO> {
    // 1. Validaciones iniciales de presencia
    if (!dto.id_inmueble || !dto.plan_cuotas_obra || !dto.fecha_primer_vencimiento) {
      throw new Error(
        'Faltan campos obligatorios: id_inmueble, plan_cuotas_obra y fecha_primer_vencimiento son requeridos.'
      );
    }

    if (dto.plan_cuotas_obra <= 0) {
      throw new Error('El plan de cuotas de obra debe ser mayor a 0.');
    }

    const inmueble = await this.repo.getInmuebleConObra(dto.id_inmueble);
    if (!inmueble) {
      throw new Error(`No se encontró el inmueble con ID ${dto.id_inmueble}.`);
    }

    // 2. Validación de contrato existente
    const contratoExistente = await this.repo.getContratoByInmuebleId(dto.id_inmueble);
    if (contratoExistente) {
      throw new Error(`El inmueble #${dto.id_inmueble} ya posee un contrato de financiación emitido.`);
    }

    // 3. Costo total de obra y gabinete según catálogo
    const metros = Number(inmueble.metros_frente);
    const precioMetro = Number(inmueble.precio_x_metro);
    const costoGabineteCatalogo = Number(inmueble.costo_gabinete);

    const montoTotalObra = Number((metros * precioMetro).toFixed(2));

    let montoTotalGabinete: number | null = null;
    const planGabinete = dto.plan_cuotas_gabinete ? Number(dto.plan_cuotas_gabinete) : null;

    if (inmueble.conexion_gabinete && planGabinete && planGabinete > 0) {
      montoTotalGabinete = costoGabineteCatalogo;
    }

    // 4. Validación de Anticipo
    const anticipo = dto.monto_anticipo ? Number(dto.monto_anticipo) : 0;
    if (anticipo < 0) {
      throw new Error('El anticipo no puede ser negativo.');
    }
    if (anticipo >= montoTotalObra) {
      throw new Error('El anticipo no puede ser igual o superior al costo total de la obra.');
    }

    const cuotasParaGenerar: CuotaInsertDTO[] = [];
    const fechaVencimientoInicial = new Date(dto.fecha_primer_vencimiento);

    // 5. Generación de Cuota 0 (ANTICIPO) si corresponde
    if (anticipo > 0) {
      const periodoAnticipo = `${fechaVencimientoInicial.getFullYear()}-${String(
        fechaVencimientoInicial.getMonth() + 1
      ).padStart(2, '0')}`;
      const fechaVencAnticipoStr = fechaVencimientoInicial.toISOString().split('T')[0];

      cuotasParaGenerar.push({
        id_contrato: 0,
        concepto: 'ANTICIPO',
        nro_cuota: 0,
        periodo: periodoAnticipo,
        monto_base: anticipo,
        monto_actualizado: anticipo,
        fecha_vencimiento: fechaVencAnticipoStr,
        estado: 'PENDIENTE',
      });
    }

    // 6. Fraccionamiento del saldo financiado de RED_OBRA
    const saldoFinanciarObra = Number((montoTotalObra - anticipo).toFixed(2));
    const montoBaseObra = Number((saldoFinanciarObra / dto.plan_cuotas_obra).toFixed(2));

    for (let i = 1; i <= dto.plan_cuotas_obra; i++) {
      const fechaVenc = new Date(fechaVencimientoInicial);
      fechaVenc.setMonth(fechaVenc.getMonth() + (i - 1));

      const periodo = `${fechaVenc.getFullYear()}-${String(fechaVenc.getMonth() + 1).padStart(2, '0')}`;
      const fechaVencStr = fechaVenc.toISOString().split('T')[0];

      cuotasParaGenerar.push({
        id_contrato: 0,
        concepto: 'RED_OBRA',
        nro_cuota: i,
        periodo,
        monto_base: montoBaseObra,
        monto_actualizado: montoBaseObra,
        fecha_vencimiento: fechaVencStr,
        estado: 'PENDIENTE',
      });
    }

    // 7. Generación de cuotas de GABINETE (si aplica)
    if (montoTotalGabinete && planGabinete) {
      const montoBaseGabinete = Number((montoTotalGabinete / planGabinete).toFixed(2));
      for (let i = 1; i <= planGabinete; i++) {
        const fechaVenc = new Date(fechaVencimientoInicial);
        fechaVenc.setMonth(fechaVenc.getMonth() + (i - 1));

        const periodo = `${fechaVenc.getFullYear()}-${String(fechaVenc.getMonth() + 1).padStart(2, '0')}`;
        const fechaVencStr = fechaVenc.toISOString().split('T')[0];

        cuotasParaGenerar.push({
          id_contrato: 0,
          concepto: 'GABINETE',
          nro_cuota: i,
          periodo,
          monto_base: montoBaseGabinete,
          monto_actualizado: montoBaseGabinete,
          fecha_vencimiento: fechaVencStr,
          estado: 'PENDIENTE',
        });
      }
    }

    // 8. Persistencia atómica
    const tipoIndexacionFinal = dto.tipo_indexacion ? dto.tipo_indexacion.toUpperCase().trim() : 'ICC';

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