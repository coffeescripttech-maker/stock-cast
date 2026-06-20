import { useEffect, useRef, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useDataStore } from '../../stores/dataStore';
import { usePOSStore } from '../../stores/posStore';
import { useUIStore } from '../../stores/uiStore';

interface ScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScannerModal({ open, onOpenChange }: ScannerModalProps) {
  const products = useDataStore((s) => s.products);
  const addToCart = usePOSStore((s) => s.addToCart);
  const showToast = useUIStore((s) => s.showToast);

  const [barcode, setBarcode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setBarcode('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function handleSubmit() {
    const bc = barcode.trim();
    if (!bc) return;

    const rt = products.find((p) => p.retailBarcode === bc);
    const ws = products.find((p) => p.wholesaleBarcode === bc);

    if (rt) {
      addToCart(rt.id, rt.name, 'rt', rt.retailPrice);
      showToast(`Added ${rt.name} (RT)`, 'success');
      onOpenChange(false);
    } else if (ws) {
      addToCart(ws.id, ws.name, 'ws', ws.wholesalePrice);
      showToast(`Added ${ws.name} (WS)`, 'success');
      onOpenChange(false);
    } else {
      showToast(`Product not found: ${bc}`, 'error');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Barcode Scanner" subtitle="Use a physical scanner or enter barcode manually">
      <div className="flex flex-col items-center py-6">
        {/* Scanner animation */}
        <div className="relative w-40 h-28 rounded-2xl border-2 border-brand/30 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden mb-5">
          <div className="absolute top-[20%] left-4 right-4 h-[2px] bg-brand/60 shadow-[0_0_8px_rgba(79,70,229,0.4)] animate-[scanBeam_2s_ease-in-out_infinite]" />
          <svg width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-brand">
            <path d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3M15 5h3a1 1 0 011 1v3M15 19h3a1 1 0 001-1v-3" />
            <line x1="7" y1="8" x2="7" y2="16" /><line x1="10" y1="8" x2="10" y2="16" />
            <line x1="13" y1="8" x2="13" y2="12" /><line x1="16" y1="8" x2="16" y2="12" />
          </svg>
        </div>

        <div className="w-full space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Barcode</label>
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scan barcode or type manually…"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 font-mono tracking-wider"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Add to Cart</Button>
      </div>
    </Dialog>
  );
}
