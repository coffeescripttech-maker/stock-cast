import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/role.js';
import type { MySqlRow } from '../types/common.types.js';

const router = Router();

// All dashboard routes are owner-only
router.use(requireRole('owner'));

// GET /api/dashboard/stats — today's sales, counts, low stock
router.get('/stats', async (_req, res, next) => {
  try {
    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [[todaySales]] = await pool.query<MySqlRow[]>(
      `SELECT COALESCE(SUM(total), 0) AS total_sales,
              COUNT(*) AS transaction_count
       FROM transactions
       WHERE status = 'completed'
         AND created_at >= ? AND created_at <= ?`,
      [todayStart.toISOString(), todayEnd.toISOString()]
    );

    const [[{ retail_low }]] = await pool.query<MySqlRow[]>(
      `SELECT COUNT(*) AS retail_low
       FROM products WHERE is_active = TRUE AND retail_stock <= 10`
    );

    const [[{ wholesale_low }]] = await pool.query<MySqlRow[]>(
      `SELECT COUNT(*) AS wholesale_low
       FROM products WHERE is_active = TRUE AND wholesale_stock <= 30`
    );

    const [recentTx] = await pool.query<MySqlRow[]>(
      `SELECT t.tx_number, t.total, t.created_at, u.display_name AS cashier_name
       FROM transactions t
       JOIN users u ON u.id = t.cashier_id
       WHERE t.status = 'completed'
       ORDER BY t.created_at DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        today_sales: todaySales.total_sales,
        today_transactions: todaySales.transaction_count,
        retail_low_stock: retail_low,
        wholesale_low_stock: wholesale_low,
        recent_transactions: recentTx,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/weekly-sales — daily totals for last 7 days
router.get('/weekly-sales', async (_req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT DATE(created_at) AS day,
              COALESCE(SUM(total), 0) AS sales
       FROM transactions
       WHERE status = 'completed'
         AND created_at >= ?
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      [sevenDaysAgo.toISOString()]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/low-stock — alerts with AI reorder suggestions
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

    const alerts = (rows as any[]).map((p) => {
      const lowRetail = p.retail_stock <= 10;
      const lowWholesale = p.wholesale_stock <= 30;
      const reorderRt = lowRetail ? Math.max(20, Math.ceil((50 - p.retail_stock) / 5) * 5) : 0;
      const reorderWs = lowWholesale ? Math.max(10, Math.ceil((60 - p.wholesale_stock) / 10) * 10) : 0;

      return {
        ...p,
        low_retail: lowRetail,
        low_wholesale: lowWholesale,
        suggested_reorder: {
          retail: reorderRt,
          wholesale: reorderWs,
        },
      };
    });

    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
});

export default router;
