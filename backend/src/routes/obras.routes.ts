import { Router } from 'express';
import multer from 'multer';
import { pool } from '../config/database'; // Ajustá el path al pool según tu estructura
import { getObras, createObra, getPadronByObra } from '../controllers/obras.controller';
import { createInmuebleConPersonas } from '../controllers/inmuebles.controller';
import { PadronImportRepository } from '../repositories/padronImport.repository';
import { PadronImportService } from '../services/padronImport.service';
import { PadronImportController } from '../controllers/padronImport.controller';

const router = Router();

// Configuración de Multer en memoria para procesar el Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const validMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (validMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no soportado. Debe adjuntar un archivo .xlsx o .xls'));
    }
  },
});

// Instanciación del módulo de importación masiva
const padronImportRepo = new PadronImportRepository(pool);
const padronImportService = new PadronImportService(padronImportRepo);
const padronImportCtrl = new PadronImportController(padronImportService);

// Rutas base de obras
router.get('/', getObras);
router.post('/', createObra);
router.get('/:id/padron', getPadronByObra);

// Alta atómica de inmueble con personas vinculado a la obra
router.post('/:id/inmuebles', createInmuebleConPersonas);

// Importación masiva de padrón (Preview y Confirmación)
router.post('/:id/padron/importar/preview', upload.single('archivo'), padronImportCtrl.previewImportacion);
router.post('/:id/padron/importar/confirmar', padronImportCtrl.confirmarImportacion);

export default router;