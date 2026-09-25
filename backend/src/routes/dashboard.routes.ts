import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

// GET /api/v1/finanzas/dashboard/kpis?id_obra=1
router.get('/kpis', dashboardController.getKpis);

// GET /api/v1/finanzas/dashboard/curva-recaudacion?id_obra=1
router.get('/curva-recaudacion', dashboardController.getCurvaRecaudacion);

// GET /api/v1/finanzas/dashboard/aging-mora?id_obra=1
router.get('/aging-mora', dashboardController.getAgingMora);

export default router;