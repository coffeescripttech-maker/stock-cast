import { Lock, Unlock } from 'lucide-react';
import { usePOSStore } from '../../stores/posStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';
import type { SaleType } from '../../types/product';

interface Option {
  value: SaleType | null;
  label: string;
  sub: string;
  active: string;
  dot: string;
}

const OPTIONS: Option[] = [
  {
    value: null,
    label: 'Auto',
    sub: 'per product',
    active: 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900',
    dot: 'bg-slate-400',
  },
  {
    value: 'rt',
    label: 'Retail',
    sub: 'all retail',
    active: 'bg-emerald-500 text-white',
    dot: 'bg-emerald-400',
  },
  {
    value: 'ws',
    label: 'Wholesale',
    sub: 'all wholesale',
    active: 'bg-amber-500 text-white',
    dot: 'bg-amber-400',
  },
];

export function SaleModeToggle() {
  const saleMode = usePOSStore((s) => s.saleMode);
  const setSaleMode = usePOSStore((s) => s.setSaleMode);
  const showToast = useUIStore((s) => s.showToast);

  const locked = saleMode !== null;

  function select(value: SaleType | null) {
    if (value === saleMode) return;
    setSaleMode(value);
    if (value === null) {
      showToast('Sale mode: Auto — price follows each product', 'info');
    } else {
      showToast(
        `Sale mode locked: ${value === 'ws' ? 'WHOLESALE' : 'RETAIL'} — every item will be charged at ${value === 'ws' ? 'wholesale' : 'retail'} price`,
        value === 'ws' ? 'success' : 'success'
      );
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {locked ? (
          <Lock size={11} className="text-slate-500 dark:text-slate-400" />
        ) : (
          <Unlock size={11} />
        )}
        Mode
      </span>
      <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
        {OPTIONS.map((opt) => {
          const active = saleMode === opt.value;
          return (
            <button
              key={opt.label}
              onClick={() => select(opt.value)}
              title={`${opt.label} — ${opt.sub}`}
              className={cn(
                'px-3 py-2 text-[11px] font-bold transition-colors flex items-center gap-1.5',
                active
                  ? opt.active
                  : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-white/80' : opt.dot)} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}