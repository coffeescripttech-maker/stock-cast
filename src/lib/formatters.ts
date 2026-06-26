import type { TierKey, TierInfo } from '../types/customer';
import type { Transaction } from '../types/transaction';
import { defaultRewardsConfig } from './constants';
import { useSettingsStore } from '../stores/settingsStore';

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function fmtCurrency(amount: number): string {
  const n = Number(amount);
  if (isNaN(n)) return '0.00';

  try {
    const tax = useSettingsStore.getState().settings.tax;
    const { currencySymbol, currencyPosition, decimalSeparator, thousandSeparator } = tax;

    const parts = n.toFixed(2).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    const formatted = `${intPart}${decimalSeparator}${parts[1]}`;

    return currencyPosition === 'before'
      ? `${currencySymbol}${formatted}`
      : `${formatted}${currencySymbol}`;
  } catch {
    // Fallback if store isn't loaded yet
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

/** Safe .toFixed(2) — never throws on null/undefined/NaN/string */
export function fmtFixed(n: number): string {
  const v = Number(n);
  if (isNaN(v)) return '0.00';
  return v.toFixed(2);
}

export function generateTxId(transactions: Transaction[]): string {
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10).replace(/-/g, '');
  const todayCount = transactions.filter(t => String(t.id).startsWith(dateKey)).length;
  return `${dateKey}-${String(todayCount + 1).padStart(4, '0')}`;
}

export function getCustomerTier(points: number, config?: { silverMin: number; goldMin: number }): TierInfo {
  const cfg = config ?? { silverMin: defaultRewardsConfig.silverMin, goldMin: defaultRewardsConfig.goldMin };
  if (points >= cfg.goldMin) return { key: 'gold' as TierKey, label: 'Gold', color: '#f59e0b', bg: '#fef3c7' };
  if (points >= cfg.silverMin) return { key: 'silver' as TierKey, label: 'Silver', color: '#64748b', bg: '#f1f5f9' };
  return { key: 'bronze' as TierKey, label: 'Bronze', color: '#b45309', bg: '#fef9ec' };
}
