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

export interface CartLine {
  productId: number;
  type: SaleType;
  qty: number;
}

/** Units of a product already sitting in the cart for a given sale type. */
export function cartQtyFor(
  cart: CartLine[],
  productId: number,
  type: SaleType
): number {
  const line = cart.find(c => c.productId === productId && c.type === type);
  return line ? line.qty : 0;
}

/**
 * Units that can still be added for a product/sale type, accounting for what is
 * already in the cart. Guards against adding (or bumping the quantity) beyond the
 * on-hand stock — which is what let out-of-stock items slip through before.
 */
export function addableQty(
  p: StockFields,
  type: SaleType,
  cart: CartLine[],
  productId: number
): number {
  return Math.max(0, effectiveStock(p, type) - cartQtyFor(cart, productId, type));
}