import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Pool va a ser en objeto que mantiene el conjunto de conexiones abiertas
// dontenv carga las variables de conexion en el pool

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('Conexión establecida con PostgreSQL en AWS Lightsail');
});

pool.on('error', (err) => {
  console.error('Error en el pool de PostgreSQL:', err);
});