import { Request, Response } from 'express';
import { pool } from '../config/database';

// 2. Endpoint de prueba de conexión a la Base de Datos (AWS Lightsail)
export const getHealth = async (req: Request, res: Response) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'OK',
      message: 'Servidor CECSA operativo y conectado a PostgreSQL en AWS Lightsail',
      timestamp: new Date().toISOString(),
      database: {
        status: 'CONNECTED',
        serverTime: dbResult.rows[0].now,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al conectar con la base de datos',
      error: error.message,
    });
  }
};