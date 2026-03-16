import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'blizzcms';
const DB_PASS = process.env.DB_PASS || process.env.DB_PASSWORD || '';

// Pool por defecto para datos del juego (acore_characters)
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: process.env.DB_CHARACTERS || 'acore_characters',
  // Forzamos conexión TCP por host/port, sin socket local
  socketPath: undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Pool para autenticación (acore_auth)
export const authPool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: process.env.DB_AUTH || 'acore_auth',
  // Forzamos conexión TCP por host/port, sin socket local
  socketPath: undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
