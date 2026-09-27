import { Router } from 'express';
import { pagosController } from '../controllers/pagos.controller';

const router = Router();

router.post('/', pagosController.createPago);
router.get('/cartera-cheques', (req, res, next) => pagosController.getCarteraCheques(req, res, next));

// GET /api/v1/pagos/:id_pago/recibo-datos
router.get('/:id_pago/recibo-datos', pagosController.getReciboDatos);

export default router;