import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { authMiddleware } from './middleware/auth.js';
import { errorMiddleware } from './middleware/error.js';

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

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ---- Global middleware ----
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ---- Static files (uploaded images) ----
app.use('/uploads', express.static(path.resolve('uploads')));

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

// ---- Health check ----
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ---- Error handler (must be last) ----
app.use(errorMiddleware);

// ---- Start server (only when not testing) ----
app.listen(PORT, () => {
  console.log(`✓ Ruiz Store POS API running on http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
