import { Router } from 'express';
import multer from 'multer';
import { previewRoela, confirmarRoela } from '../controllers/conciliaciones.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/roela/preview', upload.single('archivo'), previewRoela);
router.post('/roela/confirmar', confirmarRoela);

export default router;