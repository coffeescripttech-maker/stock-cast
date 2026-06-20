import { useEffect, useState, useCallback } from 'react';
import { usePOSStore } from '../stores/posStore';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ProductSearch } from '../components/pos/ProductSearch';
import { Cart } from '../components/pos/Cart';
import { OrderSummary } from '../components/pos/OrderSummary';
import { PaymentModal } from '../components/pos/PaymentModal';
import { ScannerModal } from '../components/pos/ScannerModal';
import { NFCLinkModal } from '../components/pos/NFCLinkModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import type { Transaction } from '../types/transaction';

export default function POSPage() {
  const cart = usePOSStore((s) => s.cart);
  const clearCart = usePOSStore((s) => s.clearCart);
  const linkedCustomer = usePOSStore((s) => s.linkedCustomer);
  const redeemPoints = usePOSStore((s) => s.redeemPoints);
  const setLastReceipt = usePOSStore((s) => s.setLastReceipt);
  const setReceiptShowing = usePOSStore((s) => s.setReceiptShowing);

  const rewardsConfig = useDataStore((s) => s.rewardsConfig);
  const completeSale = useDataStore((s) => s.completeSale);

  const currentUser = useAuthStore((s) => s.currentUser);
  const showToast = useUIStore((s) => s.showToast);

  // Modal state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [nfcOpen, setNfcOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<Transaction | null>(null);
  const [pendingTotal, setPendingTotal] = useState(0);

  // Compute totals
  const rawTotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const discount = redeemPoints > 0
    ? Math.floor(redeemPoints / rewardsConfig.redeemEvery) * rewardsConfig.redeemValue
    : 0;
  const grandTotal = Math.max(0, rawTotal - discount);

  // ---- Event listeners for keyboard shortcuts ----

  useEffect(() => {
    function onCheckout() {
      if (cart.length === 0) {
        showToast('Cart is empty', 'info');
        return;
      }
      processCheckout();
    }

    function onNfcLink() {
      setNfcOpen(true);
    }

    function onScanner() {
      setScannerOpen(true);
    }

    document.addEventListener('pos:checkout', onCheckout);
    document.addEventListener('pos:nfc-link', onNfcLink);
    document.addEventListener('pos:scanner', onScanner);

    return () => {
      document.removeEventListener('pos:checkout', onCheckout);
      document.removeEventListener('pos:nfc-link', onNfcLink);
      document.removeEventListener('pos:scanner', onScanner);
    };
  }, [cart.length, rawTotal, discount, grandTotal, linkedCustomer, redeemPoints, currentUser]);

  // ---- Handlers ----

  const processCheckout = useCallback(() => {
    if (cart.length === 0) return;
    setPendingTotal(grandTotal);
    setPaymentOpen(true);
  }, [cart.length, grandTotal]);

  function handlePaymentComplete(payment: { amountTendered: number; change: number }) {
    finalizeSale(payment.amountTendered, payment.change);
  }

  async function finalizeSale(amountTendered: number, _change: number) {
    if (!currentUser) return;

    const types = [...new Set(cart.map((c) => c.type))];
    const txType = types.length > 1 ? 'mixed' : types[0];

    // Send sale to API (handles stock deduction, customer points, audit atomically)
    const tx = await completeSale({
      cashierId: currentUser.id || 1,
      type: txType,
      items: cart.map((c) => ({
        productId: c.productId,
        type: c.type,
        qty: c.qty,
        price: c.price,
      })),
      amountTendered,
      customerId: linkedCustomer?.id ?? null,
      pointsRedeemed: redeemPoints,
    });

    if (!tx) {
      showToast('Sale failed — please try again', 'error');
      return;
    }

    // Store receipt and show
    setLastReceipt(tx);
    setCurrentReceipt(tx);
    setReceiptShowing(true);

    // Clear cart
    clearCart();

    // Show receipt modal
    setReceiptOpen(true);

    showToast('Sale completed! Press Enter to print receipt.', 'success');
  }

  function handlePrintReceipt() {
    setReceiptShowing(false);
    window.print();
    setReceiptOpen(false);
  }

  // The keyboard shortcut hook checks receiptIsShowing to handle Enter -> print
  // We must close the receipt modal after print
  function handleReceiptClose(open: boolean) {
    setReceiptOpen(open);
    if (!open) {
      setReceiptShowing(false);
    }
  }

  return (
    <div className="animate-[fadeUp_0.25s_ease]">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Point of Sale</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          Search by name or scan a barcode — sale type is auto-detected per product
        </p>
      </div>

      {/* Shortcuts bar */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {[
          { kbd: 'F4', label: 'Print' },
          { kbd: 'F8', label: 'Checkout' },
          { kbd: 'F9', label: 'Clear' },
          { kbd: 'F11', label: 'NFC Link' },
          { kbd: 'F12', label: 'Scanner' },
          { kbd: '↑↓', label: 'Navigate' },
          { kbd: 'Enter', label: 'Select' },
        ].map((s) => (
          <span
            key={s.kbd}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-[10px] font-medium text-slate-500 dark:text-slate-400"
          >
            <kbd className="font-mono font-bold text-slate-700 dark:text-slate-300">{s.kbd}</kbd>
            {s.label}
          </span>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left column: search + cart */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              Product Search / Barcode
            </h2>
            <ProductSearch />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-8.43H6" />
              </svg>
              Cart
            </h2>
            <Cart />
          </div>
        </div>

        {/* Right column: order summary */}
        <div>
          <OrderSummary
            onCheckout={processCheckout}
            onClear={() => {
              clearCart();
              showToast('Cart cleared', 'info');
            }}
            onOpenNFC={() => setNfcOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={pendingTotal}
        onComplete={handlePaymentComplete}
      />

      <ScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
      />

      <NFCLinkModal
        open={nfcOpen}
        onOpenChange={setNfcOpen}
      />

      <ReceiptModal
        open={receiptOpen}
        onOpenChange={handleReceiptClose}
        receipt={currentReceipt}
        printMode={true}
        onPrint={handlePrintReceipt}
      />
    </div>
  );
}
