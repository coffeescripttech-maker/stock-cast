import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/role.js';
import { hashPassword } from '../utils/password.js';
import {
  readPasswordPolicy,
  validatePasswordPolicy,
} from '../utils/passwordPolicy.js';
import type { MySqlRow, MySqlOk } from '../types/common.types.js';
import type { UserRow, UserWithHash } from '../types/user.types.js';

const router = Router();

// Every route below is owner-only — staff use /auth/change-password instead.
router.use(requireRole('owner'));

const createUserSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, dots, dashes and underscores'),
  display_name: z.string().min(1, 'Display name is required').max(100),
  role: z.enum(['owner', 'staff']).default('staff'),
  password: z.string().min(1, 'Password is required').max(128),
});

const updateUserSchema = z
  .object({
    display_name: z.string().min(1).max(100).optional(),
    role: z.enum(['owner', 'staff']).optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (v) => v.display_name !== undefined || v.role !== undefined || v.is_active !== undefined,
    { message: 'Nothing to update' }
  );

const resetPasswordSchema = z.object({
  new_password: z.string().min(1, 'Password is required').max(128),
});

// ---- Helpers ----

async function logAudit(action: string, details: string, user: string, role: string) {
  await pool.query(
    `INSERT INTO audit_log (action, details, user_name, user_role) VALUES (?, ?, ?, ?)`,
    [action, details, user, role]
  );
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ---- Routes ----

// GET /api/users — list all users (never exposes password_hash)
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT id, username, display_name, role, is_active, created_at, updated_at
       FROM users ORDER BY id`
    );
    res.json({ success: true, data: rows as UserRow[] });
  } catch (err) {
    next(err);
  }
});

// POST /api/users — create a user account (owner)
router.post('/', async (req, res, next) => {
  try {
    const input = createUserSchema.parse(req.body);
    const policy = await readPasswordPolicy();
    const policyErr = validatePasswordPolicy(input.password, policy);
    if (policyErr) {
      res.status(400).json({ success: false, error: policyErr });
      return;
    }

    const hash = await hashPassword(input.password);
    const [result] = await pool.query<MySqlOk>(
      `INSERT INTO users (username, password_hash, display_name, role)
       VALUES (?, ?, ?, ?)`,
      [input.username, hash, input.display_name, input.role]
    );

    await logAudit(
      'USER_CREATED',
      `Created user "${input.username}" (${input.role})`,
      req.user!.display_name,
      req.user!.role
    );

    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT id, username, display_name, role, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, data: rows[0] as UserRow });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    // MySQL duplicate-key error for username (unique index)
    if (typeof err === 'object' && err !== null && (err as { code?: string }).code === 'ER_DUP_ENTRY') {
      res.status(409).json({ success: false, error: 'Username already exists' });
      return;
    }
    next(err);
  }
});

// PUT /api/users/:id — update display name / role / active flag (owner)
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ success: false, error: 'Invalid user id' });
      return;
    }
    const input = updateUserSchema.parse(req.body);

    const [targetRows] = await pool.query<MySqlRow[]>(
      'SELECT id, username, role, is_active FROM users WHERE id = ?',
      [id]
    );
    if (targetRows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const target = targetRows[0] as { id: number; username: string; role: string; is_active: number };

    // Guards — never let an owner lock themselves or the store out.
    if (target.id === req.user!.id) {
      if (input.is_active === false) {
        res.status(400).json({ success: false, error: 'You cannot deactivate your own account' });
        return;
      }
      if (input.role && input.role !== target.role) {
        res.status(400).json({ success: false, error: 'You cannot change your own role' });
        return;
      }
    }

    // Keep at least one active owner in the store.
    const wasActiveOwner = target.role === 'owner' && target.is_active === 1;
    const newRole = input.role ?? target.role;
    const newActive = input.is_active === undefined ? target.is_active === 1 : input.is_active;
    if (wasActiveOwner && !(newRole === 'owner' && newActive)) {
      const [[{ cnt }]] = await pool.query<MySqlRow[]>(
        `SELECT COUNT(*) AS cnt FROM users WHERE role = 'owner' AND is_active = TRUE`
      );
      if (Number(cnt) <= 1) {
        res.status(400).json({ success: false, error: 'Cannot remove the last active owner' });
        return;
      }
    }

    // Build the SET clause from the fields that were actually provided.
    const sets: string[] = [];
    const params: unknown[] = [];
    if (input.display_name !== undefined) {
      sets.push('display_name = ?');
      params.push(input.display_name);
    }
    if (input.role !== undefined) {
      sets.push('role = ?');
      params.push(input.role);
    }
    if (input.is_active !== undefined) {
      sets.push('is_active = ?');
      params.push(input.is_active ? 1 : 0);
    }
    params.push(id);
    await pool.query<MySqlOk>(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);

    await logAudit(
      'USER_UPDATED',
      `Updated user "${target.username}"`,
      req.user!.display_name,
      req.user!.role
    );

    res.json({ success: true, data: { message: 'User updated' } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// POST /api/users/:id/reset-password — owner resets any user's password
router.post('/:id/reset-password', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ success: false, error: 'Invalid user id' });
      return;
    }
    const input = resetPasswordSchema.parse(req.body);

    const [rows] = await pool.query<MySqlRow[]>(
      'SELECT id, username FROM users WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const target = rows[0] as { id: number; username: string };

    const policy = await readPasswordPolicy();
    const policyErr = validatePasswordPolicy(input.new_password, policy);
    if (policyErr) {
      res.status(400).json({ success: false, error: policyErr });
      return;
    }

    const hash = await hashPassword(input.new_password);
    await pool.query<MySqlOk>('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);

    await logAudit(
      'PASSWORD_RESET',
      `Password reset for user "${target.username}"`,
      req.user!.display_name,
      req.user!.role
    );

    res.json({ success: true, data: { message: `Password updated for ${target.username}` } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

export default router;