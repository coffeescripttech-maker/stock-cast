import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { usePOSStore } from '../../stores/posStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';
import { fmtCurrency } from '../../lib/formatters';
import type { SearchResult } from '../../types/pos';
import type { Product, SaleType } from '../../types/product';

export function ProductSearch() {
  const products = useDataStore((s) => s.products);
  const addToCart = usePOSStore((s) => s.addToCart);
  const showToast = useUIStore((s) => s.showToast);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter products on query change
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setOpen(false);
      setSelectedIdx(-1);
      return;
    }

    const matched: SearchResult[] = [];
    products.forEach((p: Product) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const rtMatch = p.retailBarcode.toLowerCase().includes(q);
      const wsMatch = p.wholesaleBarcode.toLowerCase().includes(q);

      if (rtMatch) matched.push({ ...p, _matchType: 'rt' as SaleType });
      else if (wsMatch) matched.push({ ...p, _matchType: 'ws' as SaleType });
      else if (nameMatch) matched.push({ ...p, _matchType: p.defaultType });
    });

    setResults(matched);
    setOpen(matched.length > 0);
    setSelectedIdx(-1);
  }, [query, products]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        resultsRef.current && !resultsRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function addToCartFromResult(sr: SearchResult) {
    const price = sr._matchType === 'ws' ? sr.wholesalePrice : sr.retailPrice;
    addToCart(sr.id, sr.name, sr._matchType, price);
    showToast(`Added ${sr.name} (${sr._matchType.toUpperCase()})`, 'success');
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && results[selectedIdx]) {
        addToCartFromResult(results[selectedIdx]);
      } else if (results.length === 1) {
        addToCartFromResult(results[0]);
      } else {
        // Try exact barcode match
        const q = query.trim();
        const rt = products.find((p) => p.retailBarcode === q);
        const ws = products.find((p) => p.wholesaleBarcode === q);
        if (rt) addToCartFromResult({ ...rt, _matchType: 'rt' });
        else if (ws) addToCartFromResult({ ...ws, _matchType: 'ws' });
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && results.length > 0 && setOpen(true)}
          placeholder="Search product name or scan barcode…"
          className={cn(
            'w-full pl-10 pr-4 py-3 text-sm rounded-xl border bg-white dark:bg-slate-800 outline-none transition-colors',
            'border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100',
            'focus:border-brand dark:focus:border-brand',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'font-sans'
          )}
        />
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          ref={resultsRef}
          className={cn(
            'absolute top-full left-0 right-0 z-40 mt-1.5',
            'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600',
            'rounded-xl shadow-xl overflow-hidden',
            'animate-[fadeIn_0.15s_ease]'
          )}
        >
          {results.map((sr, i) => {
            const isWS = sr._matchType === 'ws';
            const bc = isWS ? sr.wholesaleBarcode : sr.retailBarcode;
            const price = isWS ? sr.wholesalePrice : sr.retailPrice;
            return (
              <button
                key={`${sr.id}-${sr._matchType}`}
                onMouseDown={() => addToCartFromResult(sr)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                  'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                  i === selectedIdx && 'bg-slate-50 dark:bg-slate-700/50',
                  'border-b border-slate-100 dark:border-slate-700 last:border-b-0'
                )}
              >
                <div className="min-w-0 mr-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {sr.name}
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded',
                      sr._matchType === 'rt'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    )}>
                      {sr._matchType.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{bc}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-brand">₱{fmtCurrency(price)}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">RT:{sr.retailStock} WS:{sr.wholesaleStock}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
