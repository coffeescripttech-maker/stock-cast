import { useRef, useState, useMemo } from 'react';
import { Search, Package } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { usePOSStore } from '../../stores/posStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';
import { fmtCurrency } from '../../lib/formatters';
import { CATEGORIES, CATEGORY_COLORS } from '../../lib/constants';
import type { Product, SaleType, ProductCategory } from '../../types/product';

const LOW_STOCK_RT = 10;
const LOW_STOCK_WS = 3;

type ViewType = 'all' | SaleType;

export function ProductSearch() {
  const products = useDataStore(s => s.products);
  const addToCart = usePOSStore(s => s.addToCart);
  const showToast = useUIStore(s => s.showToast);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'All'>('All');
  const [viewType, setViewType] = useState<ViewType>('all');

  const inputRef = useRef<HTMLInputElement>(null);

  // Filtered product list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p: Product) => {
      if (category !== 'All' && p.category !== category) return false;
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.retailBarcode.toLowerCase().includes(q) ||
          p.wholesaleBarcode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [query, category, products]);

  function getDefaultSaleType(p: Product): SaleType {
    if (viewType !== 'all') return viewType;
    return p.defaultType;
  }

  function addToCartFromProduct(p: Product, typeOverride?: SaleType) {
    const saleType = typeOverride ?? getDefaultSaleType(p);
    const price = saleType === 'ws' ? p.wholesalePrice : p.retailPrice;
    if (price <= 0) {
      showToast(
        `No ${saleType.toUpperCase()} price set for ${p.name}`,
        'error'
      );
      return;
    }
    addToCart(p.id, p.name, saleType, price);
    showToast(`Added ${p.name} (${saleType.toUpperCase()})`, 'success');
  }

  function getStockInfo(p: Product, type: SaleType) {
    const stock = type === 'ws' ? p.wholesaleStock : p.retailStock;
    const threshold = type === 'ws' ? LOW_STOCK_WS : LOW_STOCK_RT;
    return { stock, isLow: stock < threshold, isOut: stock === 0 };
  }

  return (
    <div className="space-y-4">
      {/* Search bar + view type toggle */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setQuery('');
                inputRef.current?.blur();
              }
            }}
            placeholder="Search name or scan barcode…"
            className="w-full pl-9 pr-4 py-3 text-sm rounded-xl border bg-white dark:bg-slate-800 outline-none transition-colors border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-brand dark:focus:border-brand placeholder:text-slate-400"
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 flex-shrink-0">
          {(['all', 'rt', 'ws'] as const).map(v => (
            <button
              key={v}
              onClick={() => setViewType(v)}
              className={cn(
                'px-4 py-2.5 text-[12px] font-bold transition-colors',
                viewType === v
                  ? v === 'all'
                    ? 'bg-brand text-white'
                    : v === 'rt'
                      ? 'bg-brand text-white'
                      : 'bg-brand/70 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600'
              )}>
              {v === 'all' ? 'ALL' : v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {(['All', ...CATEGORIES] as const).map(cat => {
          const isActive = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat as ProductCategory | 'All')}
              className={cn(
                'flex-shrink-0 px-3.5 py-2 text-[11px] font-bold rounded-xl border transition-all',
                isActive
                  ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                  : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600 hover:border-brand hover:text-brand'
              )}>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Product Grid or Empty State */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Package size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-sm">No products found</p>
          <p className="text-xs mt-1">
            {query
              ? 'Try a different search term or barcode'
              : 'Add products to inventory first'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(p => {
            const defaultType = getDefaultSaleType(p);
            const primaryPrice =
              defaultType === 'ws' ? p.wholesalePrice : p.retailPrice;
            const { stock, isLow, isOut } = getStockInfo(p, defaultType);
            const catColor =
              CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS['Others'];
            const firstChar = p.name.charAt(0).toUpperCase();

            // Determine the "other" type for dual-price display
            const otherType: SaleType = defaultType === 'rt' ? 'ws' : 'rt';
            const otherPrice =
              otherType === 'ws' ? p.wholesalePrice : p.retailPrice;

            return (
              <div
                key={p.id}
                className="group relative bg-white dark:bg-slate-800 rounded-[16px] border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer active:scale-[0.98]"
                onClick={() => addToCartFromProduct(p)}>
                {/* Image area - extra tall for better visual */}
                <div
                  className="relative h-0 w-full pt-[90%] overflow-hidden"
                  style={
                    !p.imageUrl
                      ? {
                          background: `linear-gradient(135deg, ${catColor.bg}, ${catColor.bg}88)`
                        }
                      : undefined
                  }>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : null}

                  {/* Centered initial (when no image) */}
                  {!p.imageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{
                          background: `${catColor.color}22`,
                          color: catColor.color
                        }}>
                        <span className="text-2xl font-black">{firstChar}</span>
                      </div>
                    </div>
                  )}

                  {/* Stock dot */}
                  {/* <div className="absolute top-2.5 right-2.5 z-10">
                    <div
                      className={cn(
                        'w-2.5 h-2.5 rounded-full shadow-sm',
                        isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-emerald-400'
                      )}
                    />
                  </div> */}

                  {/* Stock indicator bar at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-900/10">
                    <div
                      className={cn(
                        'h-full transition-all duration-300 rounded-full',
                        isOut
                          ? 'bg-red-500'
                          : isLow
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                      )}
                      style={{ width: `${Math.min(100, (stock / 50) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Info area - clean */}
                <div className="flex flex-col flex-1 p-3.5 gap-2.5">
                  {/* Name */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
                    {p.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black font-mono text-brand">
                      ₱{fmtCurrency(primaryPrice)}
                    </span>
                    {viewType === 'all' && otherPrice > 0 && (
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        ₱{fmtCurrency(otherPrice)}
                      </span>
                    )}
                  </div>

                  {/* Add button */}
                  {viewType === 'all' &&
                  p.retailPrice > 0 &&
                  p.wholesalePrice > 0 ? (
                    <div className="flex gap-1.5 mt-auto">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          addToCartFromProduct(p, 'rt');
                        }}
                        className="flex-1 py-2 rounded-xl text-[10px] font-bold bg-brand text-white hover:bg-brand-dark transition-colors">
                        RT
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          addToCartFromProduct(p, 'ws');
                        }}
                        className="flex-1 py-2 rounded-xl text-[10px] font-bold border border-brand text-brand hover:bg-brand/5 dark:border-indigo-400 dark:text-indigo-400 transition-colors">
                        WS
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        addToCartFromProduct(p);
                      }}
                      disabled={isOut}
                      className={cn(
                        'w-full py-2 rounded-xl font-bold text-[11px] transition-all mt-auto',
                        isOut
                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-brand text-white hover:bg-brand-dark shadow-sm active:scale-[0.97]'
                      )}>
                      {isOut ? 'Sold Out' : 'Add'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
