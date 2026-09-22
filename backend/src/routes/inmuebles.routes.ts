import { Router } from 'express';
import {
  getInmuebles,
  createInmueble,
  updateInmueble,
} from '../controllers/inmuebles.controller';

const router = Router();

router.get('/', getInmuebles);
router.post('/', createInmueble);
router.put('/:id', updateInmueble);

export default router;