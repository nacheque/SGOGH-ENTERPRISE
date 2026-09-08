import { Request, Response, NextFunction } from 'express';
import { ObrasRepository } from '../repositories/obras.repository';

const obrasRepo = new ObrasRepository();

export const getObras = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const obras = await obrasRepo.getAll();
    res.status(200).json({
      status: 'success',
      data: obras,
    });
  } catch (error) {
    next(error);
  }
};

export const createObra = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre_obra, ubicacion, precio_x_metro, costo_gabinete, anio, estado } = req.body;

    if (!nombre_obra || precio_x_metro === undefined || costo_gabinete === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Los campos nombre_obra, precio_x_metro y costo_gabinete son obligatorios.',
      });
    }

    const nuevaObra = await obrasRepo.create({
      nombre_obra,
      ubicacion,
      precio_x_metro: Number(precio_x_metro),
      costo_gabinete: Number(costo_gabinete),
      anio: anio ? Number(anio) : null,
      estado,
    });

    res.status(201).json({
      status: 'success',
      data: nuevaObra,
    });
  } catch (error) {
    next(error);
  }
};

export const getPadronByObra = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const idObra = Number(id);

    if (isNaN(idObra)) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro "id" debe ser un valor numérico válido.',
      });
    }

    const padron = await obrasRepo.getPadronByObraId(idObra);

    res.status(200).json({
      status: 'success',
      data: padron,
    });
  } catch (error) {
    next(error);
  }
};