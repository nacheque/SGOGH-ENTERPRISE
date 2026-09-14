import { Request, Response, NextFunction } from 'express';
import { ConciliacionesService } from '../services/conciliaciones.service';

const conciliacionesService = new ConciliacionesService();

export const previewRoela = async (
  req: Request & { file?: { buffer: Buffer; [key: string]: any } },
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Debe adjuntar un archivo .xls o .xlsx bajo el campo multipart "archivo".',
      });
    }

    const preview = await conciliacionesService.simularConciliacionRoela(req.file.buffer);

    res.status(200).json({
      status: 'success',
      message: 'Simulación de conciliación SIRO Roela generada exitosamente.',
      data: preview,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmarRoela = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pagosAImputar } = req.body;

    if (!pagosAImputar || !Array.isArray(pagosAImputar) || pagosAImputar.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'El body debe contener un arreglo "pagosAImputar" no vacío.',
      });
    }

    const resultado = await conciliacionesService.confirmarConciliacion({ pagosAImputar });

    res.status(200).json({
      status: 'success',
      message: `Se imputaron ${resultado.imputados_exitosamente} pagos correctamente.`,
      data: resultado,
    });
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes('no existe') ||
        error.message.includes('ya se encuentra totalmente abonada') ||
        error.message.includes('No se enviaron'))
    ) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};