/**
 * Configurable API base URL.
 *
 * Web & Electron: the app and server share an origin (dev proxy / Electron
 * static serving), so the default `window.location.origin` is correct and this
 * module is a no-op.
 *
 * Android (Capacitor): the WebView loads from `https://localhost` while the
 * server lives on the PC, so the user must enter the server address
 * (`http://<PC-LAN-IP>:3001`) once — stored in localStorage, read here.
 */

const STORAGE_KEY = 'ruizpos_api_base';

export function getApiBase(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)?.trim();
    if (saved) return saved.replace(/\/+$/, '');
  } catch {
    // localStorage unavailable — fall back to same-origin
  }
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
