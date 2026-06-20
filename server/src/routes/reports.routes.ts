import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/role.js';
import type { MySqlRow } from '../types/common.types.js';

const router = Router();

router.use(requireRole('owner'));

// GET /api/reports/transactions — aggregated transaction report
router.get('/transactions', async (req, res, next) => {
  try {
    const filter = (req.query.filter as string) || 'all';
    let dateCondition = '';
    const params: unknown[] = [];

    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateCondition = 'AND t.created_at >= ?';
      params.push(weekAgo.toISOString());
    } else if (filter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateCondition = 'AND t.created_at >= ?';
      params.push(monthAgo.toISOString());
    }

    // Aggregations
    const [[agg]] = await pool.query<MySqlRow[]>(
      `SELECT COALESCE(SUM(total), 0) AS total_sales,
              COUNT(*) AS transaction_count,
              COALESCE(AVG(total), 0) AS avg_transaction
       FROM transactions t
       WHERE t.status = 'completed' ${dateCondition}`,
      params
    );

    // Sales by type
    const [typeStats] = await pool.query<MySqlRow[]>(
      `SELECT t.type, COALESCE(SUM(total), 0) AS total
       FROM transactions t
       WHERE t.status = 'completed' ${dateCondition}
       GROUP BY t.type`,
      params
    );

    // Daily sales for chart
    const [dailySales] = await pool.query<MySqlRow[]>(
      `SELECT DATE(t.created_at) AS day,
              COALESCE(SUM(total), 0) AS sales
       FROM transactions t
       WHERE t.status = 'completed' ${dateCondition}
       GROUP BY DATE(t.created_at)
       ORDER BY day ASC`,
      params
    );

    // Transaction list
    const [transactions] = await pool.query<MySqlRow[]>(
      `SELECT t.tx_number, t.created_at, u.display_name AS cashier_name,
              t.type, t.total, t.raw_total, t.discount, t.status
       FROM transactions t
       JOIN users u ON u.id = t.cashier_id
       WHERE t.status = 'completed' ${dateCondition}
       ORDER BY t.created_at DESC
       LIMIT 200`,
      params
    );

    res.json({
      success: true,
      data: {
        summary: agg,
        by_type: typeStats,
        daily_sales: dailySales,
        transactions,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/inventory — stock value breakdown
router.get('/inventory', async (_req, res, next) => {
  try {
    const [[totals]] = await pool.query<MySqlRow[]>(
      `SELECT COUNT(*) AS total_products,
              COALESCE(SUM(retail_stock * retail_price), 0) AS total_rt_value,
              COALESCE(SUM(wholesale_stock * wholesale_price), 0) AS total_ws_value,
              COALESCE(SUM(retail_stock * retail_price + wholesale_stock * wholesale_price), 0) AS total_value
       FROM products WHERE is_active = TRUE`
    );

    const [products] = await pool.query<MySqlRow[]>(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = TRUE
       ORDER BY (p.retail_stock * p.retail_price + p.wholesale_stock * p.wholesale_price) DESC`
    );

    res.json({
      success: true,
      data: {
        summary: totals,
        products,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/export/csv — CSV download
router.get('/export/csv', async (req, res, next) => {
  try {
    const reportType = (req.query.type as string) || 'transactions';
    const filter = (req.query.filter as string) || 'all';

    let dateCondition = '';
    const params: unknown[] = [];

    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateCondition = 'AND t.created_at >= ?';
      params.push(weekAgo.toISOString());
    } else if (filter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateCondition = 'AND t.created_at >= ?';
      params.push(monthAgo.toISOString());
    }

    let csv = '';
    let filename = '';

    if (reportType === 'transactions') {
      filename = 'transactions.csv';
      const [rows] = await pool.query<MySqlRow[]>(
        `SELECT t.tx_number, t.created_at, u.display_name AS cashier_name,
                t.type, t.raw_total, t.discount, t.total,
                t.amount_tendered, t.change_amount, t.status
         FROM transactions t
         JOIN users u ON u.id = t.cashier_id
         WHERE t.status = 'completed' ${dateCondition}
         ORDER BY t.created_at DESC`,
        params
      );

      csv = 'ID,Date,Cashier,Type,Raw Total,Discount,Total,Tendered,Change,Status\n';
      for (const r of rows as any[]) {
        csv += `${r.tx_number},${r.created_at},"${r.cashier_name}",${r.type},${r.raw_total},${r.discount},${r.total},${r.amount_tendered},${r.change_amount},${r.status}\n`;
      }
    } else {
      filename = 'inventory.csv';
      const [rows] = await pool.query<MySqlRow[]>(
        `SELECT p.*, c.name AS category_name
         FROM products p
         JOIN categories c ON c.id = p.category_id
         WHERE p.is_active = TRUE
         ORDER BY p.name`
      );

      csv = 'Product,Category,RT Barcode,WS Barcode,RT Price,WS Price,RT Stock,WS Stock,RT Value,WS Value,Total Value\n';
      for (const p of rows as any[]) {
        const rtVal = p.retail_stock * p.retail_price;
        const wsVal = p.wholesale_stock * p.wholesale_price;
        csv += `"${p.name}","${p.category_name}","${p.retail_barcode}","${p.wholesale_barcode}",${p.retail_price},${p.wholesale_price},${p.retail_stock},${p.wholesale_stock},${rtVal},${wsVal},${rtVal + wsVal}\n`;
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

export default router;
