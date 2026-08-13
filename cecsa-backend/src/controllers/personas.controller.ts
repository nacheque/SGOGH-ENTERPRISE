import { Request, Response, NextFunction } from 'express';
import { PersonasRepository } from '../repositories/personas.repository';

const repo = new PersonasRepository();

// GET /api/v1/personas (permite ?search=filtro)
export const getPersonas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const personas = await repo.findAll(search);
    res.status(200).json({ status: 'success', data: personas });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/personas
export const createPersona = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre_completo } = req.body;

    if (!nombre_completo) {
      return res.status(400).json({
        status: 'error',
        message: 'El campo "nombre_completo" es obligatorio.',
      });
    }

    const nuevaPersona = await repo.create(req.body);
    res.status(201).json({ status: 'success', data: nuevaPersona });
  } catch (error) {
    next(error);
  }
};