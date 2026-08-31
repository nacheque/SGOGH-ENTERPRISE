import { Request, Response, NextFunction } from 'express';
import { PagosService } from '../services/pagos.service';

const pagosService = new PagosService();

export const createPago = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_cuota, monto, fecha_pago, medio_pago, comprobante } = req.body;

    const nuevoPago = await pagosService.procesarPago({
      id_cuota,
      monto,
      fecha_pago,
      medio_pago,
      comprobante,
    });

    res.status(201).json({
      status: 'success',
      message: `Pago registrado e imputado exitosamente para la cuota #${id_cuota}.`,
      data: nuevoPago,
    });
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes('ya se encuentra registrada') ||
        error.message.includes('No se encontró') ||
        error.message.includes('Faltan') ||
        error.message.includes('mayor a 0'))
    ) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};