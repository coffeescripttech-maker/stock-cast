import { Heart, UserX, Sparkles } from 'lucide-react';
import { usePOSStore } from '../../stores/posStore';
import { useDataStore } from '../../stores/dataStore';
import { fmtCurrency, getCustomerTier } from '../../lib/formatters';
import { cn } from '../../lib/cn';
import type { Customer } from '../../types/customer';

interface OrderSummaryProps {
  onCheckout: () => void;
  onClear: () => void;
  onOpenNFC: () => void;
}

export function OrderSummary({ onCheckout, onClear, onOpenNFC }: OrderSummaryProps) {
  const cart = usePOSStore((s) => s.cart);
  const linkedCustomer = usePOSStore((s) => s.linkedCustomer);
  const redeemPoints = usePOSStore((s) => s.redeemPoints);
  const toggleRedeem = usePOSStore((s) => s.toggleRedeem);
  const unlinkCustomer = usePOSStore((s) => s.unlinkCustomer);
  const rewardsConfig = useDataStore((s) => s.rewardsConfig);

  const totalUnits = cart.reduce((s, c) => s + c.qty, 0);
  const rawTotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const discount = redeemPoints > 0
    ? Math.floor(redeemPoints / rewardsConfig.redeemEvery) * rewardsConfig.redeemValue
    : 0;
  const grandTotal = Math.max(0, rawTotal - discount);

  const canRedeem = !!linkedCustomer && linkedCustomer.points >= rewardsConfig.redeemEvery;

  function handleToggleRedeem() {
    const result = toggleRedeem(rewardsConfig);
    if (result === 0 && !linkedCustomer) return;
  }

  const hasWS = cart.some((c) => c.type === 'ws');
  const checkoutLabel = cart.length === 0
    ? 'Complete Sale'
    : hasWS
      ? (cart.every((c) => c.type === 'ws') ? 'Complete Wholesale Sale' : 'Complete Mixed Sale')
      : 'Complete Retail Sale';

  return (
    <div className="space-y-4">
      {/* Totals */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Total Units</span>
          <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{totalUnits}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
          <span className="font-bold font-mono text-slate-900 dark:text-slate-100">₱{fmtCurrency(rawTotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600 dark:text-emerald-400">Points Discount</span>
            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">-₱{fmtCurrency(discount)}</span>
          </div>
        )}
        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between">
          <span className="text-base font-bold text-slate-900 dark:text-slate-100">Total</span>
          <span className="text-lg font-bold font-mono text-brand">
            ₱{fmtCurrency(grandTotal)}
          </span>
        </div>
      </div>

      {/* Customer section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5">
        {linkedCustomer ? (
          <LinkedCustomerCard
            customer={linkedCustomer}
            redeemPoints={redeemPoints}
            canRedeem={canRedeem}
            earned={Math.floor(grandTotal / (rewardsConfig.earnRate || 1))}
            onToggleRedeem={handleToggleRedeem}
            onUnlink={unlinkCustomer}
          />
        ) : (
          <button
            onClick={onOpenNFC}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-400 dark:text-slate-500 hover:border-brand hover:text-brand transition-colors"
          >
            <Heart size={15} />
            Link Customer via NFC
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-400">
              F11
            </kbd>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all',
            'active:scale-[0.98]',
            cart.length > 0
              ? 'bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/25'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          )}
        >
          <Sparkles size={16} />
          {checkoutLabel}
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/20">F8</kbd>
        </button>

        {cart.length > 0 && (
          <button
            onClick={onClear}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Clear Cart
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">F9</kbd>
          </button>
        )}
      </div>
    </div>
  );
}

/* --- Linked Customer Card --- */

function LinkedCustomerCard({
  customer,
  redeemPoints,
  canRedeem,
  earned,
  onToggleRedeem,
  onUnlink,
}: {
  customer: Customer;
  redeemPoints: number;
  canRedeem: boolean;
  earned: number;
  onToggleRedeem: () => void;
  onUnlink: () => void;
}) {
  const tier = getCustomerTier(customer.points);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-2.5 h-2.5 rounded-full',
            tier.key === 'gold' ? 'bg-amber-400' : tier.key === 'silver' ? 'bg-slate-400' : 'bg-amber-700'
          )} />
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{customer.name}</span>
        </div>
        <button
          onClick={onUnlink}
          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          <UserX size={14} />
        </button>
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500">
        {customer.phone} · {customer.points} pts
        <span className={cn(
          'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold',
          tier.key === 'gold' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
          tier.key === 'silver' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
          'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
        )}>
          {tier.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 p-3 text-center">
          <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Will earn</div>
          <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">+{earned} pts</div>
        </div>
        {canRedeem ? (
          <button
            onClick={onToggleRedeem}
            className={cn(
              'rounded-xl p-3 text-center transition-colors',
              redeemPoints > 0
                ? 'bg-brand text-white'
                : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-brand hover:text-white'
            )}
          >
            <div className="text-[10px] font-semibold opacity-80">
              {redeemPoints > 0 ? 'Redeeming' : 'Redeem pts'}
            </div>
            <div className="text-sm font-bold font-mono">
              {redeemPoints > 0
                ? `-₱${Math.floor(redeemPoints / 100) * 10}`
                : `${customer.points} pts`}
            </div>
          </button>
        ) : (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3 text-center">
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Need 100+ pts</div>
            <div className="text-sm font-bold font-mono text-slate-300 dark:text-slate-600">to redeem</div>
          </div>
        )}
      </div>
    </div>
  );
}
