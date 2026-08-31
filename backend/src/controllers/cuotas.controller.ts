import { Request, Response, NextFunction } from 'express';
import { PagosService } from '../services/pagos.service';

const pagosService = new PagosService();

export const getCuotasByInmueble = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_inmueble } = req.params;
    const cuotas = await pagosService.listarCuotasPorInmueble(Number(id_inmueble));

    res.status(200).json({
      status: 'success',
      data: cuotas,
    });
  } catch (error: any) {
    if (error.message && error.message.includes('debe ser un número')) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};