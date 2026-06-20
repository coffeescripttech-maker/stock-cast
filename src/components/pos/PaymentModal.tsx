import { useEffect, useRef, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { fmtCurrency } from '../../lib/formatters';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onComplete: (tx: any) => void;
}

export function PaymentModal({ open, onOpenChange, total, onComplete }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const parsedAmount = parseFloat(amount) || 0;
  const change = parsedAmount - total;
  const isShort = amount !== '' && parsedAmount < total;
  const isValid = parsedAmount >= total;

  useEffect(() => {
    if (open) {
      setAmount('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  function handleConfirm() {
    if (!isValid) return;
    onComplete({
      amountTendered: parsedAmount,
      change,
    });
    onOpenChange(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && isValid) {
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
          <div className="text-3xl font-bold font-mono">₱{fmtCurrency(total)}</div>
        </div>

        {/* Cash input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cash Received from Customer (₱)</label>
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

        {/* Change display */}
        {isValid && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Change</span>
            <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
              ₱{fmtCurrency(change)}
            </span>
          </div>
        )}

        {/* Error */}
        {isShort && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            <span>⚠</span>
            <span>Short by ₱{fmtCurrency(total - parsedAmount)}</span>
          </div>
        )}

        {/* Hint */}
        {amount === '' && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Enter amount · Press <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">Enter</kbd> to confirm
          </p>
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
