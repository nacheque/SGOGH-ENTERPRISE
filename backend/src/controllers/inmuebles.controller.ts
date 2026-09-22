import { Request, Response, NextFunction } from 'express';
import { InmueblesRepository, AppError } from '../repositories/inmuebles.repository';
import { InmueblesService } from '../services/inmuebles.service';
import { CreateInmuebleDTO, CreateInmuebleConPersonasDTO, UpdateInmuebleDTO } from '../types/inmueble.types';

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

export const updateInmueble = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const idInmueble = parseInt(idParam, 10);

    if (isNaN(idInmueble) || idInmueble <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'El ID del inmueble provisto es inválido.',
      });
      return;
    }

    const body: UpdateInmuebleDTO = req.body;

    // Validación defensiva de números negativos en metros
    if (body.metros_frente !== undefined && body.metros_frente <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Los metros de frente deben ser un valor mayor a cero.',
      });
      return;
    }

    // Validación de nombres en caso de proveer titulares
    if (body.titular && (!body.titular.nombre_completo || body.titular.nombre_completo.trim() === '')) {
      res.status(400).json({
        status: 'error',
        message: 'El nombre completo del titular es obligatorio si se envía el objeto titular.',
      });
      return;
    }

    if (
      !body.mismo_frentista_que_titular &&
      body.frentista &&
      (!body.frentista.nombre_completo || body.frentista.nombre_completo.trim() === '')
    ) {
      res.status(400).json({
        status: 'error',
        message: 'El nombre completo del frentista es obligatorio si se envía un frentista diferenciado.',
      });
      return;
    }

    const result = await inmueblesRepo.updateInmueble(idInmueble, body);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
      return;
    }
    next(err);
  }
};