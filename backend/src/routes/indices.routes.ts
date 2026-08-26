import { Router } from 'express';
import { getIndices, createIndice } from '../controllers/indices.controller';

const router = Router();

router.get('/', getIndices);
router.post('/', createIndice);

export default router;