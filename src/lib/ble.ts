/**
 * Web Bluetooth helpers shared by the device-test page and the POS checkout.
 *
 * The POS checkout prints receipts to the same Bluetooth thermal printer the
 * cashier pairs on the Device Test page. To make one connection usable from
 * both places, the low-level BLE work lives here and the live connection is
 * owned by a single module store (printerStore) rather than a component.
 *
 * Two tricky bits worth keeping noted:
 *  - Web Bluetooth only works in a secure context (http://127.0.0.1, https,
 *    or the packaged Electron app) — plain LAN http:// over the phone won't.
 *  - BLE writes are capped at the negotiated ATT MTU (20 bytes on the default
 *    23-byte MTU). Sending a whole ESC/POS receipt as one write overflows the
 *    stack and aborts with GATT error 133, so we split into ≤20B chunks and
 *    stagger them so the printer's input buffer can drain between sends.
 */

export const PRINTER_SERVICE_UUIDS: string[] = [
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // common 58mm ESC/POS over BLE
  '0000ff00-0000-1000-8000-00805f9b34fb', // vendor "FF00" service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // vendor "FFE0" service
];

export const MTU_CHUNK_BYTES = 20; // safe payload for the default MTU (23 - 3 header bytes)
export const CHUNK_DELAY_MS = 40;  // gap between chunks so the printer can drain its buffer

export function bluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/** Normalize an unknown error into a short human-readable message. */
export function describeError(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message;
    if (/cancel/i.test(m)) return 'cancelled';
    return m;
  }
  return String(err);
}

/**
 * Split raw ESC/POS bytes into ≤max-size chunks WITHOUT splitting a multi-byte
 * UTF-8 character in half. A ₱, …, or é is 2–4 bytes; if a 20-byte cut lands
 * inside one, the printer's BLE stack can reject the write (GATT error 133)
 * and the whole receipt is dropped.
 *
 * ESC/POS control bytes are single-byte (≤0x7F), so only these runs matter.
 * A lead byte (0xC2–0xF4) tells us the run width; stepping by that width keeps
 * each character's bytes contiguous.
 */
function chunkByUtf8(bytes: Uint8Array, max: number): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  let start = 0;
  let i = 0;
  const n = bytes.length;
  while (i < n) {
    const byte = bytes[i];
    const width =
      byte < 0x80
        ? 1
        : byte < 0xe0
          ? 2
          : byte < 0xf0
            ? 3
            : 4;
    if (i - start + width > max && i > start) {
      // Adding this character would overflow the current (partial) chunk.
      chunks.push(bytes.slice(start, i));
      start = i;
    }
    i += width;
  }
  if (start < n) chunks.push(bytes.slice(start));
  return chunks.length ? chunks : [bytes.slice(0)];
}

/**
 * Send bytes over a writable BLE characteristic in ≤20-byte chunks.
 * Used for both ESC/POS test receipts and real sale receipts.
 */
export async function writeInChunks(
  writable: BluetoothRemoteGATTCharacteristic,
  bytes: Uint8Array
): Promise<void> {
  const chunks = chunkByUtf8(bytes, MTU_CHUNK_BYTES);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk.byteLength === 0) continue;
    if (writable.properties.writeWithoutResponse) {
      await writable.writeValueWithoutResponse(chunk);
    } else {
      await writable.writeValueWithResponse(chunk);
    }
    if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
  }
}

/**
 * Show the OS Bluetooth chooser, connect to the chosen device's GATT server,
 * and locate the first writable characteristic. Returns both the device and
 * the writable so callers can drive the connection and send data.
 */
export async function connectToPrinter(): Promise<{
  device: BluetoothDevice;
  writable: BluetoothRemoteGATTCharacteristic;
}> {
  if (!bluetoothSupported()) {
    throw new Error('Web Bluetooth is not available here. Use Chrome/Edge or the desktop app.');
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: PRINTER_SERVICE_UUIDS,
  });

  const server = await device.gatt?.connect();
  if (!server) throw new Error('Device has no GATT server.');

  const services = await server.getPrimaryServices();
  for (const svc of services) {
    const characteristics = await svc.getCharacteristics();
    for (const ch of characteristics) {
      if (ch.properties.write || ch.properties.writeWithoutResponse) {
        return { device, writable: ch };
      }
    }
  }

  throw new Error(
    'No writable characteristic found on this printer. If your printer uses a different vendor service, add its UUID to PRINTER_SERVICE_UUIDS.'
  );
}