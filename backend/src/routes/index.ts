import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import { getPersonas, createPersona } from '../controllers/personas.controller';
import { getInmuebles, createInmueble } from '../controllers/inmuebles.controller';
import obrasRoutes from './obras.routes';
import indicesRoutes from './indices.routes';
import contratosRoutes from './contratos.routes';
import pagosRoutes from './pagos.routes';
import cuotasRoutes from './cuotas.routes';

const router = Router();

// Health Check
router.get('/health', getHealth);

// Módulo Obras (incluye GET /, POST /, GET /:id/padron y POST /:id/inmuebles)
router.use('/obras', obrasRoutes);

// Módulo Personas
router.get('/personas', getPersonas);
router.post('/personas', createPersona);

// Módulo Inmuebles (CRUD individual)
router.get('/inmuebles', getInmuebles);
router.post('/inmuebles', createInmueble);

// Índices, Contratos, Pagos y Cuotas
router.use('/indices', indicesRoutes);
router.use('/contratos', contratosRoutes);
router.use('/pagos', pagosRoutes);
router.use('/cuotas', cuotasRoutes);

export default router;