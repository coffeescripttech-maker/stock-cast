import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Keyboard-wedge capture for barcode scanners / RFID readers.
 *
 * Most retail scanners and RFID readers emulate a USB keyboard: they type the
 * scanned code (or tag UID) into whatever has focus and finish with Enter/CR.
 * This hook owns a capture `<input>` that is always focused and buffers those
 * keystrokes; the code is committed via the `onScan` callback when Enter fires.
 *
 * Returns the input bindings + a `refocus()` helper so the card can steal focus
 * back after the user clicks elsewhere (e.g. the Clear button).
 */
export function useScannerCapture(onScan: (code: string) => void) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const code = value.trim();
        if (code) onScan(code);
        setValue('');
      }
    },
    [value, onScan]
  );

  // Keep the field focused so the scanner always has a target; refocus on blur.
  useEffect(() => {
    const el = inputRef.current;
    if (el) el.focus();
  }, []);

  const refocus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return { value, setValue, inputRef, handleKeyDown, refocus };
}
