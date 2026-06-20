import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { comparePassword } from '../utils/password.js';
import { signToken } from '../utils/token.js';
import { authMiddleware } from '../middleware/auth.js';
import type { MySqlRow } from '../types/common.types.js';
import type { LoginResponse } from '../types/auth.types.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    const [rows] = await pool.query<MySqlRow[] & { password_hash: string }[]>(
      `SELECT id, username, password_hash, display_name, role
       FROM users
       WHERE username = ? AND is_active = TRUE
       LIMIT 1`,
      [body.username]
    );

    if (rows.length === 0) {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
      return;
    }

    const user = rows[0];
    const valid = await comparePassword(body.password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
      return;
    }

    const token = signToken({
      sub: user.id,
      username: user.username,
      role: user.role,
      display_name: user.display_name,
    });

    // Log audit
    await pool.query(
      `INSERT INTO audit_log (action, details, user_name, user_role)
       VALUES ('LOGIN', ?, ?, ?)`,
      [`User "${user.display_name}" logged in`, user.display_name, user.role]
    );

    const response: LoginResponse = {
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
      },
      token,
    };

    res.json({ success: true, data: response });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  // JWT is stateless — client discards the token
  res.json({ success: true, data: { message: 'Logged out' } });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: req.user });
});

export default router;
