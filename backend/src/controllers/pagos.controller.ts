import { Request, Response, NextFunction } from 'express';
import { PagosService } from '../services/pagos.service';

export class PagosController {

  private pagosService: PagosService;
  constructor() {
    this.pagosService = new PagosService();
  }

  createPago = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nuevoPago = await this.pagosService.procesarPago(req.body);

      res.status(201).json({
        status: 'success',
        message: `Pago registrado e imputado exitosamente para la cuota #${nuevoPago.id_cuota || req.body.id_cuota}.`,
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

  async getCarteraCheques(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idObra = req.query.id_obra ? Number(req.query.id_obra) : null;
      const estadoCustodia = req.query.estado_custodia ? String(req.query.estado_custodia) : null;

      const cartera = await this.pagosService.obtenerCarteraCheques(idObra, estadoCustodia);

      res.status(200).json({
        status: 'success',
        total: cartera.length,
        data: cartera,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const pagosController = new PagosController();