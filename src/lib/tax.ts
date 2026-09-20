import type { TaxSettings } from '../types/settings';

export interface TaxOnSale {
  /** The VAT portion for this sale (2-dp rounded). */
  taxAmount: number;
  /** The amount the customer actually pays. */
  total: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Applies the store's Tax settings to a pre-tax line total (items − discount).
 * Mirrors the server computation in server/src/routes/transactions.routes.ts so
 * the POS, receipt, and reports all agree on the charged amount.
 *
 * - Inclusive pricing: the rate is already inside the shelf prices, so the
 *   total is unchanged and `taxAmount` is the embedded "of which VAT" portion.
 * - Exclusive pricing: VAT is added on top — total = pre-tax + VAT.
 */
export function applyTax(subtotal: number, tax: TaxSettings): TaxOnSale {
  const preTotal = Math.max(0, subtotal);
  if (!tax.enabled || tax.rate <= 0) {
    return { taxAmount: 0, total: preTotal };
  }
  const rate = tax.rate;
  const taxAmount = round2(
    tax.inclusivePricing ? (preTotal * rate) / (100 + rate) : (preTotal * rate) / 100
  );
  const total = tax.inclusivePricing ? preTotal : round2(preTotal + taxAmount);
  return { taxAmount, total };
}