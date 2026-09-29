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

  getReciboDatos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idPago = Number(req.params.id_pago);

      if (isNaN(idPago) || idPago <= 0) {
        res.status(400).json({ error: 'El parámetro id_pago debe ser un número entero positivo' });
        return;
      }

      const data = await this.pagosService.obtenerDatosRecibo(idPago);

      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error: any) {
      if (error.statusCode === 404 || error.message === 'Pago no encontrado') {
        res.status(404).json({ error: 'Pago no encontrado' });
        return;
      }
      next(error);
    }
  };

  actualizarEstadoCheque = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idPago = Number(req.params.id);

      if (isNaN(idPago) || idPago <= 0) {
        res.status(400).json({ status: 'error', message: 'El ID del cheque debe ser un número entero positivo válido' });
        return;
      }

      const { estado, fecha_deposito } = req.body;

      const chequeActualizado = await this.pagosService.actualizarEstadoCheque(
        idPago,
        estado,
        fecha_deposito
      );

      res.status(200).json({
        status: 'success',
        data: chequeActualizado,
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        res.status(404).json({ status: 'error', message: error.message });
        return;
      }
      if (error.statusCode === 400) {
        res.status(400).json({ status: 'error', message: error.message });
        return;
      }
      next(error);
    }
  };
}

export const pagosController = new PagosController();