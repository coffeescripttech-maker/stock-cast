import { useEffect, useRef, useState } from 'react';

/**
 * Keyboard-wedge barcode capture for the POS screen.
 *
 * Physical barcode scanners emulate a USB keyboard: they type the scanned code
 * (then Enter) into whatever has focus. This hook buffers those keystrokes at
 * the window level whenever NO form field is focused, so a cashier can simply
 * point the scanner at the POS without clicking into the search box first.
 *
 * The buffered code is handed to `onBarcode` when Enter fires. The callback is
 * kept in a ref so callers can pass an inline handler without re-subscribing.
 *
 * Returns the live buffer (for optional UI feedback); it is cleared on Esc,
 * mouse interaction, or after the code is committed.
 */
export function useBarcodeWedge(onBarcode: (code: string) => void) {
  const [buffer, setBuffer] = useState('');
  const bufferRef = useRef('');
  const callbackRef = useRef(onBarcode);
  callbackRef.current = onBarcode;

  useEffect(() => {
    function reset() {
      bufferRef.current = '';
      setBuffer('');
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Never steal keystrokes meant for a form field (search, modals, etc.).
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        reset();
        if (code) {
          e.preventDefault();
          callbackRef.current(code);
        }
        return;
      }
      if (e.key === 'Escape') {
        reset();
        return;
      }
      if (e.key === 'Backspace') {
        bufferRef.current = bufferRef.current.slice(0, -1);
        setBuffer(bufferRef.current);
        return;
      }
      // Buffer printable characters, capping the length so a stray session of
      // typing (navigation, buttons) can't grow the buffer unboundedly.
      if (e.key.length === 1) {
        if (bufferRef.current.length >= 48) {
          reset();
        }
        bufferRef.current += e.key;
        setBuffer(bufferRef.current);
      }
    }

    // Clicking anywhere refocuses the scanner — clear any half-typed code.
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', reset);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', reset);
    };
  }, []);

  return buffer;
}