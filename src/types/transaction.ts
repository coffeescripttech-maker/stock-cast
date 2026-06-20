import type { SaleType } from './product';

export interface TransactionItem {
  name: string;
  qty: number;
  type: SaleType;
  price: number;
  subtotal?: number;
}

export type TxType = 'rt' | 'ws' | 'mixed';
export type TxStatus = 'completed' | 'voided';

export interface Transaction {
  id: string;
  date: string;
  cashier: string;
  items: TransactionItem[];
  total: number;
  rawTotal: number;
  discount: number;
  type: TxType;
  status: TxStatus;
  customerId?: number | null;
  customerName?: string | null;
  pointsEarned?: number;
  pointsRedeemed?: number;
  amountTendered: number;
  change: number;
}
