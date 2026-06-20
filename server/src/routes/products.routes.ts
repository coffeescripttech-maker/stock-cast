import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/role.js';
import type { MySqlRow, MySqlOk } from '../types/common.types.js';
import type { ProductRow, ProductCreateInput, ProductUpdateInput } from '../types/product.types.js';

const router = Router();

const createSchema = z.object({
  retail_barcode: z.string().min(1),
  wholesale_barcode: z.string().min(1),
  name: z.string().min(1),
  retail_price: z.number().positive(),
  wholesale_price: z.number().positive(),
  retail_stock: z.number().int().min(0).optional().default(0),
  wholesale_stock: z.number().int().min(0).optional().default(0),
  default_type: z.enum(['rt', 'ws']).optional().default('rt'),
  category_id: z.number().int().positive(),
});

const updateSchema = createSchema.partial();

// ---- Helpers ----

async function logAudit(action: string, details: string, user: string, role: string) {
  await pool.query(
    `INSERT INTO audit_log (action, details, user_name, user_role) VALUES (?, ?, ?, ?)`,
    [action, details, user, role]
  );
}

// ---- Routes ----

// GET /api/products — list with search, filter, pagination
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const categoryId = req.query.category_id as string | undefined;
    const active = req.query.active !== 'false';

    let where = 'WHERE p.is_active = ?';
    const params: unknown[] = [active];

    if (search) {
      const term = `%${search.replace(/[%_]/g, '\\$&')}%`;
      where += ' AND (p.name LIKE ? OR p.retail_barcode LIKE ? OR p.wholesale_barcode LIKE ?)';
      params.push(term, term, term);
    }

    if (categoryId) {
      where += ' AND p.category_id = ?';
      params.push(Number(categoryId));
    }

    const [countRows] = await pool.query<MySqlRow[]>(
      `SELECT COUNT(*) AS total FROM products p ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${where}
       ORDER BY p.name
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const products = rows as unknown as ProductRow[];

    // Count low stock
    const [[{ low_stock_count }]] = await pool.query<MySqlRow[]>(
      `SELECT COUNT(*) AS low_stock_count FROM products
       WHERE is_active = TRUE AND (retail_stock <= 10 OR wholesale_stock <= 30)`
    );

    res.json({
      success: true,
      data: products,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
      low_stock_count,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/low-stock — low stock alerts (for dashboard)
router.get('/low-stock', async (_req, res, next) => {
  try {
    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = TRUE
         AND (p.retail_stock <= 10 OR p.wholesale_stock <= 30)
       ORDER BY LEAST(p.retail_stock, p.wholesale_stock) ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id — single product
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/products — create (owner only)
router.post('/', requireRole('owner'), async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body) as ProductCreateInput;

    const [result] = await pool.query<MySqlOk>(
      `INSERT INTO products
         (retail_barcode, wholesale_barcode, name, retail_price, wholesale_price,
          retail_stock, wholesale_stock, default_type, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.retail_barcode, input.wholesale_barcode, input.name,
       input.retail_price, input.wholesale_price,
       input.retail_stock, input.wholesale_stock,
       input.default_type, input.category_id]
    );

    await logAudit(
      'PRODUCT_ADDED',
      `Added product "${input.name}" (ID: ${result.insertId})`,
      req.user!.display_name,
      req.user!.role
    );

    // Return the created product
    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT p.*, c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
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

// PUT /api/products/:id — update (owner only)
router.put('/:id', requireRole('owner'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const input = updateSchema.parse(req.body) as ProductUpdateInput;

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
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    await logAudit(
      'PRODUCT_EDITED',
      `Edited product ID ${id}`,
      req.user!.display_name,
      req.user!.role
    );

    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT p.*, c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
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

// DELETE /api/products/:id — soft delete (owner only)
router.delete('/:id', requireRole('owner'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    await pool.query<MySqlOk>(
      'UPDATE products SET is_active = FALSE WHERE id = ?',
      [id]
    );

    await logAudit(
      'PRODUCT_DELETED',
      `Deleted product ID ${id}`,
      req.user!.display_name,
      req.user!.role
    );

    res.json({ success: true, data: { message: 'Product deleted' } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/products/:id/stock — deduct stock (used during checkout)
router.patch('/:id/stock', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { type, qty } = req.body as { type: 'rt' | 'ws'; qty: number };

    const stockCol = type === 'ws' ? 'wholesale_stock' : 'retail_stock';

    await pool.query<MySqlOk>(
      `UPDATE products SET ${stockCol} = GREATEST(${stockCol} - ?, 0) WHERE id = ?`,
      [qty, id]
    );

    res.json({ success: true, data: { message: 'Stock deducted' } });
  } catch (err) {
    next(err);
  }
});

export default router;
