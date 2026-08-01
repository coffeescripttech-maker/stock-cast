/**
 * Minimal ESC/POS byte builder for thermal receipt printers.
 *
 * Builds a small self-test receipt as raw bytes that any ESC/POS-compatible
 * thermal printer (e.g. the store's Bluetooth POS printer) understands.
 * No dependencies — pure byte concatenation.
 *
 * Common commands used here:
 *   ESC @            initialize printer
 *   ESC a n          alignment (0 left, 1 center, 2 right)
 *   ESC E n          emphasize/bold on/off
 *   ESC ! n          print mode (bit5 double-width, bit4 double-height)
 *   ESC d n          feed n lines
 *   GS V B 0         partial cut
 */

const ESC = 0x1b;
const GS = 0x1d;

function init(): Uint8Array {
  return Uint8Array.from([ESC, 0x40]);
}

function align(n: 0 | 1 | 2): Uint8Array {
  return Uint8Array.from([ESC, 0x61, n]);
}

function bold(on: boolean): Uint8Array {
  return Uint8Array.from([ESC, 0x45, on ? 0x01 : 0x00]);
}

function mode(doubleWidth: boolean, doubleHeight: boolean): Uint8Array {
  let n = 0;
  if (doubleWidth) n |= 0x20;
  if (doubleHeight) n |= 0x10;
  return Uint8Array.from([ESC, 0x21, n]);
}

function line(s: string): Uint8Array {
  return new TextEncoder().encode(s + '\n');
}

function feed(n: number): Uint8Array {
  return Uint8Array.from([ESC, 0x64, n]);
}

function cut(): Uint8Array {
  return Uint8Array.from([GS, 0x56, 0x42, 0x00]);
}

function separator(): Uint8Array {
  return line('-'.repeat(32));
}

function concat(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function padRight(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

/**
 * Build a self-test receipt for the given store name and the current date.
 * Returns the raw ESC/POS bytes ready to send to the printer.
 */
export function buildTestReceipt(storeName: string, now = new Date()): Uint8Array {
  const date = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour12: false });

  const lines: Uint8Array[] = [
    init(),
    align(1),
    mode(true, true),
    line('TEST PRINT'),
    mode(false, false),
    line(storeName.toUpperCase() || 'STORE'),
    separator(),
    bold(true),
    line('DEVICE SELF-TEST'),
    bold(false),
    separator(),
    line(padRight('Date:', 12) + date),
    line(padRight('Time:', 12) + time),
    line(padRight('Copies:', 12) + '1'),
    line(padRight('Result:', 12) + 'OK'),
    separator(),
    align(1),
    line('Thank you!'),
    feed(4),
    cut(),
  ];

  return concat(...lines);
}
