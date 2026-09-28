import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UsuariosRepository } from '../repositories/usuarios.repository';
import { LoginDTO, AuthResponseDTO, UsuarioSinPassword, JWTPayload } from '../types/auth.types';

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(private usuariosRepo: UsuariosRepository) {
    this.jwtSecret = process.env.JWT_SECRET || 'super_secret_key_cecsa_2026_finance_secure';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '8h';
  }

  async login(credenciales: LoginDTO): Promise<AuthResponseDTO> {
    const { email, password } = credenciales;

    if (!email || !password) {
      throw new AppError('Credenciales inválidas: email y contraseña requeridos', 400);
    }

    const emailNormalizado = email.trim().toLowerCase();
    const usuario = await this.usuariosRepo.buscarPorEmail(emailNormalizado);

    if (!usuario || !usuario.activo) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const payload: JWTPayload = {
      id_usuario: usuario.id_usuario,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
    };

    const signOptions: SignOptions = {
      expiresIn: this.jwtExpiresIn as SignOptions['expiresIn'],
    };

    const token = jwt.sign(payload, this.jwtSecret, signOptions);

    const usuarioSinPassword: UsuarioSinPassword = {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo,
      creado_en: usuario.creado_en,
    };

    return {
      token,
      usuario: usuarioSinPassword,
    };
  }

  async obtenerPerfil(id_usuario: number): Promise<UsuarioSinPassword> {
    const usuario = await this.usuariosRepo.buscarPorId(id_usuario);
    if (!usuario || !usuario.activo) {
      throw new AppError('Usuario no encontrado o inactivo', 404);
    }
    return usuario;
  }
}