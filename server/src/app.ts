import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { authMiddleware } from './middleware/auth.js';
import { errorMiddleware } from './middleware/error.js';
import { uploadsDir } from './config.js';

import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/categories.routes.js';
import productRoutes from './routes/products.routes.js';
import transactionRoutes from './routes/transactions.routes.js';
import customerRoutes from './routes/customers.routes.js';
import rewardRoutes from './routes/rewards.routes.js';
import auditRoutes from './routes/audit.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportRoutes from './routes/reports.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import notificationRoutes, { handleSSE } from './routes/notifications.routes.js';

// When the desktop app embeds this server it points DOTENV_PATH at the bundled
// .env file (the working directory differs inside a packaged app).
if (process.env.DOTENV_PATH) dotenv.config({ path: process.env.DOTENV_PATH });
else dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// The Electron main process starts this server in-process. In that case it
// binds 127.0.0.1 itself and this flag suppresses the self-listen below.
const EMBEDDED = process.env.RUIZ_POS_EMBEDDED === '1';

// ---- Global middleware ----
// CORS allow-list (comma-separated in CORS_ORIGIN). Includes the Capacitor
// Android WebView origin (https://localhost) so the phone app can call the PC server.
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,https://localhost,capacitor://localhost')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ---- Static files (uploaded images) ----
app.use('/uploads', express.static(uploadsDir));

// ---- Public routes (no auth) ----
app.use('/api/auth', authRoutes);       // login is public; /me uses its own authMiddleware
app.use('/api/categories', categoryRoutes);

// ---- Authenticated routes ----
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/rewards', authMiddleware, rewardRoutes);
app.use('/api/audit-log', authMiddleware, auditRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
// SSE stream — uses query-param auth (EventSource can't set headers)
app.get('/api/notifications/stream', handleSSE);
// Standard notification endpoints — protected by header auth
app.use('/api/notifications', authMiddleware, notificationRoutes);

// ---- Health check ----
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ---- Serve the built React frontend (packaged desktop app) ----
// The Electron main process sets FRONTEND_DIST_DIR so the desktop app loads the
// production build from the same origin as the API — relative /api and
// /uploads URLs keep working without any frontend changes.
const frontendDir = process.env.FRONTEND_DIST_DIR ? path.resolve(process.env.FRONTEND_DIST_DIR) : null;
if (frontendDir && fs.existsSync(path.join(frontendDir, 'index.html'))) {
  app.use(express.static(frontendDir));

  // SPA fallback — anything that is not an API/upload path gets index.html.
  // Unknown /api routes fall through to the error handler (JSON 404) below.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(frontendDir, 'index.html'));
  });
}

// ---- Error handler (must be last) ----
app.use(errorMiddleware);

// ---- Start server (standalone / dev). Skipped when embedded in Electron,
//      the main process starts it via app.listen() on 127.0.0.1 instead. ----
if (!EMBEDDED) {
  app.listen(PORT, () => {
    console.log(`✓ Ruiz Store POS API running on http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
