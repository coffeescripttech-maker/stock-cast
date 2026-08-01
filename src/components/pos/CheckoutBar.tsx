import { ShoppingBag, Loader2 } from 'lucide-react';
import { usePOSStore } from '../../stores/posStore';
import { useDataStore } from '../../stores/dataStore';
import { fmtCurrency } from '../../lib/formatters';

interface CheckoutBarProps {
  onCheckout: () => void;
  submitting?: boolean;
}

/**
 * Sticky checkout bar for phones/tablets (`< lg`).
 * Sits above the floating BottomNav so the cashier always sees the running
 * total and can check out in one tap — on desktop this component is hidden.
 */
export function CheckoutBar({ onCheckout, submitting }: CheckoutBarProps) {
  const cart = usePOSStore((s) => s.cart);
  const redeemPoints = usePOSStore((s) => s.redeemPoints);
  const rewardsConfig = useDataStore((s) => s.rewardsConfig);

  if (cart.length === 0) return null;

  const totalUnits = cart.reduce((s, c) => s + c.qty, 0);
  const rawTotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const discount =
    redeemPoints > 0
      ? Math.floor(redeemPoints / (rewardsConfig.redeemEvery || 100)) *
        (rewardsConfig.redeemValue || 10)
      : 0;
  const grandTotal = Math.max(0, rawTotal - discount);

  const isReady = !submitting;

  return (
    <div className="fixed inset-x-0 z-30 lg:hidden pointer-events-none px-3 bottom-[calc(env(safe-area-inset-bottom)+82px)]">
      <div className="pointer-events-auto flex items-center gap-3 rounded-[22px] bg-sidebar/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-2 pl-4">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-slate-400 truncate">
            {totalUnits} item{totalUnits !== 1 && 's'} · {cart.length} line{cart.length !== 1 && 's'}
            {discount > 0 && <span className="text-emerald-300"> · −{fmtCurrency(discount)}</span>}
          </div>
          <div className="font-mono font-black text-xl text-white leading-tight tracking-tight">
            {fmtCurrency(grandTotal)}
          </div>
        </div>
        <button
          onClick={onCheckout}
          disabled={!isReady}
          className="flex items-center gap-2 px-5 h-[52px] rounded-2xl bg-brand text-[#1C1C1C] font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
        >
          {submitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ShoppingBag size={18} />
          )}
          Checkout
        </button>
      </div>
    </div>
  );
}
