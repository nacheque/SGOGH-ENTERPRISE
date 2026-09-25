import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import personasRoutes from './personas.routes';
import inmueblesRoutes from './inmuebles.routes';
import obrasRoutes from './obras.routes';
import indicesRoutes from './indices.routes';
import contratosRoutes from './contratos.routes';
import pagosRoutes from './pagos.routes';
import cuotasRoutes from './cuotas.routes';
import conciliacionesRoutes from './conciliaciones.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

// Health Check
router.get('/health', getHealth);

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