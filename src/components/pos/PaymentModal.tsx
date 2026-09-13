import { useEffect, useRef, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { fmtCurrency } from '../../lib/formatters';
import { cn } from '../../lib/cn';
import { Banknote, Wallet } from 'lucide-react';

type PaymentMethod = 'cash' | 'gcash' | 'maya';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onComplete: (tx: {
    amountTendered: number;
    change: number;
    paymentMethod: PaymentMethod;
    paymentRef: string | null;
  }) => void;
}

const METHODS: Array<{ key: PaymentMethod; label: string; icon: React.ReactNode }> = [
  { key: 'cash', label: 'Cash', icon: <Banknote size={15} /> },
  { key: 'gcash', label: 'GCash', icon: <Wallet size={15} /> },
  { key: 'maya', label: 'Maya', icon: <Wallet size={15} /> },
];

export function PaymentModal({ open, onOpenChange, total, onComplete }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isOnline = method !== 'cash';
  const parsedAmount = parseFloat(amount) || 0;
  const change = parsedAmount - total;
  const isShort = amount !== '' && parsedAmount < total;
  const isValid = isOnline || parsedAmount >= total;

  useEffect(() => {
    if (open) {
      setMethod('cash');
      setAmount('');
      setPaymentRef('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Quick amounts: round up to nearest denomination
  const quickAmounts = [
    { label: 'Exact', value: total },
    ...([500, 1000, 2000, 5000] as const)
      .filter((d) => d > total)
      .map((d) => ({ label: `₱${d.toLocaleString()}`, value: d })),
  ];

  function handleQuickAmount(value: number) {
    setAmount(String(value));
    inputRef.current?.focus();
  }

  function handleConfirm() {
    if (!isValid) return;
    const payload = isOnline
      ? {
          amountTendered: total,
          change: 0,
          paymentMethod: method,
          paymentRef: paymentRef.trim() || null,
        }
      : {
          amountTendered: parsedAmount,
          change,
          paymentMethod: 'cash' as const,
          paymentRef: null,
        };
    onComplete(payload);
    onOpenChange(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && isValid) {
      // Don't let Enter in the reference field reset — confirm instead
      e.preventDefault();
      handleConfirm();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="💳 Collect Payment" showClose={false}>
      <div className="py-4 space-y-5">
        {/* Total due */}
        <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white">
          <div className="text-xs font-semibold opacity-80 mb-1">Total Amount Due</div>
          <div className="text-3xl font-bold font-mono">{fmtCurrency(total)}</div>
        </div>

        {/* Payment method selector */}
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setMethod(m.key);
                setTimeout(() => inputRef.current?.focus(), 60);
              }}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 rounded-xl border text-sm font-bold transition-all active:scale-[0.97]',
                method === m.key
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-brand hover:text-brand'
              )}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {!isOnline && (
          <>
            {/* Cash input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cash Received from Customer (₱)
              </label>
              <input
                ref={inputRef}
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3.5 text-2xl font-bold font-mono text-right rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                autoFocus
              />
            </div>

            {/* Quick amount buttons */}
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => handleQuickAmount(qa.value)}
                  className={cn(
                    'px-4 py-2 text-sm font-bold rounded-xl border transition-all active:scale-[0.96]',
                    parsedAmount === qa.value
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-brand hover:text-brand'
                  )}
                >
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Change display */}
            {isValid && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Change
                </span>
                <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {fmtCurrency(change)}
                </span>
              </div>
            )}

            {/* Error */}
            {isShort && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                <span>⚠</span>
                <span>Short by {fmtCurrency(total - parsedAmount)}</span>
              </div>
            )}

            {/* Hint */}
            {amount === '' && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Enter amount or tap a quick button · Press{' '}
                <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                  Enter
                </kbd>{' '}
                to confirm
              </p>
            )}
          </>
        )}

        {isOnline && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-brand/10 border border-brand/20">
              <span className="text-sm font-semibold text-brand">Online payment received</span>
              <span className="text-lg font-bold font-mono text-brand">{fmtCurrency(total)}</span>
            </div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reference no. <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={method === 'gcash' ? 'GCash reference no.' : 'Maya reference no.'}
              maxLength={50}
              className="w-full px-4 py-3 text-base font-mono rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              autoFocus
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-1">
              Exact amount — no change. Press{' '}
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                Enter
              </kbd>{' '}
              to confirm
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => onOpenChange(false)}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className="px-6 py-2.5 text-sm font-bold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          ✓ Complete Sale
        </button>
      </div>
    </Dialog>
  );
}