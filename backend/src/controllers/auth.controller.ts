import { Request, Response } from 'express';
import { AuthService, AppError } from '../services/auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const resultado = await this.authService.login({ email, password });
      res.status(200).json({
        status: 'OK',
        data: resultado,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'ERROR',
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        status: 'ERROR',
        message: 'Error interno del servidor al procesar autenticación',
      });
    }
  };

  obtenerPerfil = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.usuario?.id_usuario) {
        res.status(401).json({ status: 'ERROR', message: 'No autenticado' });
        return;
      }

      const perfil = await this.authService.obtenerPerfil(req.usuario.id_usuario);
      res.status(200).json({
        status: 'OK',
        data: perfil,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'ERROR',
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        status: 'ERROR',
        message: 'Error al recuperar perfil del usuario',
      });
    }
  };
}