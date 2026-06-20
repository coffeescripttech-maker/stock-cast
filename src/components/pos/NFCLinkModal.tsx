import { useEffect, useRef, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useDataStore } from '../../stores/dataStore';
import { usePOSStore } from '../../stores/posStore';
import { useUIStore } from '../../stores/uiStore';

interface NFCLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NFC_SUBTITLE = 'Tap NFC tag or enter phone / NFC tag ID';

export function NFCLinkModal({ open, onOpenChange }: NFCLinkModalProps) {
  const customers = useDataStore((s) => s.customers);
  const linkCustomer = usePOSStore((s) => s.linkCustomer);
  const showToast = useUIStore((s) => s.showToast);

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function handleLink() {
    const val = input.trim();
    if (!val) return;

    const found = customers.find(
      (c) => c.nfcTag === val || c.phone === val || c.name.toLowerCase() === val.toLowerCase()
    );

    if (!found) {
      showToast('Customer not found. Check NFC tag or phone number.', 'error');
      return;
    }

    linkCustomer(found);
    showToast(`Linked: ${found.name} (${found.points} pts)`, 'success');
    onOpenChange(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLink();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Link Customer via NFC" subtitle={NFC_SUBTITLE}>
      <div className="flex flex-col items-center py-6">
        {/* NFC animation */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-5">
          <div className="absolute inset-0 rounded-full border-2 border-brand/20 animate-[nfcPulse_2s_ease-out_infinite]" />
          <div className="absolute inset-2 rounded-full border-2 border-brand/20 animate-[nfcPulse_2s_ease-out_infinite_0.4s]" />
          <div className="absolute inset-4 rounded-full border-2 border-brand/20 animate-[nfcPulse_2s_ease-out_infinite_0.8s]" />
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-brand">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 -mt-3 mb-4">Waiting for NFC tap…</p>

        <div className="w-full space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Or enter Phone / NFC Tag ID</label>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 09171234567 or NFC-001234"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="primary" onClick={handleLink}>Link Customer</Button>
      </div>
    </Dialog>
  );
}
