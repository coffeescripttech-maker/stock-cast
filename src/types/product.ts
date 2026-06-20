export type SaleType = 'rt' | 'ws';
export type ProductCategory = 'Beverage' | 'Food' | 'Snacks' | 'Dairy' | 'Household' | 'Personal Care' | 'Frozen' | 'Others';

export interface Product {
  id: number;
  retailBarcode: string;
  wholesaleBarcode: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number;
  retailStock: number;
  wholesaleStock: number;
  defaultType: SaleType;
  category: ProductCategory;
}
