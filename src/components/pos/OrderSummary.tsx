import { useState } from 'react';
import {
  Heart,
  UserX,
  Sparkles,
  Loader2,
  AlertTriangle,
  ShoppingBag,
  QrCode
} from 'lucide-react';
import { usePOSStore } from '../../stores/posStore';
import { useDataStore } from '../../stores/dataStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { fmtCurrency, getCustomerTier } from '../../lib/formatters';
import { cn } from '../../lib/cn';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import type { Customer } from '../../types/customer';

interface OrderSummaryProps {
  onCheckout: () => void;
  onClear: () => void;
  onOpenNFC: () => void;
  submitting?: boolean;
}

export function OrderSummary({
  onCheckout,
  onClear,
  onOpenNFC,
  submitting
}: OrderSummaryProps) {
  const cart = usePOSStore(s => s.cart);
  const linkedCustomer = usePOSStore(s => s.linkedCustomer);
  const redeemPoints = usePOSStore(s => s.redeemPoints);
  const toggleRedeem = usePOSStore(s => s.toggleRedeem);
  const unlinkCustomer = usePOSStore(s => s.unlinkCustomer);
  const rewardsConfig = useDataStore(s => s.rewardsConfig);
  const enableRewards = useSettingsStore(s => s.settings.pos.enableRewards);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const totalUnits = cart.reduce((s, c) => s + c.qty, 0);
  const rawTotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const discount =
    redeemPoints > 0
      ? Math.floor(redeemPoints / rewardsConfig.redeemEvery) *
        rewardsConfig.redeemValue
      : 0;
  const grandTotal = Math.max(0, rawTotal - discount);

  const canRedeem =
    !!linkedCustomer && linkedCustomer.points >= rewardsConfig.redeemEvery;

  function handleToggleRedeem() {
    toggleRedeem(rewardsConfig);
  }

  function handleConfirmClear() {
    onClear();
    setClearConfirmOpen(false);
  }

  const hasWS = cart.some(c => c.type === 'ws');
  const checkoutLabel =
    cart.length === 0
      ? 'Complete Sale'
      : hasWS
        ? cart.every(c => c.type === 'ws')
          ? 'Complete Wholesale Sale'
          : 'Complete Mixed Sale'
        : 'Complete Retail Sale';

  const isReady = cart.length > 0 && !submitting;

  return (
    <div className="space-y-4">
      {/* ─── Order Total (gradient hero card) ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white p-6 shadow-lg">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

        <div className="relative space-y-1">
          <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Order Total
          </div>
          <div className="text-3xl font-black font-mono tracking-tight">
            {fmtCurrency(grandTotal)}
          </div>
        </div>

        <div className="relative mt-4 pt-4 border-t border-white/20 space-y-1.5">
          <div className="flex justify-between text-xs text-white/80">
            <span>
              {totalUnits} unit{totalUnits !== 1 && 's'} · {cart.length} line
              {cart.length !== 1 && 's'}
            </span>
            <span className="font-mono">₱{fmtCurrency(rawTotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-200">
              <span>Points discount</span>
              <span className="font-mono">−₱{fmtCurrency(discount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Customer section (only if rewards enabled) ─── */}
      {enableRewards && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
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
              className="w-full flex items-center justify-between gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center group-hover:bg-brand/20 transition-colors">
                  <QrCode size={18} className="text-brand" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Link Customer
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Tap NFC card to earn loyalty points
                  </div>
                </div>
              </div>
              <kbd className="font-mono text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-400 flex-shrink-0">
                F11
              </kbd>
            </button>
          )}
        </div>
      )}

      {/* ─── Checkout action ─── */}
      <div className="space-y-2.5">
        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || submitting}
          className={cn(
            'w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm transition-all',
            'active:scale-[0.98]',
            isReady
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          )}>
          {submitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ShoppingBag size={18} />
          )}
          {submitting ? 'Processing…' : checkoutLabel}
          {isReady && (
            <kbd className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/20">
              ⌘F8
            </kbd>
          )}
        </button>

        {cart.length > 0 && (
          <button
            onClick={() => setClearConfirmOpen(true)}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors disabled:opacity-30">
            Clear Cart · <kbd className="font-mono text-[9px]">F9</kbd>
          </button>
        )}
      </div>

      {/* Clear cart confirmation */}
      <Dialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        title="">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            Clear Cart?
          </h3>
          <p className="text-sm text-slate-500">
            This will remove all {cart.length} item{cart.length !== 1 && 's'}{' '}
            from the cart and unlink the customer.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => setClearConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmClear}>
              Clear Cart
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

/* ─── Linked Customer Card ─── */

function LinkedCustomerCard({
  customer,
  redeemPoints,
  canRedeem,
  earned,
  onToggleRedeem,
  onUnlink
}: {
  customer: Customer;
  redeemPoints: number;
  canRedeem: boolean;
  earned: number;
  onToggleRedeem: () => void;
  onUnlink: () => void;
}) {
  const tier = getCustomerTier(customer.points);
  const rewardsConfig = useDataStore(s => s.rewardsConfig);

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
      {/* Customer header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full ring-2 ring-offset-1',
              tier.key === 'gold'
                ? 'bg-amber-400 ring-amber-200 dark:ring-amber-800'
                : tier.key === 'silver'
                  ? 'bg-slate-400 ring-slate-200 dark:ring-slate-600'
                  : 'bg-amber-700 ring-amber-200 dark:ring-amber-800'
            )}
          />
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {customer.name}
            </div>
            <div className="text-[11px] text-slate-400">{customer.phone}</div>
          </div>
        </div>
        <button
          onClick={onUnlink}
          className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          title="Unlink customer">
          <UserX size={14} />
        </button>
      </div>

      {/* Points row */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-bold',
              tier.key === 'gold'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : tier.key === 'silver'
                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  : 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
            )}>
            {tier.label}
          </span>
          <span className="text-xs font-mono text-slate-500">
            {customer.points} pts
          </span>
        </div>
        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
          +{earned} pts this sale
        </div>
      </div>

      {/* Redeem button */}
      <div className="p-4 pt-3">
        {canRedeem ? (
          <button
            onClick={onToggleRedeem}
            className={cn(
              'w-full rounded-xl p-3 text-center font-bold text-sm transition-all active:scale-[0.98]',
              redeemPoints > 0
                ? 'bg-brand text-white shadow-sm flex items-center justify-center gap-2'
                : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-brand hover:text-white hover:shadow-sm'
            )}>
            {redeemPoints > 0 ? (
              <>
                <Sparkles size={14} />
                <span>
                  Redeeming −₱
                  {Math.floor(
                    redeemPoints / (rewardsConfig.redeemEvery || 100)
                  ) * (rewardsConfig.redeemValue || 10)}
                </span>
              </>
            ) : (
              <>
                <Heart size={14} />
                <span>Redeem {customer.points} points</span>
              </>
            )}
          </button>
        ) : (
          <div className="w-full rounded-xl bg-slate-50 dark:bg-slate-700/30 p-3 text-center">
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Need {rewardsConfig.redeemEvery}+ pts to redeem
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
