import { Router } from 'express';
import { getObras, createObra, getPadronByObra } from '../controllers/obras.controller';

const router = Router();

router.get('/', getObras);
router.post('/', createObra);
router.get('/:id/padron', getPadronByObra);

export default router;