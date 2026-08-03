import { create } from 'zustand';
import { bluetoothSupported, connectToPrinter, describeError, writeInChunks } from '../lib/ble';

/**
 * The single Bluetooth printer connection, shared across the app.
 *
 * Web Bluetooth grants GATT access to whichever device the OS chooser returns,
 * so as long as the connect + discover here is the ONLY place the browser is
 * asked, the same live connection is visible both on the Device Test page and
 * at the POS checkout. State is intentionally NOT persisted — the device and
 * characteristic are live browser objects that can't survive a reload, and a
 * persisted copy would hold a stale handle.
 */
interface PrinterStore {
  device: BluetoothDevice | null;
  writable: BluetoothRemoteGATTCharacteristic | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;

  /** Show the OS chooser, pair, and remember the writable characteristic. */
  connect: () => Promise<boolean>;
  /** Drop the GATT link. Leaves `device` set so the name can still show. */
  disconnect: () => void;
  /** Send raw ESC/POS bytes to the connected printer. Throws if not connected. */
  printRaw: (bytes: Uint8Array) => Promise<void>;
}

export const usePrinterStore = create<PrinterStore>((set, get) => ({
  device: null,
  writable: null,
  connected: false,
  connecting: false,
  error: null,

  connect: async () => {
    if (get().connecting) return false;
    if (get().connected && get().writable) return true;

    set({ connecting: true, error: null });
    try {
      const { device, writable } = await connectToPrinter();

      // Reset UI if the OS drops the device while we're holding it.
      device.addEventListener('gattserverdisconnected', function onDisconnected() {
        device.removeEventListener('gattserverdisconnected', onDisconnected);
        set({ writable: null, connected: false });
      });

      set({ device, writable, connected: true, connecting: false });
      return true;
    } catch (err) {
      const message = describeError(err);
      set({ connecting: false, error: message === 'cancelled' ? null : message, connected: false });
      return false;
    }
  },

  disconnect: () => {
    const { device } = get();
    try {
      device?.gatt?.disconnect();
    } catch {
      /* already gone */
    }
    set({ writable: null, connected: false });
  },

  printRaw: async (bytes: Uint8Array) => {
    const writable = get().writable;
    if (!writable || !get().connected) {
      throw new Error('No Bluetooth printer connected.');
    }
    await writeInChunks(writable, bytes);
  },
}));

/** True when a usable printer connection exists and Web Bluetooth is available. */
export function printerReady(): boolean {
  return bluetoothSupported() && usePrinterStore.getState().connected && !!usePrinterStore.getState().writable;
}