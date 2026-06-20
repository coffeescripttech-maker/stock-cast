import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/role.js';
import type { MySqlRow, MySqlOk } from '../types/common.types.js';
import type { TransactionRow, TransactionItemRow } from '../types/transaction.types.js';

const router = Router();

const createItemSchema = z.object({
  product_id: z.number().int().positive(),
  type: z.enum(['rt', 'ws']),
  qty: z.number().int().positive(),
  price: z.number().positive(),
});

const createTxSchema = z.object({
  cashier_id: z.number().int().positive(),
  type: z.enum(['rt', 'ws', 'mixed']),
  items: z.array(createItemSchema).min(1, 'At least one item required'),
  amount_tendered: z.number().positive(),
  customer_id: z.number().int().positive().optional().nullable(),
  points_redeemed: z.number().int().min(0).optional().default(0),
});

// ---- Helpers ----

async function logAudit(action: string, details: string, user: string, role: string) {
  await pool.query(
    `INSERT INTO audit_log (action, details, user_name, user_role) VALUES (?, ?, ?, ?)`,
    [action, details, user, role]
  );
}

// ---- Routes ----

// GET /api/transactions — list with search, filters, pagination
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    const dateFrom = req.query.date_from as string | undefined;
    const dateTo = req.query.date_to as string | undefined;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (search) {
      const term = `%${search.replace(/[%_]/g, '\\$&')}%`;
      where += ' AND (t.tx_number LIKE ? OR u.display_name LIKE ?)';
      params.push(term, term);
    }

    if (type && type !== 'all') {
      where += ' AND t.type = ?';
      params.push(type);
    }

    if (status && status !== 'all') {
      where += ' AND t.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      where += ' AND t.created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND t.created_at <= ?';
      params.push(dateTo);
    }

    const [countRows] = await pool.query<MySqlRow[]>(
      `SELECT COUNT(*) AS total FROM transactions t
       JOIN users u ON u.id = t.cashier_id
       ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT t.*, u.display_name AS cashier_name
       FROM transactions t
       JOIN users u ON u.id = t.cashier_id
       ${where}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows as TransactionRow[],
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/last-receipt — most recent completed transaction
router.get('/last-receipt', async (req, res, next) => {
  try {
    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT t.*, u.display_name AS cashier_name
       FROM transactions t
       JOIN users u ON u.id = t.cashier_id
       WHERE t.status = 'completed'
       ORDER BY t.created_at DESC
       LIMIT 1`
    );

    if (rows.length === 0) {
      res.json({ success: true, data: null });
      return;
    }

    const tx = rows[0] as TransactionRow;

    const [items] = await pool.query<MySqlRow[]>(
      `SELECT * FROM transaction_items WHERE transaction_id = ?`,
      [tx.id]
    );
    tx.items = items as TransactionItemRow[];

    res.json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/:txNumber — single transaction with items
router.get('/:txNumber', async (req, res, next) => {
  try {
    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT t.*, u.display_name AS cashier_name
       FROM transactions t
       JOIN users u ON u.id = t.cashier_id
       WHERE t.tx_number = ?`,
      [req.params.txNumber]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    const tx = rows[0] as TransactionRow;

    const [items] = await pool.query<MySqlRow[]>(
      `SELECT * FROM transaction_items WHERE transaction_id = ?`,
      [tx.id]
    );
    tx.items = items as TransactionItemRow[];

    res.json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions — create (atomic sale)
router.post('/', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const input = createTxSchema.parse(req.body);

    await conn.beginTransaction();

    // 1. Generate tx_number
    const today = new Date();
    const dateKey = today.toISOString().slice(0, 10).replace(/-/g, '');
    const [[{ next_seq }]] = await conn.query<MySqlRow[]>(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(tx_number, 10) AS UNSIGNED)), 0) + 1 AS next_seq
       FROM transactions
       WHERE tx_number LIKE CONCAT(?, '-%')`,
      [dateKey]
    );
    const txNumber = `${dateKey}-${String(next_seq).padStart(4, '0')}`;

    // 2. Get rewards config
    const [[config]] = await conn.query<MySqlRow[]>(
      'SELECT * FROM rewards_config WHERE id = 1'
    );

    // 3. Calculate totals
    let rawTotal = 0;
    for (const item of input.items) {
      rawTotal += item.qty * item.price;
    }

    const redeemValue = input.points_redeemed && config
      ? Math.floor(input.points_redeemed / config.redeem_every) * config.redeem_value
      : 0;
    const discount = redeemValue;
    const total = rawTotal - discount;
    const changeAmount = input.amount_tendered - total;
    const pointsEarned = config && total > 0 ? Math.floor(total / config.earn_rate) : 0;

    // 4. Insert transaction header
    const [headerResult] = await conn.query<MySqlOk>(
      `INSERT INTO transactions
         (tx_number, cashier_id, type, raw_total, discount, total,
          amount_tendered, change_amount, customer_id, points_earned, points_redeemed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [txNumber, input.cashier_id, input.type,
       rawTotal, discount, total,
       input.amount_tendered, changeAmount,
       input.customer_id || null, pointsEarned, input.points_redeemed || 0]
    );

    // 5. Insert line items & deduct stock
    for (const item of input.items) {
      // Get product name for denormalization
      const [[prod]] = await conn.query<MySqlRow[]>(
        'SELECT name FROM products WHERE id = ?',
        [item.product_id]
      );
      const productName = prod ? prod.name : 'Unknown';

      await conn.query<MySqlOk>(
        `INSERT INTO transaction_items
           (transaction_id, product_id, product_name, type, price, qty, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [headerResult.insertId, item.product_id, productName,
         item.type, item.price, item.qty, item.qty * item.price]
      );

      // Deduct stock
      const stockCol = item.type === 'ws' ? 'wholesale_stock' : 'retail_stock';
      await conn.query<MySqlOk>(
        `UPDATE products SET ${stockCol} = GREATEST(${stockCol} - ?, 0) WHERE id = ?`,
        [item.qty, item.product_id]
      );
    }

    // 6. Update customer points & total_spent
    if (input.customer_id) {
      await conn.query<MySqlOk>(
        `UPDATE customers
         SET points = GREATEST(points - ? + ?, 0),
             total_spent = total_spent + ?
         WHERE id = ?`,
        [input.points_redeemed || 0, pointsEarned, total, input.customer_id]
      );

      // Get customer name for denormalized reference
      const [[cust]] = await conn.query<MySqlRow[]>(
        'SELECT name FROM customers WHERE id = ?',
        [input.customer_id]
      );

      if (cust) {
        await conn.query<MySqlOk>(
          `UPDATE transactions SET customer_name = ? WHERE id = ?`,
          [cust.name, headerResult.insertId]
        );
      }
    }

    await conn.commit();

    // Log audit
    const cashierName = req.user?.display_name || `User#${input.cashier_id}`;
    await logAudit(
      'SALE_COMPLETED',
      `Sale ${txNumber} completed — ₱${total.toFixed(2)} (${input.items.length} items)`,
      cashierName,
      req.user?.role || 'staff'
    );

    // Return the completed transaction
    const [txRows] = await pool.query<MySqlRow[]>(
      `SELECT t.*, u.display_name AS cashier_name
       FROM transactions t JOIN users u ON u.id = t.cashier_id
       WHERE t.tx_number = ?`,
      [txNumber]
    );
    const tx = txRows[0] as TransactionRow;

    const [items] = await pool.query<MySqlRow[]>(
      'SELECT * FROM transaction_items WHERE transaction_id = ?',
      [tx.id]
    );
    tx.items = items as TransactionItemRow[];

    res.status(201).json({ success: true, data: tx });
  } catch (err) {
    await conn.rollback();
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    next(err);
  } finally {
    conn.release();
  }
});

// PUT /api/transactions/:txNumber/void — void a transaction (owner only)
router.put('/:txNumber/void', requireRole('owner'), async (req, res, next) => {
  try {
    const txNumber = req.params.txNumber;

    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT * FROM transactions WHERE tx_number = ? AND status = 'completed'`,
      [txNumber]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Transaction not found or already voided' });
      return;
    }

    // Restore stock
    const [items] = await pool.query<MySqlRow[]>(
      'SELECT * FROM transaction_items WHERE transaction_id = ?',
      [rows[0].id]
    );

    for (const item of items as TransactionItemRow[]) {
      const stockCol = item.type === 'ws' ? 'wholesale_stock' : 'retail_stock';
      await pool.query<MySqlOk>(
        `UPDATE products SET ${stockCol} = ${stockCol} + ? WHERE id = ?`,
        [item.qty, item.product_id]
      );
    }

    await pool.query<MySqlOk>(
      `UPDATE transactions
       SET status = 'voided', voided_at = NOW(), voided_by = ?
       WHERE tx_number = ?`,
      [req.user!.id, txNumber]
    );

    await logAudit(
      'TRANSACTION_VOIDED',
      `Transaction ${txNumber} voided`,
      req.user!.display_name,
      req.user!.role
    );

    res.json({ success: true, data: { message: 'Transaction voided' } });
  } catch (err) {
    next(err);
  }
});

export default router;
