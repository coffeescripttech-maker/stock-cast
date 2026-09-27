import type { SaleType } from '../types/product';

export interface StockFields {
  retailBarcode: string;
  wholesaleBarcode: string;
  retailStock: number;
  wholesaleStock: number;
}

/**
 * True when the retail and wholesale barcodes are the SAME — the merchant
 * treats this as one physical product, so a single unified stock pool
 * (retailStock) is the source for both retail and wholesale sales.
 */
export function hasUnifiedStock(p: StockFields): boolean {
  return !!p.retailBarcode && p.retailBarcode === p.wholesaleBarcode;
}

/** Effective on-hand stock for a given sale type (honours unified stock). */
export function effectiveStock(p: StockFields, type: SaleType): number {
  if (hasUnifiedStock(p)) return p.retailStock;
  return type === 'ws' ? p.wholesaleStock : p.retailStock;
}

/** Whether the stock for a sale type is out of stock (honours unified stock). */
export function isOutOfStock(p: StockFields, type: SaleType): boolean {
  return effectiveStock(p, type) <= 0;
}