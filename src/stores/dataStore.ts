import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types/product';
import type { Transaction } from '../types/transaction';
import type { Customer, RewardsConfig } from '../types/customer';
import type { AuditEntry } from '../types/audit';
import type { SaleType } from '../types/product';
import { defaultRewardsConfig } from '../lib/constants';
import * as api from '../api/client';

// ---- Normalizers: map API snake_case→camelCase fields to frontend field names ----

function normalizeTx(raw: Record<string, any>): Transaction {
  return {
    id: raw.txNumber ?? raw.id,
    date: raw.createdAt ?? raw.date,
    cashier: raw.cashierName ?? raw.cashier,
    items: (raw.items || []).map((i: any) => ({
      name: i.productName ?? i.name,
      qty: Number(i.qty) || 0,
      type: i.type,
      price: Number(i.price) || 0,
      subtotal: Number(i.subtotal) || 0,
    })),
    total: Number(raw.total) || 0,
    rawTotal: Number(raw.rawTotal) || 0,
    discount: Number(raw.discount) || 0,
    type: raw.type,
    status: raw.status ?? 'completed',
    customerId: raw.customerId ?? null,
    customerName: raw.customerName ?? null,
    pointsEarned: Number(raw.pointsEarned) || 0,
    pointsRedeemed: Number(raw.pointsRedeemed) || 0,
    amountTendered: Number(raw.amountTendered) || 0,
    change: Number(raw.changeAmount ?? raw.change) || 0,
  };
}

function normalizeCustomer(raw: Record<string, any>): Customer {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    nfcTag: raw.nfcTag ?? raw.nfc_tag ?? '',
    points: Number(raw.points) || 0,
    totalSpent: Number(raw.totalSpent) || 0,
    joinDate: raw.createdAt ?? raw.joinDate,
  };
}

function normalizeAudit(raw: Record<string, any>): AuditEntry {
  return {
    id: raw.id,
    timestamp: raw.createdAt ?? raw.timestamp,
    user: raw.userName ?? raw.user,
    role: raw.userRole ?? raw.role,
    action: raw.action,
    details: raw.details,
  };
}

function normalizeProduct(raw: Record<string, any>): Product {
  return {
    id: raw.id,
    name: raw.name,
    retailBarcode: raw.retailBarcode ?? '',
    wholesaleBarcode: raw.wholesaleBarcode ?? '',
    retailPrice: Number(raw.retailPrice) || 0,
    wholesalePrice: Number(raw.wholesalePrice) || 0,
    retailStock: Number(raw.retailStock) || 0,
    wholesaleStock: Number(raw.wholesaleStock) || 0,
    defaultType: raw.defaultType ?? 'rt',
    category: raw.category ?? 'Others',
  };
}

function normalizeRewardsConfig(raw: Record<string, any>): RewardsConfig {
  return {
    earnRate: Number(raw.earnRate) || 1,
    redeemEvery: Number(raw.redeemEvery) || 100,
    redeemValue: Number(raw.redeemValue) || 10,
    bronzeMin: Number(raw.bronzeMin) || 0,
    silverMin: Number(raw.silverMin) || 300,
    goldMin: Number(raw.goldMin) || 1000,
  };
}

interface CompleteSaleInput {
  cashierId: number;
  type: 'rt' | 'ws' | 'mixed';
  items: Array<{
    productId: number;
    type: 'rt' | 'ws';
    qty: number;
    price: number;
  }>;
  amountTendered: number;
  customerId?: number | null;
  pointsRedeemed?: number;
}

interface DataState {
  products: Product[];
  transactions: Transaction[];
  customers: Customer[];
  auditLog: AuditEntry[];
  rewardsConfig: RewardsConfig;
  _hydrated: boolean;
  _hydrating: boolean;

  // Products
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (id: number, updates: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  deductStock: (productId: number, type: SaleType, qty: number) => void;

  // Transactions
  addTransaction: (t: Transaction) => void;
  voidTransaction: (id: string) => void;
  completeSale: (input: CompleteSaleInput) => Promise<Transaction | null>;

  // Customers
  addCustomer: (c: Omit<Customer, 'id'>) => Promise<Customer | null>;
  updateCustomer: (id: number, updates: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;
  adjustCustomerPoints: (id: number, delta: number) => void;
  linkCustomerToTransaction: (
    customerId: number,
    total: number,
    earned: number,
    redeemed: number
  ) => void;

  // Audit
  logAudit: (
    action: string,
    details: string,
    user?: string,
    role?: string
  ) => void;
  clearAuditLog: () => void;

  // Rewards config
  updateRewardsConfig: (config: Partial<RewardsConfig>) => void;

  // Hydration
  hydrate: () => Promise<void>;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      products: [],
      transactions: [],
      customers: [],
      auditLog: [],
      rewardsConfig: { ...defaultRewardsConfig },
      _hydrated: false,
      _hydrating: false,

      // ============ PRODUCTS ============

      addProduct: async p => {
        try {
          const res = await api.post<{ data: Record<string, any> }>('/products', {
            name: p.name,
            retailBarcode: p.retailBarcode,
            wholesaleBarcode: p.wholesaleBarcode,
            retailPrice: p.retailPrice,
            wholesalePrice: p.wholesalePrice,
            retailStock: p.retailStock,
            wholesaleStock: p.wholesaleStock,
            defaultType: p.defaultType,
            categoryId: 1 // will be refined later
          });
          const product = { ...normalizeProduct(res.data), category: p.category };
          set(s => ({ products: [...s.products, product] }));
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore
            .getState()
            .showToast(err.message || 'Failed to add product', 'error');
        }
      },

      updateProduct: async (id, updates) => {
        try {
          const { category, ...apiUpdates } = updates as any;
          await api.put<{ data: Product }>(`/products/${id}`, apiUpdates);
          set(s => ({
            products: s.products.map(p =>
              p.id === id ? { ...p, ...updates } : p
            )
          }));
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore
            .getState()
            .showToast(err.message || 'Failed to update product', 'error');
        }
      },

      deleteProduct: async id => {
        try {
          await api.del(`/products/${id}`);
          set(s => ({ products: s.products.filter(p => p.id !== id) }));
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore
            .getState()
            .showToast(err.message || 'Failed to delete product', 'error');
        }
      },

      deductStock: (productId, type, qty) => {
        // Called alongside completeSale — the API handles stock atomically.
        // This local fallback is used when API is not available.
        set(s => ({
          products: s.products.map(p => {
            if (p.id !== productId) return p;
            if (type === 'ws')
              return {
                ...p,
                wholesaleStock: Math.max(0, p.wholesaleStock - qty)
              };
            return { ...p, retailStock: Math.max(0, p.retailStock - qty) };
          })
        }));
      },

      // ============ TRANSACTIONS ============

      addTransaction: t =>
        set(s => ({
          transactions: [t, ...s.transactions]
        })),

      voidTransaction: async id => {
        try {
          await api.put(`/transactions/${id}/void`);
          set(s => ({
            transactions: s.transactions.filter(t => t.id !== id)
          }));
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore
            .getState()
            .showToast(err.message || 'Failed to void transaction', 'error');
        }
      },

      completeSale: async input => {
        try {
          const res = await api.post<{ data: Record<string, any> }>(
            '/transactions',
            input
          );
          const tx = normalizeTx(res.data);
          set(s => ({ transactions: [tx, ...s.transactions] }));

          // Re-fetch customers if a customer was linked (points changed server-side)
          if (input.customerId) {
            try {
              const custRes = await api.get<{ data: Record<string, any>[] }>(
                '/customers?limit=500'
              );
              set({ customers: custRes.data.map(normalizeCustomer) });
            } catch {
              /* non-fatal */
            }
          }

          return tx;
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore
            .getState()
            .showToast(err.message || 'Sale failed', 'error');
          return null;
        }
      },

      // ============ CUSTOMERS ============

      addCustomer: async c => {
        try {
          const res = await api.post<{ data: Record<string, any> }>(
            '/customers',
            c
          );
          const customer = normalizeCustomer(res.data);
          set(s => ({ customers: [...s.customers, customer] }));
          return customer;
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore
            .getState()
            .showToast(err.message || 'Failed to add customer', 'error');
          return null;
        }
      },

      updateCustomer: async (id, updates) => {
        try {
          await api.put(`/customers/${id}`, updates);
          set(s => ({
            customers: s.customers.map(c =>
              c.id === id ? { ...c, ...updates } : c
            )
          }));
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore
            .getState()
            .showToast(err.message || 'Failed to update customer', 'error');
        }
      },

      deleteCustomer: async id => {
        try {
          await api.del(`/customers/${id}`);
          set(s => ({ customers: s.customers.filter(c => c.id !== id) }));
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore
            .getState()
            .showToast(err.message || 'Failed to delete customer', 'error');
        }
      },

      adjustCustomerPoints: async (id, delta) => {
        try {
          await api.patch(`/customers/${id}/points`, { delta });
          set(s => ({
            customers: s.customers.map(c =>
              c.id === id ? { ...c, points: Math.max(0, c.points + delta) } : c
            )
          }));
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore
            .getState()
            .showToast(err.message || 'Failed to adjust points', 'error');
        }
      },

      linkCustomerToTransaction: (customerId, total, earned, redeemed) =>
        set(s => ({
          customers: s.customers.map(c =>
            c.id === customerId
              ? {
                  ...c,
                  points: c.points - redeemed + earned,
                  totalSpent: (c.totalSpent || 0) + total
                }
              : c
          )
        })),

      // ============ AUDIT ============

      logAudit: (action, details, user, role) => {
        const state = get();
        const auditUser = user || 'System';
        const auditRole = role || 'system';
        state.auditLog.unshift({
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          user: auditUser,
          role: auditRole,
          action,
          details
        });
        if (state.auditLog.length > 500) {
          state.auditLog.splice(500);
        }
        set({ auditLog: [...state.auditLog] });
      },

      clearAuditLog: async () => {
        try {
          await api.del('/audit-log');
          set({ auditLog: [] });
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore
            .getState()
            .showToast(err.message || 'Failed to clear audit log', 'error');
        }
      },

      // ============ REWARDS CONFIG ============

      updateRewardsConfig: async config => {
        try {
          await api.put('/rewards/config', config);
          set(s => ({ rewardsConfig: { ...s.rewardsConfig, ...config } }));
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore
            .getState()
            .showToast(
              err.message || 'Failed to update rewards config',
              'error'
            );
        }
      },

      // ============ HYDRATION ============

      hydrate: async () => {
        set({ _hydrating: true });
        try {
          const [
            productsRes,
            transactionsRes,
            customersRes,
            auditRes,
            rewardsRes
          ] = await Promise.all([
            api
              .get<{ data: any[] }>('/products?limit=1000')
              .catch(() => ({ data: [] })),
            api
              .get<{ data: any[] }>('/transactions?limit=500')
              .catch(() => ({ data: [] })),
            api
              .get<{ data: any[] }>('/customers?limit=500')
              .catch(() => ({ data: [] })),
            api
              .get<{ data: any[] }>('/audit-log?limit=500')
              .catch(() => ({ data: [] })),
            api
              .get<{ data: any }>('/rewards/config')
              .catch(() => ({ data: null }))
          ]);

          set({
            products: productsRes.data.map(normalizeProduct),
            transactions: transactionsRes.data.map(normalizeTx),
            customers: customersRes.data.map(normalizeCustomer),
            auditLog: auditRes.data.map(normalizeAudit),
            rewardsConfig: rewardsRes.data ? normalizeRewardsConfig(rewardsRes.data) : { ...defaultRewardsConfig },
            _hydrated: true,
            _hydrating: false
          });
        } catch (err) {
          set({ _hydrating: false });
          throw err;
        }
      }
    }),
    {
      name: 'ruizpos_data',
      partialize: state => ({
        products: state.products,
        transactions: state.transactions,
        customers: state.customers,
        auditLog: state.auditLog,
        rewardsConfig: state.rewardsConfig
      }),
      merge: (persisted, current) => {
        const data = (persisted as any) || {};
        let prods: Product[] = data.products || [];
        // Legacy migration: barcode -> retailBarcode
        prods = prods.map((p: any) => {
          let item = p;
          if (p.barcode && !p.retailBarcode) {
            item = {
              ...p,
              retailBarcode: p.barcode,
              wholesaleBarcode: '22' + String(p.barcode).slice(2)
            };
            delete (item as any).barcode;
          }
          if (!item.category) item = { ...item, category: 'Others' };
          return item;
        });
        return {
          ...current,
          products: prods,
          transactions: data.transactions || [],
          customers: data.customers || [],
          auditLog: data.auditLog || [],
          rewardsConfig: data.rewardsConfig || { ...defaultRewardsConfig }
        };
      }
    }
  )
);
