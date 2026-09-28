import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UsuariosRepository } from '../repositories/usuarios.repository';
import { autenticarJWT } from '../middlewares/auth.middleware';

const usuariosRepo = new UsuariosRepository();
const authService = new AuthService(usuariosRepo);
const authController = new AuthController(authService);

const router = Router();

// Ruta pública para iniciar sesión
router.post('/login', authController.login);

// Ruta protegida para consultar el usuario actual
router.get('/me', autenticarJWT, authController.obtenerPerfil);

export default router;