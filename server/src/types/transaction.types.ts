// ---- Transaction Types ----

export type TxType = 'rt' | 'ws' | 'mixed';
export type TxStatus = 'completed' | 'voided';
export type ItemSaleType = 'rt' | 'ws';

export interface TransactionRow {
  id: number;
  tx_number: string;
  cashier_id: number;
  cashier_name?: string;
  type: TxType;
  status: TxStatus;
  raw_total: number;
  discount: number;
  total: number;
  amount_tendered: number;
  change_amount: number;
  customer_id: number | null;
  customer_name: string | null;
  points_earned: number | null;
  points_redeemed: number | null;
  voided_at: string | null;
  voided_by: number | null;
  created_at: string;
  items?: TransactionItemRow[];
}

export interface TransactionItemRow {
  id: number;
  transaction_id: number;
  product_id: number | null;
  product_name: string;
  type: ItemSaleType;
  price: number;
  qty: number;
  subtotal: number;
}

export interface CreateTransactionItemInput {
  product_id: number;
  type: ItemSaleType;
  qty: number;
  price: number;
}

export interface CreateTransactionInput {
  cashier_id: number;
  type: TxType;
  items: CreateTransactionItemInput[];
  amount_tendered: number;
  customer_id?: number | null;
  points_redeemed?: number;
}

export interface TransactionFilterParams {
  search?: string;
  type?: TxType | '';
  status?: TxStatus | '';
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}
