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

import type { Transaction } from '../types/transaction';
import type { SystemSettings } from '../types/settings';

const ESC = 0x1b;
const GS = 0x1d;

/** Receipt column width for a 58mm / 80mm thermal printer set to 32 columns. */
const COL = 32;

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

/**
 * Make a line printable on a 58mm thermal printer by reducing it to plain
 * ASCII (0x20–0x7E). Cheap units decode UTF-8 bytes using a fixed codepage
 * (often Chinese/CP437), so any multi-byte glyph — the peso sign ₱, …,
 * accents, emoji — prints as unreadable garbage. Mapping those to ASCII keeps
 * the receipt legible on any ESC/POS printer.
 */
function escSafe(s: string): string {
  return s
    .replace(/₱/g, 'P') // ₱ peso sign → P
    .replace(/…/g, '...') // … ellipsis → ...
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (é → e, ñ → n)
    .replace(/[^\x20-\x7E]/g, '.'); // any other non-ASCII → '.'
}

function line(s: string): Uint8Array {
  return new TextEncoder().encode(escSafe(s) + '\n');
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

function padLeft(s: string, width: number): string {
  return s.length >= width ? s : ' '.repeat(width - s.length) + s;
}

/** Truncate a string to a width, cutting with a midpoint ellipsis if needed. */
function truncateMid(s: string, width: number): string {
  if (s.length <= width) return s;
  if (width <= 2) return s.slice(0, width);
  const left = Math.ceil((width - 1) / 2);
  const right = Math.floor((width - 1) / 2);
  return s.slice(0, left) + '…' + s.slice(s.length - right);
}

function center(s: string, width: number): Uint8Array {
  const pad = Math.max(0, Math.floor((width - s.length) / 2));
  return line(' '.repeat(pad) + s);
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

/**
 * Format an amount using the currency settings (no store dependency — the full
 * settings object is passed in so this builder stays side-effect free).
 */
function money(amount: number, s: SystemSettings): string {
  const t = s.tax;
  const parts = Number(amount).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, t.thousandSeparator);
  const body = `${intPart}${t.decimalSeparator}${parts[1]}`;
  return t.currencyPosition === 'before' ? `${t.currencySymbol}${body}` : `${body}${t.currencySymbol}`;
}

/**
 * Build a real sale receipt for a completed transaction as raw ESC/POS bytes.
 * Mirrors the on-screen ReceiptModal layout so the thermal printout matches
 * what the cashier sees before printing.
 */
export function buildSaleReceipt(tx: Transaction, s: SystemSettings, now = new Date()): Uint8Array {
  const receipt = s.receipt;
  const general = s.general;
  const branding = s.branding;

  const date = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  const dash = '-'.repeat(COL);

  const headerText = receipt.headerText || general.storeName;
  const typeLabel = tx.type === 'rt' ? 'RETAIL' : tx.type === 'ws' ? 'WHOLESALE' : 'MIXED (Retail + Wholesale)';

  // Item body: name line, then a "qty x price" line with the line total pinned right.
  const itemLines: Uint8Array[] = [];
  for (const item of tx.items) {
    itemLines.push(line(truncateMid(item.name, COL)));
    const qtyPrice = `${item.qty} x ${money(item.price, s)}`;
    itemLines.push(line('  ' + padRight(qtyPrice, COL - 2 - 10) + padLeft(money(item.qty * item.price, s), 10)));
  }

  const rtItems = tx.items.filter((i) => i.type === 'rt');
  const wsItems = tx.items.filter((i) => i.type === 'ws');
  const totalItems = tx.items.reduce((sum, i) => sum + i.qty, 0);

  const lines: Uint8Array[] = [
    init(),
    align(1),
    // Header
    bold(true),
    ...(receipt.showLogoOnReceipt && branding.storeLogo ? [line('')] : []),
    mode(true, true),
    line(truncateMid(headerText.toUpperCase(), COL)),
    mode(false, false),
    bold(false),
    ...(general.address ? [line(general.address)] : []),
    ...(general.phone ? [line('Tel: ' + general.phone)] : []),
    ...(general.taxId ? [line('TIN: ' + general.taxId)] : []),
    line(receipt.receiptTitle || 'Official Receipt'),
    align(0),
    line(dash),
    // Meta
    line(padRight('Date:', 8) + date),
    line(padRight('Time:', 8) + time),
    line(padRight('Cashier:', 8) + tx.cashier),
    line(padRight('Txn #:', 8) + tx.id),
    ...(receipt.showCustomerInfo && tx.customerName
      ? [line(padRight('Customer:', 8) + tx.customerName)]
      : []),
    line(padRight('Type:', 8) + typeLabel),
    line(dash),
    // Items
    line(padRight('ITEM', COL - 12) + padLeft('QTY', 4) + padLeft('AMT', 8)),
    line(dash),
    ...itemLines,
    line(dash),
    // Subtotals per sale type
    ...(rtItems.length > 0
      ? [line(padRight('Retail subtotal:', 22) + money(rtItems.reduce((sum, i) => sum + i.qty * i.price, 0), s))]
      : []),
    ...(wsItems.length > 0
      ? [line(padRight('Wholesale subtotal:', 22) + money(wsItems.reduce((sum, i) => sum + i.qty * i.price, 0), s))]
      : []),
    // Tax
    ...(s.tax.enabled && s.tax.rate > 0
      ? [line(padRight(`${s.tax.label} (${s.tax.rate}%):`, 22) + money((tx.total * s.tax.rate) / 100, s))]
      : []),
    // Discount (points redeemed)
    ...(tx.discount > 0
      ? [line(padRight(`${receipt.discountLabel} (${tx.pointsRedeemed ?? 0} pts):`, 22) + '-' + money(tx.discount, s))]
      : []),
    line(dash),
    line(padRight('Total items:', 22) + String(totalItems)),
    // Grand total
    bold(true),
    line(padRight('GRAND TOTAL', COL - 10) + padLeft(money(tx.total, s), 10)),
    bold(false),
    line(dash),
    // Tendered / change
    line(padRight('Cash Tendered:', 22) + money(tx.amountTendered, s)),
    bold(true),
    line(padRight('Change:', 22) + money(tx.change, s)),
    bold(false),
    // Points
    ...(tx.pointsEarned && tx.pointsEarned > 0
      ? [line(''), center(`+${tx.pointsEarned} points earned`, COL)]
      : []),
    line(dash),
    // Footer
    ...receipt.footerText.split('\n').map((f) => center(f, COL)),
    ...(receipt.returnPolicyText ? [line(''), center(receipt.returnPolicyText, COL)] : []),
    feed(4),
    cut(),
  ];

  return concat(...lines);
}
