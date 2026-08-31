import { Request, Response, NextFunction } from 'express';
import { ContratosService } from '../services/contratos.service';

const contratosService = new ContratosService();

export const createContrato = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      id_inmueble,
      plan_cuotas_obra,
      plan_cuotas_gabinete,
      tipo_indexacion,
      fecha_primer_vencimiento,
    } = req.body;

    const contrato = await contratosService.emitirContrato({
      id_inmueble: Number(id_inmueble),
      plan_cuotas_obra: Number(plan_cuotas_obra),
      plan_cuotas_gabinete: plan_cuotas_gabinete ? Number(plan_cuotas_gabinete) : null,
      tipo_indexacion,
      fecha_primer_vencimiento,
    });

    res.status(201).json({
      status: 'success',
      message: `Contrato emitido exitosamente con ${contrato.cuotas_generadas} cuotas planificadas.`,
      data: contrato,
    });
  } catch (error: any) {
    if (error.message && (error.message.includes('Faltan') || error.message.includes('No se encontró') || error.message.includes('mayor a 0'))) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};