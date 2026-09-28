import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import authRoutes from './auth.routes';
import obrasRoutes from './obras.routes';
import personasRoutes from './personas.routes';
import inmueblesRoutes from './inmuebles.routes';
import indicesRoutes from './indices.routes';
import contratosRoutes from './contratos.routes';
import pagosRoutes from './pagos.routes';
import cuotasRoutes from './cuotas.routes';
import conciliacionesRoutes from './conciliaciones.routes';
import dashboardRoutes from './dashboard.routes';
import { autenticarJWT } from '../middlewares/auth.middleware';

const router = Router();

// ==========================================
// Rutas Públicas (Sin Token)
// ==========================================

// Health Check
router.get('/health', getHealth);

// Módulo de Autenticación (Login)
router.use('/auth', authRoutes);

// ==========================================
// Barrera de Seguridad (Requiere Bearer Token)
// ==========================================

router.use(autenticarJWT);

// ==========================================
// Rutas Protegidas del Sistema
// ==========================================

// Módulo Obras (incluye GET /, POST /, GET /:id/padron y POST /:id/inmuebles)
router.use('/obras', obrasRoutes);

// Módulo Personas
router.use('/personas', personasRoutes);

// Módulo Inmuebles (CRUD individual)
router.use('/inmuebles', inmueblesRoutes);

// Índices, Contratos, Pagos y Cuotas
router.use('/indices', indicesRoutes);
router.use('/contratos', contratosRoutes);
router.use('/pagos', pagosRoutes);
router.use('/cuotas', cuotasRoutes);

// Conciliaciones
router.use('/conciliaciones', conciliacionesRoutes);

// Dashboard
router.use('/dashboard', dashboardRoutes);

export default router;