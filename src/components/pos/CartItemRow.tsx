import { useState, useRef, useEffect } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { fmtCurrency } from '../../lib/formatters';
import type { CartItem } from '../../types/pos';
import type { SaleType } from '../../types/product';

interface CartItemRowProps {
  item: CartItem;
  index: number;
  /** When a global sale mode is locked, the per-line RT/WS toggle is hidden. */
  locked?: boolean;
  /** Single-line dense layout — shows many more rows without scrolling. */
  compact?: boolean;
  onUpdateQty: (idx: number, delta: number) => void;
  onSetQty: (idx: number, qty: number) => void;
  onToggleType: (idx: number, type: SaleType) => void;
  onRemove: (idx: number) => void;
}

export function CartItemRow({ item, index, locked = false, compact = false, onUpdateQty, onSetQty, onToggleType, onRemove }: CartItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(item.qty));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setEditValue(String(item.qty));
      setTimeout(() => inputRef.current?.select(), 30);
    }
  }, [editing]);

  function commitEdit() {
    const v = parseInt(editValue);
    if (!isNaN(v) && v > 0) onSetQty(index, v);
    setEditing(false);
  }

  const typeColor = item.type === 'rt'
    ? { bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400', bg: 'bg-emerald-50/30 dark:bg-emerald-950/10' }
    : { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400', bg: 'bg-amber-50/30 dark:bg-amber-950/10' };

  if (compact) {
    return (
      <div
        className={cn(
          'relative pl-3 pr-2 py-1.5 rounded-xl border transition-all duration-150 group hover:shadow-md',
          'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50',
          typeColor.bg
        )}
      >
        {/* Left accent bar */}
        <div className={cn('absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full', typeColor.bar)} />

        {/* Single line: name · unit price · qty stepper · remove */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {item.name}
            </div>
            <span
              onClick={() => !locked && onToggleType(index, item.type === 'rt' ? 'ws' : 'rt')}
              title="Click to toggle sale type"
              className={cn(
                'px-1 py-px rounded text-[8px] font-bold flex-shrink-0',
                locked ? 'cursor-default' : 'cursor-pointer hover:opacity-80',
                typeColor.badge
              )}
            >
              {item.type.toUpperCase()}
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
            {fmtCurrency(item.price)}/{item.type === 'ws' ? 'case' : 'pc'}
          </span>

          {/* Quantity controls — grouped pill (compact) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-lg p-0.5 flex-shrink-0">
            <button
              onClick={() => onUpdateQty(index, -10)}
              className="w-8 h-8 rounded flex items-center justify-center text-[9px] font-bold text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title="-10"
            >
              -10
            </button>
            <button
              onClick={() => onUpdateQty(index, -1)}
              className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Minus size={13} />
            </button>
            {editing ? (
              <input
                ref={inputRef}
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                  if (e.key === 'Escape') { setEditing(false); }
                }}
                className="w-8 text-center text-[11px] font-bold font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-600 rounded border border-brand outline-none"
                min="1"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-8 text-center text-[11px] font-bold font-mono text-slate-900 dark:text-slate-100 cursor-text hover:bg-white dark:hover:bg-slate-600 rounded transition-colors"
              >
                {item.qty}
              </button>
            )}
            <button
              onClick={() => onUpdateQty(index, 1)}
              className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Plus size={13} />
            </button>
            <button
              onClick={() => onUpdateQty(index, 10)}
              className="w-8 h-8 rounded flex items-center justify-center text-[9px] font-bold text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title="+10"
            >
              +10
            </button>
          </div>

          <button
            onClick={() => onRemove(index)}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative pl-3 pr-3 py-2 rounded-xl border transition-all duration-150 group hover:shadow-md',
        'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50',
        typeColor.bg
      )}
    >
      {/* Left accent bar */}
      <div className={cn('absolute left-0 top-2 bottom-2 w-[3px] rounded-full', typeColor.bar)} />

      {/* Row 1: Name + line total + remove */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
            {item.name}
          </div>
        </div>
        <div className="text-sm font-black font-mono text-brand">
          {fmtCurrency(item.qty * item.price)}
        </div>
        <button
          onClick={() => onRemove(index)}
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 w-8 h-8 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all flex-shrink-0"
        >
          <X size={13} />
        </button>
      </div>

      {/* Row 2: Price/unit + type badge + qty controls */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">
            {fmtCurrency(item.price)}/{item.type === 'ws' ? 'case' : 'pc'}
          </span>
          {locked ? (
            <span
              className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold', typeColor.badge)}
              title="Sale mode is locked">
              {item.type.toUpperCase()}
            </span>
          ) : (
            <button
              onClick={() => onToggleType(index, item.type === 'rt' ? 'ws' : 'rt')}
              className={cn('px-2 py-1 sm:px-1.5 sm:py-0.5 rounded text-[10px] sm:text-[9px] font-bold transition-colors hover:opacity-80', typeColor.badge)}
              title="Click to toggle sale type"
            >
              {item.type.toUpperCase()}
            </button>
          )}
        </div>

        {/* Quantity controls — grouped pill */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-lg p-0.5">
          {/* -10 */}
          <button
            onClick={() => onUpdateQty(index, -10)}
            className="w-8 h-8 sm:w-5 sm:h-5 rounded flex items-center justify-center text-[9px] sm:text-[8px] font-bold text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="-10"
          >
            -10
          </button>

          {/* -1 */}
          <button
            onClick={() => onUpdateQty(index, -1)}
            className="w-8 h-8 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Minus size={12} />
          </button>

          {/* Qty number — clickable to edit */}
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                if (e.key === 'Escape') { setEditing(false); }
              }}
              className="w-9 text-center text-xs font-bold font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-600 rounded border border-brand outline-none"
              min="1"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-9 text-center text-xs font-bold font-mono text-slate-900 dark:text-slate-100 cursor-text hover:bg-white dark:hover:bg-slate-600 rounded transition-colors"
            >
              {item.qty}
            </button>
          )}

          {/* +1 */}
          <button
            onClick={() => onUpdateQty(index, 1)}
            className="w-8 h-8 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Plus size={12} />
          </button>

          {/* +10 */}
          <button
            onClick={() => onUpdateQty(index, 10)}
            className="w-8 h-8 sm:w-5 sm:h-5 rounded flex items-center justify-center text-[9px] sm:text-[8px] font-bold text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="+10"
          >
            +10
          </button>
        </div>
      </div>
    </div>
  );
}
