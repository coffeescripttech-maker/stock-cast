import type { SaleType } from './product';

export interface CartItem {
  productId: number;
  name: string;
  type: SaleType;
  qty: number;
  price: number;
}

export interface SearchResult {
  id: number;
  name: string;
  retailBarcode: string;
  wholesaleBarcode: string;
  retailPrice: number;
  wholesalePrice: number;
  retailStock: number;
  wholesaleStock: number;
  defaultType: SaleType;
  category: string;
  _matchType: SaleType;
}
