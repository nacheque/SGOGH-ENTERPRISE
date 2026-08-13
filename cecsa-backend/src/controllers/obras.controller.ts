import { Request, Response, NextFunction } from 'express';
import { ObrasRepository } from '../repositories/obras.repository';

const repo = new ObrasRepository();

// GET /api/v1/obras
export const getObras = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const obras = await repo.findAll();
    res.status(200).json({ status: 'success', data: obras });
  } catch (error) {
    next(error); // Delega el error al errorHandler centralizado
  }
};

// POST /api/v1/obras
export const createObra = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre_obra, precio_x_metro } = req.body;

    // Validación básica de campos requeridos por la tabla
    if (!nombre_obra || precio_x_metro === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Los campos "nombre_obra" y "precio_x_metro" son obligatorios.',
      });
    }

    const nuevaObra = await repo.create(req.body);
    res.status(201).json({ status: 'success', data: nuevaObra });
  } catch (error) {
    next(error);
  }
};