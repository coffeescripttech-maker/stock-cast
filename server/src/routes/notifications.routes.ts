import { Router } from 'express';
import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';
import { verifyToken } from '../utils/token.js';
import type { MySqlRow, MySqlOk } from '../types/common.types.js';

const router = Router();

interface NotifRow {
  id: number;
  type: string;
  message: string;
  severity: string;
  link: string | null;
  metadata: string | null;
  is_read: number;
  created_at: string;
}

// ─── SSE client pool ───────────────────────────────────────────────
const clients = new Set<import('http').ServerResponse>();

function sseSend(res: import('http').ServerResponse, event: string, data: unknown) {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {
    clients.delete(res); // connection lost
  }
}

// ─── Standalone SSE handler (registered in app.ts before auth middleware) ───
export function handleSSE(req: Request, res: Response): void {
  // Auth via query param (EventSource can't set headers)
  const token = req.query.token as string;
  if (!token) {
    res.status(401).json({ success: false, error: 'Missing token' });
    return;
  }
  try {
    verifyToken(token);
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('event: connected\ndata: {}\n\n');

  clients.add(res);

  // Keep-alive ping every 30s
  const keepAlive = setInterval(() => {
    sseSend(res, 'ping', {});
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clients.delete(res);
    clearInterval(keepAlive);
  });
}

// ─── Standard endpoints (auth middleware applied by app.ts) ─────────

// GET /api/notifications — fetch unread notifications, newest first
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query<MySqlRow[]>(
      `SELECT id, type, message, severity, link, metadata, is_read, created_at
       FROM notifications
       WHERE is_read = 0
       ORDER BY created_at DESC
       LIMIT 50`
    );

    const notifications = (rows as NotifRow[]).map(n => ({
      id: String(n.id),
      type: n.type,
      message: n.message,
      severity: n.severity,
      count: 1,
      link: n.link || undefined,
      timestamp: n.created_at,
    }));

    res.json({ data: notifications });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read — mark all as read
router.patch('/read', async (_req, res, next) => {
  try {
    await pool.query<MySqlOk>(
      `UPDATE notifications SET is_read = 1 WHERE is_read = 0`
    );

    // Broadcast to all SSE clients
    for (const client of clients) {
      sseSend(client, 'cleared', {});
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read — mark single notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await pool.query<MySqlOk>(
      `UPDATE notifications SET is_read = 1 WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── Helper: insert + broadcast ───────────────────────────────────

export async function createNotification(
  type: 'low_stock' | 'large_txn' | 'new_customer',
  message: string,
  severity: 'warning' | 'info' | 'success',
  link?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const [result] = await pool.query<MySqlOk>(
    `INSERT INTO notifications (type, message, severity, link, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [
      type,
      message,
      severity,
      link || null,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );

  // Broadcast to all SSE clients
  const payload = {
    id: String(result.insertId),
    type,
    message,
    severity,
    count: 1,
    link: link || undefined,
    timestamp: new Date().toISOString(),
  };

  for (const client of clients) {
    sseSend(client, 'notification', payload);
  }

  // Cleanup: purge read notifications older than 7 days
  await pool.query<MySqlOk>(
    `DELETE FROM notifications WHERE is_read = 1 AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
  );
}

export default router;
