import { Request, Response, NextFunction } from 'express';
import { IndicesRepository } from '../repositories/indices.repository';

const indicesRepo = new IndicesRepository();

export const getIndices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_obra } = req.query;

    if (!id_obra || isNaN(Number(id_obra))) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro de consulta "id_obra" es obligatorio y debe ser numérico.',
      });
    }

    const indices = await indicesRepo.getByObra(Number(id_obra));

    res.status(200).json({
      status: 'success',
      data: indices,
    });
  } catch (error) {
    next(error);
  }
};

export const createIndice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_obra, periodo, porcentaje_variacion } = req.body;

    if (!id_obra || !periodo || porcentaje_variacion === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Faltan campos obligatorios: id_obra, periodo (YYYY-MM) y porcentaje_variacion son requeridos.',
      });
    }

    // Validación de formato YYYY-MM
    const regexPeriodo = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!regexPeriodo.test(periodo)) {
      return res.status(400).json({
        status: 'error',
        message: 'El formato del período debe ser estrictamente YYYY-MM (ej: 2026-02).',
      });
    }

    if (isNaN(Number(porcentaje_variacion))) {
      return res.status(400).json({
        status: 'error',
        message: 'El campo "porcentaje_variacion" debe ser un número válido.',
      });
    }

    const resultado = await indicesRepo.createAndApplyIndice({
      id_obra: Number(id_obra),
      periodo,
      porcentaje_variacion: Number(porcentaje_variacion),
    });

    res.status(201).json({
      status: 'success',
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};