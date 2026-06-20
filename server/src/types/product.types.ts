// ---- Product Types ----

export interface ProductRow {
  id: number;
  retail_barcode: string;
  wholesale_barcode: string;
  name: string;
  retail_price: number;
  wholesale_price: number;
  retail_stock: number;
  wholesale_stock: number;
  default_type: 'rt' | 'ws';
  category_id: number;
  category_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCreateInput {
  retail_barcode: string;
  wholesale_barcode: string;
  name: string;
  retail_price: number;
  wholesale_price: number;
  retail_stock?: number;
  wholesale_stock?: number;
  default_type?: 'rt' | 'ws';
  category_id: number;
}

export type ProductUpdateInput = Partial<ProductCreateInput>;
