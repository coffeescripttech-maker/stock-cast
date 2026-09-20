import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import { pool } from '../db/pool.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { signToken } from '../utils/token.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  readPasswordPolicy,
  validatePasswordPolicy
} from '../utils/passwordPolicy.js';
import type { MySqlRow, MySqlOk } from '../types/common.types.js';
import type { LoginResponse } from '../types/auth.types.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
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
      res
        .status(401)
        .json({ success: false, error: 'Invalid username or password' });
      return;
    }

    const user = rows[0];
    const valid = await comparePassword(body.password, user.password_hash);
    if (!valid) {
      res
        .status(401)
        .json({ success: false, error: 'Invalid username or password' });
      return;
    }

    const token = signToken({
      sub: user.id,
      username: user.username,
      role: user.role,
      display_name: user.display_name
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
        role: user.role
      },
      token
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

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(1, 'New password is required').max(128)
});

// POST /api/auth/change-password — any authenticated user changes their own password
router.post('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const body = changePasswordSchema.parse(req.body);
    const userId = req.user!.id;

    const [rows] = await pool.query<MySqlRow[]>(
      'SELECT password_hash, display_name FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const user = rows[0] as { password_hash: string; display_name: string };

    const currentValid = await comparePassword(
      body.current_password,
      user.password_hash
    );
    if (!currentValid) {
      res
        .status(400)
        .json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    const policy = await readPasswordPolicy();
    const policyErr = validatePasswordPolicy(body.new_password, policy);
    if (policyErr) {
      res.status(400).json({ success: false, error: policyErr });
      return;
    }

    const hash = await hashPassword(body.new_password);
    await pool.query<MySqlOk>(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hash, userId]
    );

    await pool.query(
      `INSERT INTO audit_log (action, details, user_name, user_role)
       VALUES ('PASSWORD_CHANGED', ?, ?, ?)`,
      [
        `Password changed for "${user.display_name}"`,
        user.display_name,
        req.user!.role
      ]
    );

    res.json({ success: true, data: { message: 'Password updated' } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: req.user });
});

// ── Self-service password reset (no email — offline/local system) ──

const forgotSchema = z.object({
  username: z.string().min(1, 'Username is required')
});

const resetSchema = z.object({
  username: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Reset code must be 6 digits'),
  new_password: z.string().min(1, 'New password is required').max(128)
});

// POST /api/auth/forgot-password
// Generates a 6-digit numeric reset code. Because this POS has no email/SMS,
// the code is returned directly in the response — the staff member asks the
// owner or manager to generate it, and the code is handed over in person.
// The code expires after 10 minutes.
router.post('/forgot-password', async (req, res, next) => {
  try {
    const body = forgotSchema.parse(req.body);

    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT id, display_name, role, is_active FROM users WHERE username = ? LIMIT 1`,
      [body.username]
    );

    if (rows.length === 0) {
      // Don't reveal whether the username exists
      res.json({
        success: true,
        data: {
          message: 'If this username exists, a reset code has been generated.'
        }
      });
      return;
    }

    const user = rows[0] as {
      id: number;
      display_name: string;
      role: string;
      is_active: number;
    };
    if (!user.is_active) {
      res.json({
        success: true,
        data: {
          message: 'If this username exists, a reset code has been generated.'
        }
      });
      return;
    }

    // Generate a 6-digit numeric code
    const code = String(Math.floor(100000 + crypto.randomInt(0, 900000)));

    // Hash it for storage (bcrypt of a 6-digit code is safe here)
    const codeHash = await hashPassword(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any previous unused codes for this user
    await pool.query(
      'UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0',
      [user.id]
    );

    // Store the hashed code
    await pool.query(
      `INSERT INTO password_resets (user_id, code_hash, expires_at, used)
       VALUES (?, ?, ?, 0)`,
      [user.id, codeHash, expiresAt]
    );

    // Log audit
    await pool.query(
      `INSERT INTO audit_log (action, details, user_name, user_role)
       VALUES ('PASSWORD_RESET_REQUESTED', ?, ?, ?)`,
      [
        `Password reset requested for "${user.display_name}"`,
        user.display_name,
        user.role
      ]
    );

    // Return the code in the response (offline system, no email)
    res.json({
      success: true,
      data: {
        message: 'Reset code generated. Give this code to the user.',
        code,
        expiresIn: '10 minutes'
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// POST /api/auth/reset-password
// Verifies the reset code and sets a new password.
router.post('/reset-password', async (req, res, next) => {
  try {
    const body = resetSchema.parse(req.body);

    // Find the user
    const [userRows] = await pool.query<MySqlRow[]>(
      `SELECT id, display_name, role FROM users WHERE username = ? AND is_active = TRUE LIMIT 1`,
      [body.username]
    );
    if (userRows.length === 0) {
      res
        .status(400)
        .json({ success: false, error: 'Invalid username or reset code' });
      return;
    }
    const user = userRows[0] as {
      id: number;
      display_name: string;
      role: string;
    };

    // Find the latest unused, unexpired reset code
    const [codeRows] = await pool.query<MySqlRow[]>(
      `SELECT id, code_hash, expires_at FROM password_resets
       WHERE user_id = ? AND used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );
    if (codeRows.length === 0) {
      res
        .status(400)
        .json({
          success: false,
          error: 'Reset code expired or invalid. Please request a new one.'
        });
      return;
    }
    const resetRow = codeRows[0] as {
      id: number;
      code_hash: string;
      expires_at: Date;
    };

    // Verify the code
    const codeValid = await comparePassword(body.code, resetRow.code_hash);
    if (!codeValid) {
      res.status(400).json({ success: false, error: 'Invalid reset code' });
      return;
    }

    // Validate password policy
    const policy = await readPasswordPolicy();
    const policyErr = validatePasswordPolicy(body.new_password, policy);
    if (policyErr) {
      res.status(400).json({ success: false, error: policyErr });
      return;
    }

    // Update password
    const newHash = await hashPassword(body.new_password);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [
      newHash,
      user.id
    ]);

    // Mark code as used
    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [
      resetRow.id
    ]);

    // Log audit
    await pool.query(
      `INSERT INTO audit_log (action, details, user_name, user_role)
       VALUES ('PASSWORD_RESET', ?, ?, ?)`,
      [
        `Password reset completed for "${user.display_name}"`,
        user.display_name,
        user.role
      ]
    );

    res.json({
      success: true,
      data: { message: 'Password has been reset. You can now sign in.' }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

export default router;
