import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePOSStore } from '../stores/posStore';
import { useUIStore } from '../stores/uiStore';

export function useKeyboardShortcuts() {
  const { currentUser } = useAuthStore();
  const { cart, receiptIsShowing, clearCart, lastReceipt, setReceiptShowing } = usePOSStore();
  const { showToast, closeModal } = useUIStore();

  useEffect(() => {
    if (!currentUser) return;

    const handler = (e: KeyboardEvent) => {
      // Enter in receipt mode -> print
      if (e.key === 'Enter' && receiptIsShowing) {
        e.preventDefault();
        window.print();
        setReceiptShowing(false);
        closeModal();
        return;
      }

      switch (e.key) {
        case 'F4':
          e.preventDefault();
          if (!lastReceipt) {
            showToast('No receipt to print', 'info');
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
  }, [currentUser, receiptIsShowing, cart.length, lastReceipt]);
}
