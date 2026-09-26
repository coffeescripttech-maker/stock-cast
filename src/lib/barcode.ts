import type { Product, SaleType } from '../types/product';

export function generateBarcodePattern(): number[] {
  return [3, 1, 2, 1, 3, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 3, 1, 1, 2];
}

export interface BarcodeMatch {
  product: Product;
  type: SaleType;
  price: number;
}

/**
 * Resolve a scanned code to a product. Retail barcode wins over wholesale.
 * When a sale mode is passed ('rt' | 'ws'), the returned type/price are forced
 * to that mode regardless of which barcode matched — this is how the POS
 * "wholesale lock" makes every scan wholesale.
 */
export function findProductByBarcode(
  products: Product[],
  code: string,
  mode?: SaleType | null
): BarcodeMatch | null {
  const normalized = code.trim();
  if (!normalized) return null;
  const matchedRetail =
    products.find(p => p.retailBarcode === normalized) ??
    products.find(p => p.wholesaleBarcode === normalized);
  if (!matchedRetail) return null;
  const type: SaleType = mode ?? (matchedRetail.retailBarcode === normalized ? 'rt' : 'ws');
  const price = type === 'ws' ? matchedRetail.wholesalePrice : matchedRetail.retailPrice;
  return { product: matchedRetail, type, price };
}
