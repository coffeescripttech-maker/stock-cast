import type { Product, ProductCategory } from '../types/product';
import type { Transaction } from '../types/transaction';
import type { Customer } from '../types/customer';
import type { RewardsConfig } from '../types/customer';
import type { UserAccount } from '../types/auth';

export const ACCOUNTS: Record<string, UserAccount> = {
  admin: { password: 'admin123', role: 'owner', name: 'Store Owner' },
  staff: { password: 'staff123', role: 'staff', name: 'Store Staff' },
};

export const CATEGORIES: ProductCategory[] = [
  'Beverage', 'Food', 'Snacks', 'Dairy', 'Household', 'Personal Care', 'Frozen', 'Others',
];

export const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Beverage: { bg: '#dbeafe', color: '#1d4ed8' },
  Food: { bg: '#dcfce7', color: '#15803d' },
  Snacks: { bg: '#fef9c3', color: '#a16207' },
  Dairy: { bg: '#f0fdf4', color: '#166534' },
  Household: { bg: '#f3e8ff', color: '#7e22ce' },
  'Personal Care': { bg: '#ffe4e6', color: '#be123c' },
  Frozen: { bg: '#e0f2fe', color: '#0369a1' },
  Others: { bg: '#f1f5f9', color: '#475569' },
};

export const defaultProducts: Product[] = [
  { id: 1, retailBarcode: '1234567890', wholesaleBarcode: '2234567890', name: 'Coca Cola 350ml', retailPrice: 25, wholesalePrice: 240, retailStock: 100, wholesaleStock: 12, defaultType: 'ws', category: 'Beverage' },
  { id: 2, retailBarcode: '1234567898', wholesaleBarcode: '2234567898', name: 'Pringles Original', retailPrice: 85, wholesalePrice: 70, retailStock: 10, wholesaleStock: 30, defaultType: 'rt', category: 'Snacks' },
  { id: 3, retailBarcode: '1234567892', wholesaleBarcode: '2234567892', name: 'Nestle Coffee 3-in-1', retailPrice: 8.5, wholesalePrice: 7, retailStock: 163, wholesaleStock: 10, defaultType: 'rt', category: 'Beverage' },
  { id: 4, retailBarcode: '1234567893', wholesaleBarcode: '2234567893', name: 'Lucky Me Pancit Canton', retailPrice: 15, wholesalePrice: 12, retailStock: 150, wholesaleStock: 3, defaultType: 'rt', category: 'Food' },
  { id: 5, retailBarcode: '33', wholesaleBarcode: '2200000033', name: 'Sky Flakes Crackers', retailPrice: 30, wholesalePrice: 25, retailStock: 5, wholesaleStock: 33, defaultType: 'rt', category: 'Snacks' },
];

export const defaultTransactions: Transaction[] = [
  { id: '20260318-0001', date: new Date(Date.now() - 13 * 60000).toISOString(), cashier: 'Store Owner', items: [{ name: 'Coca Cola 350ml', qty: 12, type: 'ws', price: 240 }], total: 2880, rawTotal: 2880, discount: 0, type: 'ws', status: 'completed', amountTendered: 3000, change: 120 },
  { id: '20260318-0002', date: new Date(Date.now() - 13 * 60000).toISOString(), cashier: 'Store Owner', items: [{ name: 'Lucky Me Pancit Canton', qty: 25, type: 'ws', price: 12 }], total: 6000, rawTotal: 6000, discount: 0, type: 'ws', status: 'completed', amountTendered: 6000, change: 0 },
  { id: '20260318-0003', date: new Date(Date.now() - 7 * 60000).toISOString(), cashier: 'Store Owner', items: [{ name: 'Pringles Original', qty: 2, type: 'rt', price: 85 }, { name: 'Coca Cola 350ml', qty: 97, type: 'ws', price: 42 }], total: 4162, rawTotal: 4162, discount: 0, type: 'mixed', status: 'completed', amountTendered: 4200, change: 38 },
  { id: '20260318-0004', date: new Date(Date.now() - 6 * 60000).toISOString(), cashier: 'Store Owner', items: [{ name: 'Nestle Coffee 3-in-1', qty: 1, type: 'rt', price: 8.5 }], total: 8.5, rawTotal: 8.5, discount: 0, type: 'rt', status: 'completed', amountTendered: 10, change: 1.5 },
  { id: '20260318-0005', date: new Date(Date.now() - 1 * 60000).toISOString(), cashier: 'Store Staff', items: [{ name: 'Coca Cola 350ml', qty: 1, type: 'ws', price: 240 }], total: 240, rawTotal: 240, discount: 0, type: 'ws', status: 'completed', amountTendered: 250, change: 10 },
];

export const defaultCustomers: Customer[] = [
  { id: 1, name: 'Maria Santos', phone: '09171234567', nfcTag: 'NFC-001234', points: 580, totalSpent: 5800, joinDate: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 2, name: 'Juan dela Cruz', phone: '09281234567', nfcTag: 'NFC-002345', points: 2100, totalSpent: 21000, joinDate: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: 3, name: 'Ana Reyes', phone: '09391234567', nfcTag: 'NFC-003456', points: 250, totalSpent: 2500, joinDate: new Date(Date.now() - 15 * 86400000).toISOString() },
];

export const defaultRewardsConfig: RewardsConfig = {
  earnRate: 10,
  redeemEvery: 100,
  redeemValue: 10,
  bronzeMin: 0,
  silverMin: 500,
  goldMin: 2000,
};
