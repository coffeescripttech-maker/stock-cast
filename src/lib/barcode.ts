import type { Product, SaleType } from '../types/product';

export function generateBarcodePattern(): number[] {
  return [3, 1, 2, 1, 3, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 3, 1, 1, 2];
}

export interface BarcodeMatch {
  product: Product;
  type: SaleType;
  price: number;
}

/** Resolve a scanned code to a product. Retail barcode wins over wholesale. */
export function findProductByBarcode(
  products: Product[],
  code: string
): BarcodeMatch | null {
  const normalized = code.trim();
  if (!normalized) return null;
  const rt = products.find(p => p.retailBarcode === normalized);
  if (rt) return { product: rt, type: 'rt', price: rt.retailPrice };
  const ws = products.find(p => p.wholesaleBarcode === normalized);
  if (ws) return { product: ws, type: 'ws', price: ws.wholesalePrice };
  return null;
}
