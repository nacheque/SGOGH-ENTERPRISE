import { Router } from 'express';
import { getPersonas, createPersona } from '../controllers/personas.controller';

const router = Router();

router.get('/', getPersonas);
router.post('/', createPersona);

export default router;