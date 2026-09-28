import bcrypt from 'bcryptjs';
import { UsuariosRepository } from '../repositories/usuarios.repository';

export async function seedAdmin(usuariosRepo: UsuariosRepository): Promise<void> {
  try {
    const cantidad = await usuariosRepo.contarUsuarios();
    if (cantidad === 0) {
      const passwordHash = await bcrypt.hash('Admin123*', 10);
      await usuariosRepo.crearUsuario({
        nombre: 'Administrador CECSA',
        email: 'admin@cecsa.com.ar',
        password_hash: passwordHash,
        rol: 'ADMIN',
      });
      console.log('[AUTH] Usuario administrador inicial verificado/creado.');
    }
  } catch (error) {
    console.error('[AUTH ERROR] Error ejecutando el seed de administrador:', error);
  }
}