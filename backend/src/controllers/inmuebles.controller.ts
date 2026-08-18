import { Request, Response, NextFunction } from 'express';
import { InmueblesRepository } from '../repositories/inmuebles.repository';

const repo = new InmueblesRepository();

// GET /api/v1/inmuebles
export const getInmuebles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inmuebles = await repo.findAll();
    res.status(200).json({ status: 'success', data: inmuebles });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/inmuebles
export const createInmueble = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_obra, metros_frente } = req.body;

    if (!id_obra || metros_frente === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Los campos "id_obra" y "metros_frente" son obligatorios.',
      });
    }

    const nuevoInmueble = await repo.create(req.body);
    res.status(201).json({ status: 'success', data: nuevoInmueble });
  } catch (error) {
    next(error);
  }
};