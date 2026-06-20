import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/role.js';
import type { MySqlRow, MySqlOk } from '../types/common.types.js';
import type { AuditEntryRow } from '../types/audit.types.js';

const router = Router();

// GET /api/audit-log — searchable, filterable audit trail
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const actionFilter = req.query.action as string | undefined;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (search) {
      const term = `%${search.replace(/[%_]/g, '\\$&')}%`;
      where += ' AND (action LIKE ? OR user_name LIKE ? OR details LIKE ?)';
      params.push(term, term, term);
    }

    if (actionFilter && actionFilter !== 'all') {
      where += ' AND action = ?';
      params.push(actionFilter);
    }

    const [countRows] = await pool.query<MySqlRow[]>(
      `SELECT COUNT(*) AS total FROM audit_log ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows as AuditEntryRow[],
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/audit-log/actions — distinct action types for dropdown
router.get('/actions', async (_req, res, next) => {
  try {
    const [rows] = await pool.query<MySqlRow[]>(
      'SELECT DISTINCT action FROM audit_log ORDER BY action'
    );
    res.json({ success: true, data: rows.map((r: any) => r.action) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/audit-log — clear all entries (owner only)
router.delete('/', requireRole('owner'), async (req, res, next) => {
  try {
    const [[{ count }]] = await pool.query<MySqlRow[]>(
      'SELECT COUNT(*) AS count FROM audit_log'
    );

    await pool.query<MySqlOk>('DELETE FROM audit_log');

    // Log the clear action (will be the only entry)
    const action = `Audit log cleared (${count} entries removed)`;
    await pool.query(
      `INSERT INTO audit_log (action, details, user_name, user_role) VALUES (?, ?, ?, ?)`,
      ['AUDIT_CLEARED', action, req.user!.display_name, req.user!.role]
    );

    res.json({ success: true, data: { message: action } });
  } catch (err) {
    next(err);
  }
});

export default router;
