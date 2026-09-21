import { Request, Response, NextFunction } from 'express';
import { PadronImportService } from '../services/padronImport.service';
import { ConfirmarImportPadronRequestDTO } from '../types/padronImport.types';

export class PadronImportController {
  constructor(private service: PadronImportService) {}

  previewImportacion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idObra = parseInt(req.params.id as string, 10);
      if (isNaN(idObra) || idObra <= 0) {
        res.status(400).json({ status: 'error', message: 'ID de obra inválido.' });
        return;
      }

      if (!req.file || !req.file.buffer) {
        res.status(400).json({ status: 'error', message: 'No se envió el archivo requerido en el campo "archivo".' });
        return;
      }

      const preview = await this.service.simularImportacion(idObra, req.file.buffer);

      res.status(200).json({
        status: 'success',
        message: 'Previsualización del padrón generada exitosamente.',
        data: preview,
      });
    } catch (err: any) {
      next(err);
    }
  };

  confirmarImportacion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idObra = parseInt(req.params.id as string, 10);
      if (isNaN(idObra) || idObra <= 0) {
        res.status(400).json({ status: 'error', message: 'ID de obra inválido.' });
        return;
      }

      const body: ConfirmarImportPadronRequestDTO = req.body;
      if (!body.inmueblesAImputar || !Array.isArray(body.inmueblesAImputar)) {
        res.status(400).json({ status: 'error', message: 'Formato inválido. Se espera el arreglo "inmueblesAImputar".' });
        return;
      }

      const resultado = await this.service.confirmarImportacion(idObra, body.inmueblesAImputar);

      res.status(200).json({
        status: 'success',
        data: resultado,
      });
    } catch (err: any) {
      next(err);
    }
  };
}