import { Router } from 'express';
import { createPago } from '../controllers/pagos.controller';

const router = Router();

router.post('/', createPago);

export default router;