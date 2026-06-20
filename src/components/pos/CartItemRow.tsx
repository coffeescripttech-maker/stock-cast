import { Minus, Plus, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { fmtCurrency } from '../../lib/formatters';
import type { CartItem } from '../../types/pos';
import type { SaleType } from '../../types/product';

interface CartItemRowProps {
  item: CartItem;
  index: number;
  onUpdateQty: (idx: number, delta: number) => void;
  onToggleType: (idx: number, type: SaleType) => void;
  onRemove: (idx: number) => void;
}

export function CartItemRow({ item, index, onUpdateQty, onToggleType, onRemove }: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 animate-[fadeIn_0.2s_ease]">
      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
          {item.name}
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          ₱{fmtCurrency(item.price)} / {item.type === 'ws' ? 'case' : 'pc'}
        </div>
      </div>

      {/* Type toggle */}
      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 flex-shrink-0">
        <button
          onClick={() => onToggleType(index, 'rt')}
          className={cn(
            'px-2 py-1 text-[11px] font-bold transition-colors',
            item.type === 'rt'
              ? 'bg-emerald-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          )}
        >
          RT
        </button>
        <button
          onClick={() => onToggleType(index, 'ws')}
          className={cn(
            'px-2 py-1 text-[11px] font-bold transition-colors',
            item.type === 'ws'
              ? 'bg-amber-500 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          )}
        >
          WS
        </button>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onUpdateQty(index, -1)}
          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="w-8 text-center text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
          {item.qty}
        </span>
        <button
          onClick={() => onUpdateQty(index, 1)}
          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Line total */}
      <div className="text-right flex-shrink-0 w-20">
        <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
          ₱{fmtCurrency(item.qty * item.price)}
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(index)}
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
