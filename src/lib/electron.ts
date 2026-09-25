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

export interface PrintOptions {
  /** Exact printer name from the OS (empty/omitted → the default printer). */
  deviceName?: string;
  landscape?: boolean;
}

/**
 * Print the current window silently (no print-preview dialog). Only possible
 * inside Electron — browsers forbid silent printing for security.
 */
export async function printDesktopSilent(
  options?: PrintOptions
): Promise<boolean> {
  try {
    return (await window.electronAPI?.printSilent(options)) === true;
  } catch {
    return false;
  }
}

/**
 * Print the current view. In the Electron desktop app this sends the page
 * straight to the default (or chosen) printer with no dialog; in a plain
 * browser it falls back to the system print dialog.
 */
export async function printCurrentView(options?: PrintOptions): Promise<void> {
  if (isElectron) {
    await printDesktopSilent(options);
  } else {
    window.print();
  }
}
