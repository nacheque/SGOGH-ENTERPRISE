import { Request, Response, NextFunction } from 'express';
import { PlanesImportService } from '../services/planesImport.service';
import { ConfirmarPlanesImportDTO } from '../types/planesImport.type';

export class PlanesImportController {
  constructor(private planesImportService: PlanesImportService) {}

  previewImportacion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const idObra = parseInt(idParam, 10);

      if (isNaN(idObra) || idObra <= 0) {
        res.status(400).json({ status: 'error', message: 'ID de obra inválido.' });
        return;
      }

      if (!req.file || !req.file.buffer) {
        res.status(400).json({ status: 'error', message: 'Debe adjuntar un archivo Excel (.xlsx / .xls).' });
        return;
      }

      const result = await this.planesImportService.procesarPreview(idObra, req.file.buffer);

      res.status(200).json({
        status: 'success',
        message: 'Previsualización de planes de pago generada exitosamente.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  confirmarImportacion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const idObra = parseInt(idParam, 10);

      if (isNaN(idObra) || idObra <= 0) {
        res.status(400).json({ status: 'error', message: 'ID de obra inválido.' });
        return;
      }

      const body: ConfirmarPlanesImportDTO = req.body;
      if (!body.filas || !Array.isArray(body.filas) || body.filas.length === 0) {
        res.status(400).json({
          status: 'error',
          message: "El payload debe contener un arreglo 'filas' con al menos un elemento.",
        });
        return;
      }

      const result = await this.planesImportService.confirmarImportacion(idObra, body.filas);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        status: 'error',
        message: err.message || 'Error durante la confirmación de planes.',
      });
    }
  };
}