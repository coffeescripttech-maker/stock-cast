import { Wallet, Banknote } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { PaymentMethod } from '../../types/transaction';

interface PaymentBadgeProps {
  paymentMethod?: PaymentMethod | null;
  className?: string;
}

const STYLES: Record<PaymentMethod, string> = {
  cash: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  gcash: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
  maya: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300',
};

/**
 * Small pill identifying how a transaction was paid. Falls back to "Cash" when
 * the method is missing (pre-upgrade cached transactions).
 */
export function PaymentBadge({ paymentMethod, className }: PaymentBadgeProps) {
  const method = paymentMethod ?? 'cash';
  const Icon = method === 'cash' ? Banknote : Wallet;
  const label = method === 'gcash' ? 'GCash' : method === 'maya' ? 'Maya' : 'Cash';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize',
        STYLES[method],
        className
      )}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}