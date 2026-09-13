/**
 * Database migration runner.
 *
 * Usage:    npm run migrate            (from the project root)
 *           npm --prefix server run migrate
 *
 * Applies every pending .sql file in ./migrations in filename order and
 * records each applied migration in the `schema_migrations` table. Safe to
 * run repeatedly: `.sql` files execute at most once, and each file is also
 * written defensively (guards its own DDL) so a hand-applied column never
 * breaks.
 *
 * Uses a dedicated connection (not the app pool) because the migration SQL
 * relies on multiple statements / PREPARE.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

if (process.env.DOTENV_PATH) dotenv.config({ path: process.env.DOTENV_PATH });
else dotenv.config();

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

async function main() {
  const dbName = process.env.DB_NAME || 'ruizpos';
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true,
    charset: 'utf8mb4',
    timezone: '+08:00',
  });

  console.log(`[migrate] Connecting to "${dbName}"...`);

  try {
    // Ledger of applied migrations.
    await conn.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name VARCHAR(200) PRIMARY KEY,
         applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
    const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => String(r.name)));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('[migrate] No migration files in server/src/db/migrations.');
      return;
    }

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] ${file} — already applied, skipping`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`[migrate] ${file} — applying...`);
      await conn.query(sql); // DDL is auto-committed; file guards its own steps
      await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      console.log(`[migrate] ${file} — applied`);
      ran++;
    }

    console.log(
      ran === 0
        ? '[migrate] Database is up to date. Nothing to do.'
        : `[migrate] Done. ${ran} migration(s) applied.`
    );
  } finally {
    await conn.end();
  }
}

main().catch((err: any) => {
  console.error('[migrate] FAILED:', err?.message || err);
  process.exit(1);
});