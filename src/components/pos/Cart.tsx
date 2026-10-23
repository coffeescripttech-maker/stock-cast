import { ShoppingCart, Search, X, ArrowDownUp, Rows3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePOSStore } from '../../stores/posStore';
import { useDataStore } from '../../stores/dataStore';
import { useUIStore } from '../../stores/uiStore';
import { CartItemRow } from './CartItemRow';
import { cn } from '../../lib/cn';
import { fmtCurrency } from '../../lib/formatters';
import { effectiveStock } from '../../lib/stock';
import type { SaleType } from '../../types/product';

export function Cart() {
  const cart = usePOSStore((s) => s.cart);
  const saleMode = usePOSStore((s) => s.saleMode);
  const updateCartItemQty = usePOSStore((s) => s.updateCartItemQty);
  const setCartItemQty = usePOSStore((s) => s.setCartItemQty);
  const toggleCartItemType = usePOSStore((s) => s.toggleCartItemType);
  const removeFromCart = usePOSStore((s) => s.removeFromCart);
  const products = useDataStore((s) => s.products);
  const showToast = useUIStore((s) => s.showToast);
  const [query, setQuery] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const [compactRows, setCompactRows] = useState(true);
  // F2 shortcut: index of the cart line whose qty editor is open (-1 = none).
  const [editIdx, setEditIdx] = useState(-1);
  const [editNonce, setEditNonce] = useState(0);

  // F2: first press edits the last item (most recently added), then goes backwards
  useEffect(() => {
    if (cart.length === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'F2') return;
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      e.preventDefault();
      setEditIdx((prev) => {
        if (prev < 0) return cart.length - 1; // Unang pindot -> huling item
        const next = prev - 1;
        return next < 0 ? cart.length - 1 : next; // Pabalik, pag nasa first item babalik sa last
      });
      setEditNonce((n) => n + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart.length]);

  // Keep the row being edited in view.
  useEffect(() => {
    if (editIdx < 0) return;
    document
      .querySelector(`[data-cart-row="${editIdx}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [editIdx, editNonce]);

  const totalUnits = cart.reduce((s, c) => s + c.qty, 0);
  const subtotal = cart.reduce((s, c) => s + c.qty * c.price, 0);

  const barcodeByProduct = new Map(
    products.map((p) => [
      p.id,
      `${p.retailBarcode ?? ''} ${p.wholesaleBarcode ?? ''}`.toLowerCase()
    ])
  );
  const q = query.trim().toLowerCase();
  const cartIndexed = cart.map((item, i) => ({ item, i }));
  const visibleItems = (q
    ? cartIndexed.filter(
        ({ item }) =>
          item.name.toLowerCase().includes(q) ||
          (barcodeByProduct.get(item.productId) ?? '').includes(q)
      )
    : cartIndexed
  ).sort((a, b) => (newestFirst ? b.i - a.i : a.i - b.i));

  /** Max units of a cart line that the stock pool allows. */
  function stockCap(item: { productId: number; type: SaleType }): number {
    const product = products.find((p) => p.id === item.productId);
    return product ? effectiveStock(product, item.type) : Number.POSITIVE_INFINITY;
  }

  function handleUpdateQty(idx: number, delta: number) {
    const item = cart[idx];
    if (!item) return;
    const cap = stockCap(item);
    const next = Math.max(1, item.qty + delta);
    if (delta > 0 && next > cap) {
      if (item.qty >= cap) {
        showToast(
          cap <= 0
            ? `${item.name} is out of stock`
            : `Only ${cap} of ${item.name} in stock`,
          'error'
        );
        return;
      }
      updateCartItemQty(idx, cap - item.qty);
      showToast(`Only ${cap} of ${item.name} in stock`, 'error');
      return;
    }
    updateCartItemQty(idx, delta);
  }

  function handleSetQty(idx: number, qty: number) {
    const item = cart[idx];
    if (!item) return;
    const cap = stockCap(item);
    if (qty > cap) {
      showToast(`Only ${cap} of ${item.name} in stock`, 'error');
      setCartItemQty(idx, Math.max(1, cap));
      return;
    }
    setCartItemQty(idx, qty);
  }

  function handleToggleType(idx: number, type: SaleType) {
    const item = cart[idx];
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;
    const cap = effectiveStock(product, type);
    if (cap <= 0) {
      showToast(
        `No ${type.toUpperCase()} stock for ${product.name}`,
        'error'
      );
      return;
    }
    const newPrice = type === 'ws' ? product.wholesalePrice : product.retailPrice;
    toggleCartItemType(idx, type, newPrice);
    if (item.qty > cap) {
      setCartItemQty(idx, cap);
      showToast(`Only ${cap} of ${product.name} at ${type.toUpperCase()}`, 'error');
    }
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <ShoppingCart size={22} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Cart is empty</p>
        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
          Add products from the grid
        </p>
        <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-300 dark:text-slate-600">
          <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">↑↓</kbd>
          <span>Navigate</span>
          <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 ml-1">Enter</kbd>
          <span>Add</span>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:flex lg:flex-col lg:flex-1 lg:min-h-0">
      {/* Mini summary bar */}
      <div className="flex items-center justify-between gap-2 px-1 pb-1 border-b border-slate-100 dark:border-slate-700/50 mb-2">
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {cart.length} line{cart.length !== 1 && 's'} · {totalUnits} unit{totalUnits !== 1 && 's'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewestFirst((v) => !v)}
            title={newestFirst ? 'Oldest first' : 'Newest first'}
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors',
              newestFirst
                ? 'text-brand bg-brand/5 hover:bg-brand/10'
                : 'text-slate-400 dark:text-slate-500 hover:text-brand hover:bg-brand/5'
            )}>
            <ArrowDownUp size={11} />
            {newestFirst ? 'Newest' : 'Oldest'}
          </button>
          <button
            onClick={() => setCompactRows((v) => !v)}
            title={compactRows ? 'Roomier rows (fewer visible)' : 'Slim rows (see more items)'}
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors',
              compactRows
                ? 'text-brand bg-brand/5 hover:bg-brand/10'
                : 'text-slate-400 dark:text-slate-500 hover:text-brand hover:bg-brand/5'
            )}>
            <Rows3 size={11} />
            {compactRows ? 'Slim' : 'Roomier'}
          </button>
          <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
            {fmtCurrency(subtotal)}
          </span>
        </div>
      </div>

      {/* Cart search — filter by product name or barcode */}
      <div className="relative mb-2 flex-shrink-0">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search cart (${cart.length} item${cart.length !== 1 ? 's' : ''})…`}
          className="w-full pl-8 pr-16 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            title="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Scrollable cart items — on desktop this fills the remaining card
          height so the product list scrolls independently on the left */}
      <div className="max-h-[400px] overflow-y-auto overscroll-contain space-y-1 pr-1 lg:max-h-none lg:flex-1 lg:min-h-0">
        {visibleItems.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
            No match in cart{query.trim() && (
              <button
                onClick={() => setQuery('')}
                className="ml-1.5 underline text-brand hover:no-underline">
                clear
              </button>
            )}
          </div>
        ) : (
          visibleItems.map(({ item, i }) => (
            <CartItemRow
              key={`${item.productId}-${item.type}`}
              item={item}
              index={i}
              locked={saleMode !== null}
              compact={compactRows}
              onUpdateQty={handleUpdateQty}
              onSetQty={handleSetQty}
              onToggleType={handleToggleType}
              onRemove={removeFromCart}
              forceEdit={editIdx === i ? editNonce : 0}
              onEditComplete={() => setEditIdx(-1)}
            />
          ))
        )}
      </div>
    </div>
  );
}
