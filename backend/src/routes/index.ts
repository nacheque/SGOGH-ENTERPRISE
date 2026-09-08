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

// Health Check (Actividad 3.2.1)
router.get('/health', getHealth);

// Módulo Obras (Catálogo Maestro y Padrón Territorial)
router.use('/obras', obrasRoutes);

// Módulo Personas (Actividad 3.2.3)
router.get('/personas', getPersonas);
router.post('/personas', createPersona);

// Módulo Inmuebles (Actividad 3.2.4)
router.get('/inmuebles', getInmuebles);
router.post('/inmuebles', createInmueble);

// Índices de Actualización de Cuotas
router.use('/indices', indicesRoutes);

// Contratos de obras
router.use('/contratos', contratosRoutes);

// Pagos y Cuotas
router.use('/pagos', pagosRoutes);
router.use('/cuotas', cuotasRoutes);

export default router;