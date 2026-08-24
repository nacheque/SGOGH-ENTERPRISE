import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import router from './routes';

// Cargar variables de entorno (.env)
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares Globales
app.use(cors()); // Habilita peticiones desde el Frontend
app.use(express.json()); // Parsea los cuerpos de las peticiones a JSON

// 2. Rutas Principales de la API v1
app.use('/api/v1', router);

// 3. Middleware de Manejo Centralizado de Errores (Siempre va al final)
app.use(errorHandler);

// 4. Encendido del Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor CECSA corriendo en http://localhost:${PORT}`);
  console.log(`🔗 Healthcheck disponible en http://localhost:${PORT}/api/v1/health`);
});

export default app;