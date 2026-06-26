import { ShoppingCart } from 'lucide-react';
import { usePOSStore } from '../../stores/posStore';
import { useDataStore } from '../../stores/dataStore';
import { CartItemRow } from './CartItemRow';
import { fmtCurrency } from '../../lib/formatters';
import type { SaleType } from '../../types/product';

export function Cart() {
  const cart = usePOSStore((s) => s.cart);
  const updateCartItemQty = usePOSStore((s) => s.updateCartItemQty);
  const setCartItemQty = usePOSStore((s) => s.setCartItemQty);
  const toggleCartItemType = usePOSStore((s) => s.toggleCartItemType);
  const removeFromCart = usePOSStore((s) => s.removeFromCart);
  const products = useDataStore((s) => s.products);

  const totalUnits = cart.reduce((s, c) => s + c.qty, 0);
  const subtotal = cart.reduce((s, c) => s + c.qty * c.price, 0);

  function handleToggleType(idx: number, type: SaleType) {
    const item = cart[idx];
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;
    const newPrice = type === 'ws' ? product.wholesalePrice : product.retailPrice;
    toggleCartItemType(idx, type, newPrice);
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
    <div className="space-y-2">
      {/* Mini summary bar */}
      <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100 dark:border-slate-700/50">
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {cart.length} line{cart.length !== 1 && 's'} · {totalUnits} unit{totalUnits !== 1 && 's'}
        </span>
        <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400">
          ₱{fmtCurrency(subtotal)}
        </span>
      </div>

      {/* Cart items */}
      {cart.map((item, i) => (
        <CartItemRow
          key={`${item.productId}-${item.type}`}
          item={item}
          index={i}
          onUpdateQty={updateCartItemQty}
          onSetQty={setCartItemQty}
          onToggleType={handleToggleType}
          onRemove={removeFromCart}
        />
      ))}
    </div>
  );
}
