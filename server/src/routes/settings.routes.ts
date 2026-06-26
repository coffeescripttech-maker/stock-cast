import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/role.js';
import type { MySqlRow, MySqlOk } from '../types/common.types.js';

const router = Router();

// ---- Multer config for branding uploads (logo / favicon) ----
const BRANDING_DIR = path.resolve('uploads', 'branding');
if (!fs.existsSync(BRANDING_DIR)) {
  fs.mkdirSync(BRANDING_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, BRANDING_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const name = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, jpeg, png, gif, webp, svg) are allowed'));
    }
  },
});

// ---- Zod schemas per section (all optional — partial updates) ----

const generalSchema = z.object({
  storeName: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  taxId: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  currencyLocale: z.string().optional(),
}).optional();

const brandingSchema = z.object({
  storeLogo: z.string().nullable().optional(),
  favicon: z.string().nullable().optional(),
  primaryBrandColor: z.string().optional(),
  secondaryBrandColor: z.string().optional(),
  loginPageBackground: z.string().nullable().optional(),
}).optional();

const appearanceSchema = z.object({
  defaultTheme: z.enum(['light', 'dark']).optional(),
  sidebarCollapsedDefault: z.boolean().optional(),
  fontSize: z.enum(['small', 'normal', 'large']).optional(),
  denseMode: z.boolean().optional(),
  animationsEnabled: z.boolean().optional(),
}).optional();

const posSchema = z.object({
  defaultSaleType: z.enum(['rt', 'ws']).optional(),
  autoPrintReceipt: z.boolean().optional(),
  soundOnScan: z.boolean().optional(),
  quickAddMode: z.boolean().optional(),
  defaultQuantity: z.number().int().min(1).optional(),
  decimalPlaces: z.number().int().min(0).max(4).optional(),
  customerRequired: z.boolean().optional(),
  enableRewards: z.boolean().optional(),
}).optional();

const inventorySchema = z.object({
  lowStockThresholdRt: z.number().int().min(0).optional(),
  lowStockThresholdWs: z.number().int().min(0).optional(),
  outOfStockThreshold: z.number().int().min(0).optional(),
  autoGenerateBarcodes: z.boolean().optional(),
  barcodePrefix: z.string().optional(),
  enableNegativeStock: z.boolean().optional(),
  defaultSupplier: z.string().optional(),
}).optional();

const receiptSchema = z.object({
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  showLogoOnReceipt: z.boolean().optional(),
  showCustomerInfo: z.boolean().optional(),
  showBarcodeOnReceipt: z.boolean().optional(),
  showQrCodeOnReceipt: z.boolean().optional(),
  paperSize: z.enum(['58mm', '80mm']).optional(),
  taxLabel: z.string().optional(),
  discountLabel: z.string().optional(),
  returnPolicyText: z.string().optional(),
}).optional();

const taxSchema = z.object({
  enabled: z.boolean().optional(),
  label: z.string().optional(),
  rate: z.number().min(0).max(100).optional(),
  inclusivePricing: z.boolean().optional(),
  currencySymbol: z.string().optional(),
  currencyPosition: z.enum(['before', 'after']).optional(),
  decimalSeparator: z.string().max(1).optional(),
  thousandSeparator: z.string().max(1).optional(),
}).optional();

const barcodeSchema = z.object({
  type: z.enum(['CODE128', 'EAN13', 'UPC']).optional(),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  showPriceBelow: z.boolean().optional(),
  showNameBelow: z.boolean().optional(),
}).optional();

const securitySchema = z.object({
  passwordMinLength: z.number().int().min(4).max(128).optional(),
  sessionTimeout: z.number().int().min(1).optional(),
  maxLoginAttempts: z.number().int().min(1).optional(),
  requireStrongPassword: z.boolean().optional(),
  enable2fa: z.boolean().optional(),
  lockoutDuration: z.number().int().min(1).optional(),
}).optional();

const notificationsSchema = z.object({
  lowStockAlert: z.boolean().optional(),
  dailySalesReportTime: z.string().optional(),
  newCustomerAlert: z.boolean().optional(),
  largeTransactionThreshold: z.number().min(0).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
}).optional();

const emailSmsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  senderEmail: z.string().optional(),
  smsProvider: z.enum(['none', 'twilio', 'chikka', 'vonage']).optional(),
  smsApiKey: z.string().optional(),
  smsSenderId: z.string().optional(),
}).optional();

const backupSchema = z.object({
  autoBackupFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  backupRetentionDays: z.number().int().min(1).optional(),
  lastBackup: z.string().nullable().optional(),
  backupLocation: z.string().optional(),
  enableAutoBackup: z.boolean().optional(),
}).optional();

const integrationsSchema = z.object({
  enableQrPayments: z.boolean().optional(),
  paymentGatewayApiKey: z.string().optional(),
  webhookUrl: z.string().optional(),
  enableAccountingSync: z.boolean().optional(),
  accountingProvider: z.enum(['none', 'xero', 'quickbooks']).optional(),
}).optional();

const aboutSchema = z.object({
  appVersion: z.string().optional(),
  lastUpdated: z.string().nullable().optional(),
  developerInfo: z.string().optional(),
  licenseType: z.string().optional(),
  footerCredits: z.string().optional(),
  privacyPolicyUrl: z.string().optional(),
  termsUrl: z.string().optional(),
}).optional();

const settingsUpdateSchema = z.object({
  general: generalSchema,
  branding: brandingSchema,
  appearance: appearanceSchema,
  pos: posSchema,
  inventory: inventorySchema,
  receipt: receiptSchema,
  tax: taxSchema,
  barcode: barcodeSchema,
  security: securitySchema,
  notifications: notificationsSchema,
  emailSms: emailSmsSchema,
  backup: backupSchema,
  integrations: integrationsSchema,
  about: aboutSchema,
}).refine(obj => Object.keys(obj).length > 0, {
  message: 'At least one section must be provided',
});

// ---- Helpers ----

async function getSettings(): Promise<Record<string, any>> {
  const [rows] = await pool.query<MySqlRow[]>(
    'SELECT settings FROM system_settings WHERE id = 1'
  );
  if (rows.length === 0) return {};
  return typeof rows[0].settings === 'string'
    ? JSON.parse(rows[0].settings)
    : rows[0].settings;
}

async function updateSettingsDb(
  settings: Record<string, any>,
  userId: number,
  displayName: string,
  role: string
): Promise<void> {
  await pool.query<MySqlOk>(
    'UPDATE system_settings SET settings = ?, updated_by = ? WHERE id = 1',
    [JSON.stringify(settings), userId]
  );

  await pool.query(
    `INSERT INTO audit_log (action, details, user_name, user_role)
     VALUES ('SETTINGS_UPDATED', ?, ?, ?)`,
    ['System settings updated', displayName, role]
  );
}

// ---- Routes ----

// GET /api/settings/public — no auth required (login page needs this)
router.get('/public', async (_req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      data: {
        storeName: settings.general?.storeName || 'Ruiz Store',
        currencySymbol: settings.tax?.currencySymbol || '₱',
        currencyPosition: settings.tax?.currencyPosition || 'before',
        currencyLocale: settings.general?.currencyLocale || 'en-PH',
        passwordMinLength: settings.security?.passwordMinLength || 6,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/settings — return full settings JSON
router.get('/', async (_req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings — update settings (owner only)
router.put('/', requireRole('owner'), async (req, res, next) => {
  try {
    const input = settingsUpdateSchema.parse(req.body);

    const current = await getSettings();

    // Merge each provided section into current settings
    for (const [sectionKey, sectionValue] of Object.entries(input)) {
      if (sectionValue && typeof sectionValue === 'object') {
        current[sectionKey] = { ...(current[sectionKey] || {}), ...sectionValue };
      }
    }

    await updateSettingsDb(current, req.user!.id, req.user!.display_name, req.user!.role);

    res.json({ success: true, data: current });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// PUT /api/settings/branding — upload logo or favicon (owner only)
router.put(
  '/branding',
  requireRole('owner'),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const current = await getSettings();
      const updates: Record<string, string | null> = {};

      if (files?.logo?.[0]) {
        updates.storeLogo = `/uploads/branding/${files.logo[0].filename}`;
      }
      if (files?.favicon?.[0]) {
        updates.favicon = `/uploads/branding/${files.favicon[0].filename}`;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, error: 'No files uploaded. Use "logo" or "favicon" field names.' });
        return;
      }

      current.branding = { ...(current.branding || {}), ...updates };

      await updateSettingsDb(current, req.user!.id, req.user!.display_name, req.user!.role);

      res.json({ success: true, data: current.branding });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
