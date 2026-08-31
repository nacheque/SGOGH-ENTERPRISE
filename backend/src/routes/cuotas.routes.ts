import { Router } from 'express';
import { getCuotasByInmueble } from '../controllers/cuotas.controller';

const router = Router();

router.get('/inmueble/:id_inmueble', getCuotasByInmueble);

export default router;