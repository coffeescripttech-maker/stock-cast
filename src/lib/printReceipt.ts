import type { Transaction } from '../types/transaction';
import { buildSaleReceipt } from './escpos';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { printerReady, usePrinterStore } from '../stores/printerStore';

/**
 * Route a completed sale to the right printer.
 *
 * Returns:
 *  - 'printed'  → the Bluetooth thermal printer handled it (or a connect error
 *                 was shown); the caller should NOT also fire the system dialog.
 *  - 'fallback' → Bluetooth printing is not enabled; the caller should fall
 *                 back to the browser/Electron system print (window.print()).
 *  - 'none'     → no transaction; nothing to do.
 *
 * Centralizing this lets the POS checkout, its Enter-to-print shortcut, and
 * the ReceiptModal button all send ESC/POS bytes to the one shared printer
 * instead of each calling window.print().
 */
export function printReceipt(tx: Transaction | null | undefined): 'printed' | 'fallback' | 'none' {
  if (!tx) return 'none';

  const settings = useSettingsStore.getState().settings;
  const showToast = useUIStore.getState().showToast;
  const connected = printerReady();

  // A connected thermal printer is used as soon as it's paired — the setting
  // only matters when nothing is connected (to keep the "connect one to print"
  // hint instead of silently falling back to the system dialog).
  const preferBluetooth = settings.pos.useBluetoothPrinter || connected;
  if (!preferBluetooth) return 'fallback';

  if (connected) {
    usePrinterStore
      .getState()
      .printRaw(buildSaleReceipt(tx, settings))
      .then(() => showToast('Receipt sent to Bluetooth printer', 'success'))
      .catch((err: unknown) =>
        showToast(err instanceof Error ? err.message : 'Bluetooth print failed', 'error')
      );
    return 'printed';
  }

  // Bluetooth printing chosen (setting on) but no printer paired yet.
  showToast('No Bluetooth printer connected — pair one in POS to print receipts', 'error');
  return 'printed';
}