import { Router } from 'express';
import { getCuotasByInmueble, patchIndiceCuota } from '../controllers/cuotas.controller';

const router = Router();

router.get('/inmueble/:id_inmueble', getCuotasByInmueble);
router.patch('/cuotas/:id/indice', patchIndiceCuota);

export default router;