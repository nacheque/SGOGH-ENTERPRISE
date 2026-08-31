import { Router } from 'express';
import { createContrato } from '../controllers/contratos.controller';

const router = Router();

router.post('/', createContrato);

export default router;