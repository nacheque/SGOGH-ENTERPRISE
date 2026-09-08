import { Router } from 'express';
import { getObras, createObra, getPadronByObra } from '../controllers/obras.controller';
import { createInmuebleConPersonas } from '../controllers/inmuebles.controller';

const router = Router();

router.get('/', getObras);
router.post('/', createObra);
router.get('/:id/padron', getPadronByObra);

// Alta atómica de inmueble con personas vinculado a la obra
router.post('/:id/inmuebles', createInmuebleConPersonas);

export default router;