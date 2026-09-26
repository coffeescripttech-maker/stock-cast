/**
 * Small helpers for detecting and talking to the Electron shell.
 *
 * These are additive — the app runs fine as a plain web app where
 * `window.electronAPI` does not exist.
 */

import { useSettingsStore } from '../stores/settingsStore';
import { buildSaleReceipt } from './escpos';
import type { Transaction } from '../types/transaction';

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
  /** Receipt roll width in mm — sizes the print job for thermal printers. */
  paperSize?: 58 | 80;
}

/**
 * Print the current window silently (no print-preview dialog). Only possible
 * inside Electron — browsers forbid silent printing for security.
 */
export async function printDesktopSilent(
  options?: PrintOptions
): Promise<boolean> {
  try {
    // Wait for the next two paint frames so Electron's silent print snapshots
    // the latest composited frame (it can otherwise capture a stale/mid-
    // animation frame and print a blank page).
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
    const widthMm = options?.paperSize ?? 58;

    // Measure the actual receipt strip and size the printed page to it, so a
    // continuous thermal roll only advances the paper the receipt actually
    // needs (a fixed 297mm tall page wastes the whole strip).
    const el = document.querySelector<HTMLElement>('.receipt-text');
    let heightPx = 0;
    if (el) {
      const prevWidth = el.style.width;
      el.style.width = `${widthMm}mm`;
      heightPx = el.getBoundingClientRect().height;
      el.style.width = prevWidth;
    }
    const pxToMm = 25.4 / 96;
    const heightMm = Math.max(20, Math.ceil(heightPx * pxToMm) + 3);

    // Page geometry in microns — width = roll width, height = receipt height.
    const pageSize = { width: widthMm * 1000, height: heightMm * 1000 };
    return (
      (await window.electronAPI?.printSilent({ ...options, pageSize })) === true
    );
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
    const ps = useSettingsStore.getState().settings.receipt.paperSize;
    await printDesktopSilent({
      ...options,
      paperSize: ps === '80mm' ? 80 : 58,
    });
  } else {
    window.print();
  }
}

/**
 * Print a saved transaction as raw ESC/POS text straight to a thermal printer
 * through the Windows raw spooler (winspool.drv). This is the same pure-text
 * receipt the Bluetooth path prints, so no HTML/print-CSS is involved. Returns
 * true when the OS accepted the job.
 */
export async function printRawToThermal(
  tx: Transaction | null | undefined
): Promise<boolean> {
  if (!isElectron || !tx) return false;
  try {
    const settings = useSettingsStore.getState().settings;
    const bytes = buildSaleReceipt(tx, settings);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return (await window.electronAPI?.printRaw({ hex })) === true;
  } catch {
    return false;
  }
}

/**
 * Print the receipt to paper. In the Electron desktop app this sends the
 * receipt's raw ESC/POS text directly to the thermal printer (no dialog, no
 * rendering); if that fails it falls back to silent page printing. In a plain
 * browser it opens the system print dialog.
 */
export async function printFallback(
  tx: Transaction | null | undefined
): Promise<void> {
  if (isElectron) {
    const ok = await printRawToThermal(tx);
    if (!ok) printCurrentView();
  } else {
    printCurrentView();
  }
}
