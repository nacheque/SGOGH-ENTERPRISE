import { Request, Response, NextFunction } from 'express';
import { InmueblesRepository } from '../repositories/inmuebles.repository';
import { InmueblesService } from '../services/inmuebles.service';

const inmueblesRepo = new InmueblesRepository();

export const getInmuebles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inmuebles = await inmueblesRepo.getAll();
    res.status(200).json({
      status: 'success',
      data: inmuebles,
    });
  } catch (error) {
    next(error);
  }
};

export const createInmueble = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      clave_cliente,
      id_obra,
      id_frentista,
      id_titular,
      calle,
      numero,
      manzana,
      lote_catast_muni,
      lote_catast_provincia,
      metros_frente,
      conexion_gabinete,
      gabinete_colocado,
      observacion,
    } = req.body;

    if (!clave_cliente || !id_obra || !calle || metros_frente === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Faltan campos obligatorios: clave_cliente, id_obra, calle y metros_frente son requeridos.',
      });
    }

    const nuevoInmueble = await inmueblesRepo.create({
      clave_cliente,
      id_obra: Number(id_obra),
      id_frentista: id_frentista ? Number(id_frentista) : null,
      id_titular: id_titular ? Number(id_titular) : null,
      calle,
      numero,
      manzana,
      lote_catast_muni,
      lote_catast_provincia,
      metros_frente: Number(metros_frente),
      conexion_gabinete: Boolean(conexion_gabinete),
      gabinete_colocado: Boolean(gabinete_colocado),
      observacion,
    });

    res.status(201).json({
      status: 'success',
      data: nuevoInmueble,
    });
  } catch (error) {
    next(error);
  }
};

const inmueblesService = new InmueblesService();

export const createInmuebleConPersonas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const idObra = Number(id);

    const nuevoInmueble = await inmueblesService.registrarInmuebleConPersonas(idObra, req.body);

    res.status(201).json({
      status: 'success',
      message: 'Inmueble y personas asociadas registrados exitosamente.',
      data: nuevoInmueble,
    });
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes('obligatorio') ||
        error.message.includes('mayor a 0') ||
        error.message.includes('No se encontró la obra') ||
        error.message.includes('válido'))
    ) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
    next(error);
  }
};