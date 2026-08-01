export interface AppNotification {
  id: string;
  type: 'low_stock' | 'large_txn' | 'new_customer';
  message: string;
  severity: 'warning' | 'info' | 'success';
  count: number;
  link?: string;
  timestamp: string;
}
