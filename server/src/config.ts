import path from 'path';
import fs from 'fs';

/**
 * Shared filesystem locations for user-generated content (product images,
 * branding logo/favicon).
 *
 * In development (tsx watch, cwd = server/) these resolve to server/uploads —
 * the same behaviour as before. When the app is packaged as a desktop app,
 * the Electron main process sets UPLOADS_DIR to the writable userData folder,
 * because the install directory is read-only inside the asar bundle.
 */
export const uploadsDir = path.resolve(process.env.UPLOADS_DIR || 'uploads');
export const brandingDir = path.join(uploadsDir, 'branding');

// Upload routes depend on these directories existing.
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(brandingDir, { recursive: true });
