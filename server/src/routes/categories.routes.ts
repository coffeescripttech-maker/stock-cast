import { Router } from 'express';
import { pool } from '../db/pool.js';
import type { MySqlRow } from '../types/common.types.js';

const router = Router();

// GET /api/categories — public, no auth needed
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query<MySqlRow[]>(
      'SELECT id, name FROM categories ORDER BY id'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
