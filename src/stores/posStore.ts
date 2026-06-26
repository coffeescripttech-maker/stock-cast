import { create } from 'zustand';
import type { CartItem, SearchResult } from '../types/pos';
import type { SaleType } from '../types/product';
import type { Customer } from '../types/customer';
import type { Transaction } from '../types/transaction';

interface POSState {
  cart: CartItem[];
  searchQuery: string;
  searchResults: SearchResult[];
  searchSelectedIndex: number;
  linkedCustomer: Customer | null;
  redeemPoints: number;
  lastReceipt: Transaction | null;
  receiptIsShowing: boolean;

  setSearchQuery: (q: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSearchSelectedIndex: (idx: number) => void;
  addToCart: (productId: number, name: string, type: SaleType, price: number) => void;
  removeFromCart: (index: number) => void;
  updateCartItemQty: (index: number, delta: number) => void;
  setCartItemQty: (index: number, qty: number) => void;
  toggleCartItemType: (index: number, type: SaleType, newPrice: number) => void;
  clearCart: () => void;
  linkCustomer: (c: Customer) => void;
  unlinkCustomer: () => void;
  toggleRedeem: (config: { redeemEvery: number; redeemValue: number }) => number;
  setReceiptShowing: (v: boolean) => void;
  setLastReceipt: (t: Transaction) => void;
}

export const usePOSStore = create<POSState>()((set, get) => ({
  cart: [],
  searchQuery: '',
  searchResults: [],
  searchSelectedIndex: -1,
  linkedCustomer: null,
  redeemPoints: 0,
  lastReceipt: null,
  receiptIsShowing: false,

  setSearchQuery: (q) => set({ searchQuery: q }),

  setSearchResults: (results) => set({ searchResults: results }),

  setSearchSelectedIndex: (idx) => set({ searchSelectedIndex: idx }),

  addToCart: (productId, name, type, price) => set((s) => {
    const existing = s.cart.find((c) => c.productId === productId && c.type === type);
    if (existing) {
      return { cart: s.cart.map((c) => c === existing ? { ...c, qty: c.qty + 1 } : c) };
    }
    return { cart: [...s.cart, { productId, name, type, qty: 1, price }] };
  }),

  removeFromCart: (index) => set((s) => ({
    cart: s.cart.filter((_, i) => i !== index),
  })),

  updateCartItemQty: (index, delta) => set((s) => ({
    cart: s.cart.map((item, i) =>
      i === index ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ),
  })),

  setCartItemQty: (index, qty) => set((s) => ({
    cart: s.cart.map((item, i) =>
      i === index ? { ...item, qty: Math.max(1, qty) } : item
    ),
  })),

  toggleCartItemType: (index, type, newPrice) => set((s) => ({
    cart: s.cart.map((item, i) =>
      i === index ? { ...item, type, price: newPrice } : item
    ),
  })),

  clearCart: () => set({ cart: [], linkedCustomer: null, redeemPoints: 0 }),

  linkCustomer: (c) => set({ linkedCustomer: c, redeemPoints: 0 }),

  unlinkCustomer: () => set({ linkedCustomer: null, redeemPoints: 0 }),

  toggleRedeem: (config) => {
    const state = get();
    if (!state.linkedCustomer || state.linkedCustomer.points < config.redeemEvery) return 0;
    const newPoints = state.redeemPoints > 0
      ? 0
      : Math.floor(state.linkedCustomer.points / config.redeemEvery) * config.redeemEvery;
    set({ redeemPoints: newPoints });
    return newPoints;
  },

  setReceiptShowing: (v) => set({ receiptIsShowing: v }),

  setLastReceipt: (t) => set({ lastReceipt: t }),
}));
