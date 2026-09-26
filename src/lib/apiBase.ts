/**
 * Configurable API base URL.
 *
 * Resolution order:
 *   1. A runtime override saved by the user (Android LAN / DeviceTest) —
 *      localStorage `ruizpos_api_base`.
 *   2. A build-time URL from `VITE_API_URL` — for deployments where the API
 *      lives on a different origin (e.g. Vercel frontend + Railway backend).
 *      Set it in your hosting provider's build-time env vars (Vercel: Project
 *      Settings → Environment Variables → VITE_API_URL = https://… → deploy).
 *   3. `window.location.origin` — dev proxy / Electron static serving share
 *      the origin, so this default is correct for local runs.
 */

const STORAGE_KEY = 'ruizpos_api_base';

const BUILD_API_URL: string | undefined = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL;

export function getApiBase(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)?.trim();
    if (saved) return saved.replace(/\/+$/, '');
  } catch {
    // localStorage unavailable — fall back to build URL / same-origin
  }
  if (BUILD_API_URL?.trim()) return BUILD_API_URL.trim().replace(/\/+$/, '');
  return window.location.origin;
}

export function setApiBase(url: string): void {
  const clean = url.trim().replace(/\/+$/, '');
  if (clean) localStorage.setItem(STORAGE_KEY, clean);
  else localStorage.removeItem(STORAGE_KEY);
}

/**
 * Resolve a possibly-relative API/asset path (`/api/...`, `/uploads/...`)
 * against the configured base. Anything with a URL scheme (http(s), data,
 * blob, capacitor, ...) is already absolute and passes through unchanged.
 */
export function resolveApiUrl(path: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  return `${getApiBase()}${path}`;
}
