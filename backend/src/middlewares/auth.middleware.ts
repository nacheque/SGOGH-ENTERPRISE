import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, RolUsuario } from '../types/auth.types';

export function autenticarJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 'ERROR',
      message: 'Token de autenticación requerido',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'super_secret_key_cecsa_2026_finance_secure';

  try {
    const payload = jwt.verify(token, secret) as JWTPayload;
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({
      status: 'ERROR',
      message: 'Token inválido o expirado',
    });
  }
}

export function requerirRol(rolesPermitidos: RolUsuario[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({
        status: 'ERROR',
        message: 'No autenticado',
      });
      return;
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      res.status(403).json({
        status: 'ERROR',
        message: 'Acceso denegado: permisos insuficientes',
      });
      return;
    }

    next();
  };
}