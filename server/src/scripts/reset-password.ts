/**
 * CLI master password reset — the recovery path when an owner is locked out
 * (e.g. runs regardless of whether anyone can log in).
 *
 * Usage:    npm run reset-password <username> [newPassword]
 *           npx tsx src/scripts/reset-password.ts admin
 *
 * When no password is given, a random temporary password is generated,
 * printed once, and the user can change it after logging in.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { hashPassword } from '../utils/password.js';
import {
  validatePasswordPolicy,
  type PasswordPolicy,
} from '../utils/passwordPolicy.js';

if (process.env.DOTENV_PATH) dotenv.config({ path: process.env.DOTENV_PATH });
else dotenv.config();

const [, , usernameArg, passwordArg] = process.argv;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';

function generatePassword(len = 12): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

async function readPolicy(conn: mysql.Connection): Promise<PasswordPolicy> {
  try {
    const [rows] = await conn.query(
      'SELECT settings FROM system_settings WHERE id = 1'
    );
    const list = rows as { settings?: string }[];
    const settings = list[0]?.settings ? JSON.parse(list[0].settings) : {};
    const sec = settings?.security ?? {};
    return {
      minLength: Number(sec.passwordMinLength) > 0 ? Number(sec.passwordMinLength) : 6,
      requireStrong: Boolean(sec.requireStrongPassword),
    };
  } catch {
    return { minLength: 6, requireStrong: false };
  }
}

async function main() {
  if (!usernameArg) {
    console.error('Usage: npm run reset-password <username> [newPassword]');
    console.error('       (omit newPassword to generate a random temporary one)');
    process.exit(1);
  }

  const dbName = process.env.DB_NAME || 'ruizpos';
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    charset: 'utf8mb4',
    timezone: '+08:00',
  });

  try {
    console.log(`[reset-password] Connecting to "${dbName}"...`);

    const [rows] = await conn.query(
      'SELECT id, username, display_name FROM users WHERE username = ?',
      [usernameArg]
    );
    const users = rows as { id: number; username: string; display_name: string }[];
    if (users.length === 0) {
      console.error(`[reset-password] User "${usernameArg}" not found.`);
      process.exit(1);
    }
    const user = users[0];

    const policy = await readPolicy(conn);

    let password = passwordArg;
    let generated = false;
    if (!password) {
      do {
        password = generatePassword(12);
      } while (validatePasswordPolicy(password, policy) !== null);
      generated = true;
    } else {
      const err = validatePasswordPolicy(password, policy);
      if (err) {
        console.error(`[reset-password] Password rejected: ${err}`);
        process.exit(1);
      }
    }

    const hash = await hashPassword(password);
    await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);

    console.log(`[reset-password] Password updated for "${user.username}" (${user.display_name}).`);
    if (generated) {
      console.log(`[reset-password] Temporary password: ${password}`);
      console.log('[reset-password] Share this once — the user can change it from their profile menu.');
      console.log('[reset-password] To set a specific password: npm run reset-password <username> <newpassword>');
    }
  } finally {
    await conn.end();
  }
}

main().catch((err: unknown) => {
  console.error('[reset-password] FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});