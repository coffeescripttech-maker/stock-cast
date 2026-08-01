/**
 * Small helpers for detecting and talking to the Electron shell.
 *
 * These are additive — the app runs fine as a plain web app where
 * `window.electronAPI` does not exist.
 */

export const isElectron =
  typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);

export interface DesktopAppInfo {
  appName: string;
  version: string;
  platform: string;
  isPackaged: boolean;
  versions: { electron: string; chrome: string; node: string };
}

/** Resolve basic desktop-app info, or null when not running under Electron. */
export async function getDesktopAppInfo(): Promise<DesktopAppInfo | null> {
  try {
    return (await window.electronAPI?.getAppInfo()) ?? null;
  } catch {
    return null;
  }
}
