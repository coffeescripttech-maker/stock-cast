import { useEffect, useState, useCallback } from 'react';
import { usePOSStore } from '../stores/posStore';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useBarcodeWedge } from '../hooks/useBarcodeWedge';
import { findProductByBarcode } from '../lib/barcode';
import { ProductSearch } from '../components/pos/ProductSearch';
import { Cart } from '../components/pos/Cart';
import { OrderSummary } from '../components/pos/OrderSummary';
import { CheckoutBar } from '../components/pos/CheckoutBar';
import { PaymentModal } from '../components/pos/PaymentModal';
import { ScannerModal } from '../components/pos/ScannerModal';
import { NFCLinkModal } from '../components/pos/NFCLinkModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { BluetoothPrinterButton } from '../components/pos/BluetoothPrinterButton';
import { SaleModeToggle } from '../components/pos/SaleModeToggle';
import { cn } from '../lib/cn';
import { ArrowLeftRight } from 'lucide-react';
import { buildSaleReceipt } from '../lib/escpos';
import { printReceipt } from '../lib/printReceipt';
import { printFallback } from '../lib/electron';
import { applyTax } from '../lib/tax';
import { printerReady, usePrinterStore } from '../stores/printerStore';
import type { Transaction } from '../types/transaction';

export default function POSPage() {
  const cart = usePOSStore(s => s.cart);
  const addToCart = usePOSStore(s => s.addToCart);
  const saleMode = usePOSStore(s => s.saleMode);
  const clearCart = usePOSStore(s => s.clearCart);
  const linkedCustomer = usePOSStore(s => s.linkedCustomer);
  const redeemPoints = usePOSStore(s => s.redeemPoints);
  const setLastReceipt = usePOSStore(s => s.setLastReceipt);
  const setReceiptShowing = usePOSStore(s => s.setReceiptShowing);

  const rewardsConfig = useDataStore(s => s.rewardsConfig);
  const products = useDataStore(s => s.products);
  const completeSale = useDataStore(s => s.completeSale);

  const currentUser = useAuthStore(s => s.currentUser);
  const showToast = useUIStore(s => s.showToast);

  // Modal state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [nfcOpen, setNfcOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<Transaction | null>(
    null
  );
  const [pendingTotal, setPendingTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // POS layout mode: default = big product grid on the left; cart-first =
  // big cart + order total on the left with a compact product panel (scanning).
  const [cartFirst, setCartFirst] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ruizpos_pos_cart_first') === '1';
    } catch {
      return false;
    }
  });

  function toggleLayout() {
    const next = !cartFirst;
    setCartFirst(next);
    try {
      localStorage.setItem('ruizpos_pos_cart_first', next ? '1' : '0');
    } catch {
      /* ignore */
    }
    showToast(
      next
        ? 'Layout: Cart view (cart on the left, compact products)'
        : 'Layout: Product view (browse grid on the left)',
      'info'
    );
  }

  // Compute totals — exclusive-priced sales add VAT on top, so the grand
  // total the cashier collects matches what the server charges.
  const rawTotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const discount =
    redeemPoints > 0
      ? Math.floor(redeemPoints / rewardsConfig.redeemEvery) *
        rewardsConfig.redeemValue
      : 0;
  const taxSettings = useSettingsStore((s) => s.settings.tax);
  const { total: grandTotal } = applyTax(
    Math.max(0, rawTotal - discount),
    taxSettings
  );

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

    function onLayoutToggle() {
      toggleLayout();
    }

    // Enter-to-print in useKeyboardShortcuts dispatches this once printing is
    // done, closing the receipt modal for the next customer.
    function onCloseReceipt() {
      setReceiptOpen(false);
      setReceiptShowing(false);
    }

    document.addEventListener('pos:checkout', onCheckout);
    document.addEventListener('pos:nfc-link', onNfcLink);
    document.addEventListener('pos:scanner', onScanner);
    document.addEventListener('pos:layout-toggle', onLayoutToggle);
    document.addEventListener('pos:close-receipt', onCloseReceipt);

    return () => {
      document.removeEventListener('pos:checkout', onCheckout);
      document.removeEventListener('pos:nfc-link', onNfcLink);
      document.removeEventListener('pos:scanner', onScanner);
      document.removeEventListener('pos:layout-toggle', onLayoutToggle);
      document.removeEventListener('pos:close-receipt', onCloseReceipt);
    };
  }, [
    cart.length,
    rawTotal,
    discount,
    grandTotal,
    linkedCustomer,
    redeemPoints,
    currentUser,
    cartFirst
  ]);

  // ---- Handlers ----

  const processCheckout = useCallback(() => {
    if (cart.length === 0) return;
    const settings = useSettingsStore.getState().settings.pos;
    if (settings.customerRequired && !linkedCustomer) {
      showToast('Please link a customer before checkout', 'error');
      return;
    }
    setPendingTotal(grandTotal);
    setPaymentOpen(true);
  }, [cart.length, grandTotal, linkedCustomer]);

  // ---- Barcode wedge: a scanned code auto-adds the product to the cart ----
  const handleBarcodeScan = useCallback(
    (code: string) => {
      const match = findProductByBarcode(products, code, saleMode);
      if (!match) {
        showToast(`Product not found: ${code}`, 'error');
        return;
      }
      if (match.price <= 0) {
        showToast(
          `No ${match.type.toUpperCase()} price set for ${match.product.name}`,
          'error'
        );
        return;
      }
      addToCart(match.product.id, match.product.name, match.type, match.price);
      showToast(
        `Added ${match.product.name} (${match.type.toUpperCase()})`,
        'success'
      );
    },
    [products, saleMode, addToCart, showToast]
  );

  useBarcodeWedge(handleBarcodeScan);

  function handlePaymentComplete(payment: {
    amountTendered: number;
    change: number;
    paymentMethod: 'cash' | 'gcash' | 'maya';
    paymentRef: string | null;
  }) {
    finalizeSale(payment);
  }

  /**
   * Send a completed sale to the printer via the shared router. Bluetooth
   * thermal printing (when enabled) handles it, otherwise we fall back to the
   * browser/Electron system print dialog. The receipt modal always stays open
   * afterwards — the cashier closes it manually (X / Close / Enter).
   */
  function printTransaction(tx: Transaction) {
    if (printReceipt(tx) === 'fallback') {
      printFallback(tx);
    }
  }

  async function finalizeSale(payment: {
    amountTendered: number;
    change: number;
    paymentMethod: 'cash' | 'gcash' | 'maya';
    paymentRef: string | null;
  }) {
    if (!currentUser) return;

    setSubmitting(true);

    const types = [...new Set(cart.map(c => c.type))];
    const txType = types.length > 1 ? 'mixed' : types[0];

    // Send sale to API (handles stock deduction, customer points, audit atomically)
    const tx = await completeSale({
      cashierId: currentUser.id || 1,
      type: txType,
      items: cart.map(c => ({
        productId: c.productId,
        type: c.type,
        qty: c.qty,
        price: c.price
      })),
      amountTendered: payment.amountTendered,
      paymentMethod: payment.paymentMethod,
      paymentRef: payment.paymentRef,
      customerId: linkedCustomer?.id ?? null,
      pointsRedeemed: redeemPoints
    });

    setSubmitting(false);

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

    // Auto-print after each sale.
    // A connected Bluetooth printer is used immediately and silently — the
    // exact same store.printRaw() the Device Test "Connect & Print" button
    // calls, so there is NO browser print dialog at checkout.
    const pSettings = useSettingsStore.getState().settings.pos;
    if (printerReady()) {
      setTimeout(() => {
        usePrinterStore
          .getState()
          .printRaw(buildSaleReceipt(tx, useSettingsStore.getState().settings))
          .then(() => showToast('Receipt sent to Bluetooth printer', 'success'))
          .catch((err: unknown) =>
            showToast(err instanceof Error ? err.message : 'Bluetooth print failed', 'error')
          );
      }, 500);
    } else if (pSettings.autoPrintReceipt) {
      // No Bluetooth printer but Auto-Print is on → send the receipt as raw
      // ESC/POS text to the thermal printer (pure text, no rendering); falls
      // back to silent page print if the OS rejects it.
      setTimeout(() => {
        printFallback(tx);
      }, 500);
    }
  }

  function handlePrintReceipt() {
    if (currentReceipt) printTransaction(currentReceipt);
  }

  // The keyboard shortcut hook checks receiptIsShowing to handle Enter -> print
  // We must close the receipt modal after print
  function handleReceiptClose(open: boolean) {
    setReceiptOpen(open);
    if (!open) {
      setReceiptShowing(false);
    }
  }

  // ── Layout panels ──────────────────────────────────────────────────
  // Order Summary (Order Total + Link Customer + Complete Sale) is ALWAYS
  // pinned to the bottom of the RIGHT column so it stays visible without
  // scrolling. The columns are fixed-height; only the inner lists scroll.
  const cardShell =
    'bg-white dark:bg-[#1C1C1C] rounded-[20px] border border-[#ECECEC] dark:border-[#2a2a2a] shadow-[0_4px_16px_rgba(0,0,0,0.05)] p-5 flex flex-col min-h-0';

  const productsCard = (
    <div
      className={cn(
        cardShell,
        'max-h-[45vh] lg:max-h-none lg:h-full lg:flex-1 overflow-hidden'
      )}>
      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2 flex-shrink-0">
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        Product Search / Barcode
      </h2>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
        <ProductSearch onScan={() => setScannerOpen(true)} compact={cartFirst} />
      </div>
    </div>
  );

  const cartCard = (
    <div className={cn(cardShell, 'lg:h-full lg:flex-1')}>
      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2 flex-shrink-0">
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-8.43H6" />
        </svg>
        Cart
      </h2>
      <div className="flex-1 min-h-0 flex flex-col">
        <Cart />
      </div>
    </div>
  );

  const orderSummaryBlock = (
    <div className="flex-shrink-0">
      <OrderSummary
        onCheckout={processCheckout}
        onClear={() => {
          clearCart();
          showToast('Cart cleared', 'info');
        }}
        onOpenNFC={() => setNfcOpen(true)}
        submitting={submitting}
      />
    </div>
  );

  // Left column = main panel (products grid by default, big cart in cart-first)
  const leftPanel = (
    <div className="lg:h-[calc(100vh-64px)] lg:sticky lg:top-[52px] lg:min-h-0">
      {cartFirst ? cartCard : productsCard}
    </div>
  );

  // Right column = secondary panel (scrolls) + Order Summary pinned at bottom
  const rightColumn = (
    <div className="lg:h-[calc(100vh-64px)] lg:sticky lg:top-[52px] lg:flex lg:flex-col lg:gap-6 lg:min-h-0">
      <div className="lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
        {cartFirst ? productsCard : cartCard}
      </div>
      {orderSummaryBlock}
    </div>
  );

  return (
    <div className="animate-[fadeUp_0.25s_ease]">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SaleModeToggle />
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {saleMode === null
              ? 'Scan or search — sale type follows each product'
              : saleMode === 'ws'
                ? 'Locked to WHOLESALE — bawat scan ay wholesale price'
                : 'Locked to RETAIL — bawat scan ay retail price'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLayout}
            title="Switch layout (F7)"
            className={cn(
              'flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95',
              cartFirst
                ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-brand hover:text-brand'
            )}>
            <ArrowLeftRight size={14} />
            <span className="hidden sm:inline">
              {cartFirst ? 'Product View' : 'Cart View'}
            </span>
            <kbd className="hidden lg:inline font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/20">
              F7
            </kbd>
          </button>
          <BluetoothPrinterButton />
        </div>
      </div>

      {/* Shortcuts bar — desktop only; F-keys don't exist on phones */}
      <div className="hidden lg:flex flex-wrap gap-1.5 mb-5">
        {[
          { kbd: 'F4', label: 'Print' },
          { kbd: 'F5', label: 'Mode' },
          { kbd: 'F7', label: 'Layout' },
          { kbd: 'F8', label: 'Checkout' },
          { kbd: 'F9', label: 'Clear' },
          { kbd: 'F11', label: 'NFC Link' },
          { kbd: 'F12', label: 'Scanner' },
          { kbd: '↑↓', label: 'Navigate' },
          { kbd: 'Enter', label: 'Select' }
        ].map(s => (
          <span
            key={s.kbd}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <kbd className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {s.kbd}
            </kbd>
            {s.label}
          </span>
        ))}
      </div>

      {/* Main grid — 2 columns. Left = main panel (grid or big cart), right =
          secondary panel + Order Summary pinned at the bottom so it is
          ALWAYS visible without scrolling. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,420px)] gap-6 items-start">
        {leftPanel}
        {rightColumn}
      </div>

      {/* Sticky mobile checkout pill (hidden on desktop) */}
      <CheckoutBar onCheckout={processCheckout} submitting={submitting} />

      {/* Spacer so the sticky bar never covers the OrderSummary checkout when scrolled */}
      <div className="lg:hidden h-24" />

      {/* Modals */}
      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={pendingTotal}
        onComplete={handlePaymentComplete}
      />

      <ScannerModal open={scannerOpen} onOpenChange={setScannerOpen} />

      <NFCLinkModal open={nfcOpen} onOpenChange={setNfcOpen} />

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
