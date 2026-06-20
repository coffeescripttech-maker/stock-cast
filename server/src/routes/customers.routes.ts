import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import type { MySqlRow, MySqlOk } from '../types/common.types.js';
import type { CustomerRow, CustomerCreateInput } from '../types/customer.types.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  nfc_tag: z.string().optional().default(''),
  points: z.number().int().min(0).optional().default(0),
  total_spent: z.number().min(0).optional().default(0),
});

const updateSchema = createSchema.partial();

async function logAudit(action: string, details: string, user: string, role: string) {
  await pool.query(
    `INSERT INTO audit_log (action, details, user_name, user_role) VALUES (?, ?, ?, ?)`,
    [action, details, user, role]
  );
}

// GET /api/customers — list with search
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    let where = 'WHERE is_active = TRUE';
    const params: unknown[] = [];

    if (search) {
      const term = `%${search.replace(/[%_]/g, '\\$&')}%`;
      where += ' AND (name LIKE ? OR phone LIKE ? OR nfc_tag LIKE ?)';
      params.push(term, term, term);
    }

    const [countRows] = await pool.query<MySqlRow[]>(
      `SELECT COUNT(*) AS total FROM customers ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT * FROM customers ${where} ORDER BY name LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows as CustomerRow[],
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/stats — aggregate stats
router.get('/stats', async (_req, res, next) => {
  try {
    const [[{ total_customers }]] = await pool.query<MySqlRow[]>(
      'SELECT COUNT(*) AS total_customers FROM customers WHERE is_active = TRUE'
    );
    const [[{ total_points }]] = await pool.query<MySqlRow[]>(
      'SELECT COALESCE(SUM(points), 0) AS total_points FROM customers WHERE is_active = TRUE'
    );
    const [[{ total_spent_sum }]] = await pool.query<MySqlRow[]>(
      'SELECT COALESCE(SUM(total_spent), 0) AS total_spent_sum FROM customers WHERE is_active = TRUE'
    );

    res.json({
      success: true,
      data: {
        total_customers,
        total_points,
        total_spent: total_spent_sum,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:id — single customer
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query<MySqlRow[]>(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/customers — create
router.post('/', async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body) as CustomerCreateInput;

    const [result] = await pool.query<MySqlOk>(
      `INSERT INTO customers (name, phone, nfc_tag, points, total_spent)
       VALUES (?, ?, ?, ?, ?)`,
      [input.name, input.phone, input.nfc_tag || '', input.points || 0, input.total_spent || 0]
    );

    await logAudit(
      'CUSTOMER_ADDED',
      `Added customer "${input.name}"`,
      req.user!.display_name,
      req.user!.role
    );

    const [rows] = await pool.query<MySqlRow[]>(
      'SELECT * FROM customers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// PUT /api/customers/:id — update
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const input = updateSchema.parse(req.body) as Partial<CustomerCreateInput>;

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

    params.push(id);
    await pool.query<MySqlOk>(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    await logAudit(
      'CUSTOMER_EDITED',
      `Edited customer ID ${id}`,
      req.user!.display_name,
      req.user!.role
    );

    const [rows] = await pool.query<MySqlRow[]>(
      'SELECT * FROM customers WHERE id = ?',
      [id]
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

// DELETE /api/customers/:id — soft delete
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    await pool.query<MySqlOk>(
      'UPDATE customers SET is_active = FALSE WHERE id = ?',
      [id]
    );

    await logAudit(
      'CUSTOMER_DELETED',
      `Deleted customer ID ${id}`,
      req.user!.display_name,
      req.user!.role
    );

    res.json({ success: true, data: { message: 'Customer deleted' } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/customers/:id/points — adjust points
router.patch('/:id/points', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { delta } = req.body as { delta: number };

    await pool.query<MySqlOk>(
      `UPDATE customers SET points = GREATEST(points + ?, 0) WHERE id = ?`,
      [delta, id]
    );

    await logAudit(
      'POINTS_ADJUSTED',
      `Adjusted points for customer ID ${id} by ${delta}`,
      req.user!.display_name,
      req.user!.role
    );

    const [rows] = await pool.query<MySqlRow[]>(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
