import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/role.js';
import type { MySqlRow, MySqlOk } from '../types/common.types.js';

const router = Router();

const updateSchema = z.object({
  earn_rate: z.number().positive().optional(),
  redeem_every: z.number().int().positive().optional(),
  redeem_value: z.number().positive().optional(),
  bronze_min: z.number().int().min(0).optional(),
  silver_min: z.number().int().min(0).optional(),
  gold_min: z.number().int().min(0).optional(),
});

// GET /api/rewards/config
router.get('/config', async (_req, res, next) => {
  try {
    const [rows] = await pool.query<MySqlRow[]>(
      'SELECT * FROM rewards_config WHERE id = 1'
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    next(err);
  }
});

// PUT /api/rewards/config — owner only
router.put('/config', requireRole('owner'), async (req, res, next) => {
  try {
    const input = updateSchema.parse(req.body);

    const fields: string[] = [];
    const params: unknown[] = [];

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: 'No fields to update' });
      return;
    }

    params.push(req.user!.id);
    fields.push('updated_by = ?');

    await pool.query<MySqlOk>(
      `UPDATE rewards_config SET ${fields.join(', ')} WHERE id = 1`,
      params
    );

    await pool.query(
      `INSERT INTO audit_log (action, details, user_name, user_role)
       VALUES ('REWARDS_CONFIG_UPDATED', ?, ?, ?)`,
      ['Rewards configuration updated', req.user!.display_name, req.user!.role]
    );

    const [rows] = await pool.query<MySqlRow[]>(
      'SELECT * FROM rewards_config WHERE id = 1'
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

export default router;
