import type { Product } from './product';
import type { Transaction } from './transaction';
import type { Customer, RewardsConfig } from './customer';
import type { AuditEntry } from './audit';

export type { Product, ProductCategory, SaleType } from './product';
export type { Transaction, TransactionItem, TxType, TxStatus } from './transaction';
export type { Customer, RewardsConfig, TierKey, TierInfo } from './customer';
export type { UserAccount, UserSession } from './auth';
export type { CartItem, SearchResult } from './pos';
export type { AuditEntry } from './audit';
export type { Toast, ToastType, Theme } from './ui';

export interface PersistedData {
  products: Product[];
  transactions: Transaction[];
  customers: Customer[];
  auditLog: AuditEntry[];
  rewardsConfig: RewardsConfig;
}
