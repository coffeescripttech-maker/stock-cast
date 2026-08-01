import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// When the desktop app embeds this server it points DOTENV_PATH at the bundled
// .env file (the working directory differs inside a packaged app).
if (process.env.DOTENV_PATH) dotenv.config({ path: process.env.DOTENV_PATH });
else dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ruizpos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+08:00',          // Philippine Time
});
