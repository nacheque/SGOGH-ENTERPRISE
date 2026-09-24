import { Router } from 'express';
import { pagosController } from '../controllers/pagos.controller';

const router = Router();

router.post('/', pagosController.createPago);
router.get('/cartera-cheques', (req, res, next) => pagosController.getCarteraCheques(req, res, next));

export default router;