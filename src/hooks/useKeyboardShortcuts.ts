import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePOSStore } from '../stores/posStore';
import { useUIStore } from '../stores/uiStore';
import { printReceipt } from '../lib/printReceipt';
import { printFallback } from '../lib/electron';

export function useKeyboardShortcuts() {
  const { currentUser } = useAuthStore();
  const { cart, receiptIsShowing, clearCart, lastReceipt, setReceiptShowing, saleMode, setSaleMode } = usePOSStore();
  const { showToast, closeModal, setCommandPaletteOpen } = useUIStore();

  useEffect(() => {
    if (!currentUser) return;

    const handler = (e: KeyboardEvent) => {
      // Enter in receipt mode -> print (Bluetooth thermal if configured)
      if (e.key === 'Enter' && receiptIsShowing) {
        e.preventDefault();
        const printed = printReceipt(lastReceipt);
        if (printed === 'fallback') printFallback(lastReceipt);
        setReceiptShowing(false);
        closeModal();
        // Tell the POS page to close the visible receipt modal for the next customer.
        document.dispatchEvent(new CustomEvent('pos:close-receipt'));
        return;
      }

      switch (e.key) {
        case 'F4':
          e.preventDefault();
          if (!lastReceipt) {
            showToast('No receipt to print', 'info');
          }
          break;
        // F5 — Cycle sale mode: Auto -> Retail -> Wholesale -> Auto
        case 'F5':
          e.preventDefault();
          {
            const next = saleMode === null ? 'rt' : saleMode === 'rt' ? 'ws' : null;
            setSaleMode(next);
            showToast(
              next === null
                ? 'Sale mode: Auto (per product)'
                : `Sale mode locked: ${next.toUpperCase()}`,
              'info'
            );
          }
          break;
        // Ctrl+K / Cmd+K — Open command palette
        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setCommandPaletteOpen(true);
          }
          break;
        case 'F8':
          e.preventDefault();
          if (cart.length > 0) {
            // Will be handled by the POS page
            document.dispatchEvent(new CustomEvent('pos:checkout'));
          }
          break;
        case 'F9':
          e.preventDefault();
          clearCart();
          showToast('Cart cleared', 'info');
          break;
        case 'F11':
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('pos:nfc-link'));
          break;
        case 'F12':
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('pos:scanner'));
          break;
        case 'Escape':
          closeModal();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentUser, receiptIsShowing, cart.length, lastReceipt, saleMode]);
}
