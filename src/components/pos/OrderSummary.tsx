import { useState } from 'react';
import {
  Heart,
  UserX,
  Sparkles,
  Loader2,
  AlertTriangle,
  ShoppingBag,
  QrCode,
  Percent
} from 'lucide-react';
import { usePOSStore } from '../../stores/posStore';
import { useDataStore } from '../../stores/dataStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { fmtCurrency, getCustomerTier } from '../../lib/formatters';
import { applyTax } from '../../lib/tax';
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
  const specialDiscount = usePOSStore(s => s.specialDiscount);
  const setSpecialDiscount = usePOSStore(s => s.setSpecialDiscount);
  const rewardsConfig = useDataStore(s => s.rewardsConfig);
  const enableRewards = useSettingsStore(s => s.settings.pos.enableRewards);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const totalUnits = cart.reduce((s, c) => s + c.qty, 0);
  const rawTotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const pointsDiscount =
    redeemPoints > 0
      ? Math.floor(redeemPoints / rewardsConfig.redeemEvery) *
        rewardsConfig.redeemValue
      : 0;
  const specialDiscountAmt = specialDiscount.enabled ? rawTotal * 0.05 : 0;
  const discount = pointsDiscount + specialDiscountAmt;
  const preTaxTotal = Math.max(0, rawTotal - discount);
  const taxSettings = useSettingsStore((s) => s.settings.tax);
  const { taxAmount, total: grandTotal } = applyTax(preTaxTotal, taxSettings);
  const earned = Math.floor(preTaxTotal / (rewardsConfig.earnRate || 1));

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
    <div className="space-y-2 sm:space-y-3">
      {/* ─── Order Total (gradient hero card) ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white p-2.5 sm:p-3 lg:p-3 2xl:p-6 shadow-lg pos-summary-hero">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

        <div className="relative space-y-0.5">
          <div className="text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-wider">
            Order Total
          </div>
          <div className="text-xl sm:text-2xl lg:text-2xl 2xl:text-3xl font-black font-mono tracking-tight pos-summary-hero-total">
            {fmtCurrency(grandTotal)}
          </div>
        </div>

        <div className="relative mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 border-t border-white/20 space-y-0.5 pos-summary-section">
          <div className="flex justify-between text-xs text-white/80">
            <span>
              {totalUnits} unit{totalUnits !== 1 && 's'} · {cart.length} line
              {cart.length !== 1 && 's'}
            </span>
            <span className="font-mono">{fmtCurrency(rawTotal)}</span>
          </div>
          {pointsDiscount > 0 && (
            <div className="flex justify-between text-xs text-emerald-200">
              <span>Points discount</span>
              <span className="font-mono">−{fmtCurrency(pointsDiscount)}</span>
            </div>
          )}
          {specialDiscountAmt > 0 && (
            <div className="flex justify-between text-xs text-emerald-200">
              <span>{specialDiscount.type === 'pwd' ? 'PWD' : 'Senior Citizen'} 5% discount</span>
              <span className="font-mono">−{fmtCurrency(specialDiscountAmt)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-xs text-white/80">
              <span>{taxSettings.label} ({taxSettings.rate}%)</span>
              <span className="font-mono">+{fmtCurrency(taxAmount)}</span>
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
              earned={earned}
              onToggleRedeem={handleToggleRedeem}
              onUnlink={unlinkCustomer}
            />
          ) : (
            <button
              onClick={onOpenNFC}
              className="w-full flex items-center justify-between gap-3 p-2.5 sm:p-3 lg:p-3 2xl:p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center group-hover:bg-brand/20 transition-colors">
                  <QrCode size={18} className="text-brand" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Link Customer
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Tap RFID card to earn loyalty points
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

      {/* ─── PWD/Senior Discount ─── */}
      {cart.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
          <div className="p-2.5 space-y-2">
            <button
              onClick={() => setSpecialDiscount({ enabled: !specialDiscount.enabled })}
              className={cn(
                'w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all text-left',
                specialDiscount.enabled
                  ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  specialDiscount.enabled ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-slate-100 dark:bg-slate-700'
                )}>
                  <Percent size={14} className={specialDiscount.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                </div>
                <div>
                  <div className={cn('text-xs font-bold', specialDiscount.enabled ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300')}>
                    PWD/Senior Citizen Discount (5%)
                  </div>
                  <div className="text-[10px] text-slate-400">Apply 5% discount to subtotal</div>
                </div>
              </div>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', specialDiscount.enabled ? 'bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-400')}>
                {specialDiscount.enabled ? 'ON' : 'OFF'}
              </span>
            </button>
            {specialDiscount.enabled && (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={specialDiscount.type || ''}
                  onChange={(e) => setSpecialDiscount({ type: (e.target.value as 'pwd' | 'senior') || null })}
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:border-emerald-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Select type</option>
                  <option value="pwd">PWD</option>
                  <option value="senior">Senior Citizen</option>
                </select>
                <input
                  type="text"
                  value={specialDiscount.idNumber}
                  onChange={(e) => setSpecialDiscount({ idNumber: e.target.value })}
                  placeholder="ID/SC No. (optional)"
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:border-emerald-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Checkout action ─── */}
      <div className="space-y-2">
          <button
            onClick={onCheckout}
            disabled={cart.length === 0 || submitting}
            className={cn(
              'w-full flex items-center justify-center gap-2.5 py-2 sm:py-2.5 lg:py-2.5 2xl:py-4 rounded-xl font-bold text-sm transition-all pos-checkout-btn',
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
