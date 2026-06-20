import { ShoppingCart } from 'lucide-react';
import { usePOSStore } from '../../stores/posStore';
import { useDataStore } from '../../stores/dataStore';
import { CartItemRow } from './CartItemRow';
import type { SaleType } from '../../types/product';

export function Cart() {
  const cart = usePOSStore((s) => s.cart);
  const updateCartItemQty = usePOSStore((s) => s.updateCartItemQty);
  const toggleCartItemType = usePOSStore((s) => s.toggleCartItemType);
  const removeFromCart = usePOSStore((s) => s.removeFromCart);
  const products = useDataStore((s) => s.products);

  const totalUnits = cart.reduce((s, c) => s + c.qty, 0);

  function handleToggleType(idx: number, type: SaleType) {
    const item = cart[idx];
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;
    const newPrice = type === 'ws' ? product.wholesalePrice : product.retailPrice;
    toggleCartItemType(idx, type, newPrice);
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <ShoppingCart size={28} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cart is empty</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Search a product or scan a barcode above
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {cart.length} line{cart.length !== 1 && 's'} · {totalUnits} unit{totalUnits !== 1 && 's'}
        </span>
      </div>

      {cart.map((item, i) => (
        <CartItemRow
          key={`${item.productId}-${item.type}`}
          item={item}
          index={i}
          onUpdateQty={updateCartItemQty}
          onToggleType={handleToggleType}
          onRemove={removeFromCart}
        />
      ))}
    </div>
  );
}
