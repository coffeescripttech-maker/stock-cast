import { useEffect, useRef, useState, useMemo } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useDataStore } from '../../stores/dataStore';
import { usePOSStore } from '../../stores/posStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';
import { getCustomerTier } from '../../lib/formatters';

function memberId(id: number): string {
  return `MEM-${String(id).padStart(6, '0')}`;
}

interface NFCLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NFC_SUBTITLE = 'Tap NFC tag or enter phone / NFC tag ID';

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-brand/20 text-brand font-semibold rounded-sm">{part}</span>
    ) : (
      part
    )
  );
}

export function NFCLinkModal({ open, onOpenChange }: NFCLinkModalProps) {
  const customers = useDataStore((s) => s.customers);
  const linkCustomer = usePOSStore((s) => s.linkCustomer);
  const showToast = useUIStore((s) => s.showToast);

  const [input, setInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setInput('');
      setSelectedIndex(-1);
      setShowDropdown(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const suggestions = useMemo(() => {
    const val = input.trim().toLowerCase();
    if (!val) return [];
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(val) ||
          c.phone.includes(val) ||
          c.nfcTag.toLowerCase().includes(val) ||
          memberId(c.id).toLowerCase().includes(val)
      )
      .slice(0, 8);
  }, [customers, input]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLButtonElement>('[data-index]');
    const el = items[selectedIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  function selectCustomer(customer: (typeof customers)[number]) {
    linkCustomer(customer);
    showToast(`Linked: ${customer.name} (${customer.points} pts)`, 'success');
    onOpenChange(false);
  }

  function handleInputChange(value: string) {
    setInput(value);
    setSelectedIndex(-1);
    setShowDropdown(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        selectCustomer(suggestions[selectedIndex]);
      } else if (input.trim()) {
        // No suggestion selected — try direct match
        const val = input.trim();
        const found = customers.find(
          (c) => c.nfcTag === val || c.phone === val || c.name.toLowerCase() === val.toLowerCase() || memberId(c.id) === val.toUpperCase()
        );
        if (found) {
          selectCustomer(found);
        } else {
          showToast('Customer not found. Check NFC tag or phone number.', 'error');
        }
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
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

        <div className="w-full space-y-1.5 relative">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Or enter Phone / NFC Tag ID</label>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (input.trim()) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="e.g. 09171234567 or NFC-001234"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />

          {/* Autocomplete dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div
              ref={listRef}
              className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden max-h-60 overflow-y-auto"
            >
              {suggestions.map((c, i) => {
                const tier = getCustomerTier(c.points);
                return (
                  <button
                    key={c.id}
                    data-index={i}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectCustomer(c); }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      selectedIndex === i
                        ? 'bg-brand/10 dark:bg-brand/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    )}
                  >
                    {/* Initials avatar */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                      style={{
                        background: `${tier.key === 'gold' ? '#FBBF24' : tier.key === 'silver' ? '#A0A0B0' : '#CD7F32'}22`,
                        color: tier.key === 'gold' ? '#D4AF37' : tier.key === 'silver' ? '#A0A0B0' : '#CD7F32',
                      }}
                    >
                      {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {highlight(c.name, input)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{c.phone}</span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="font-mono">{c.nfcTag}</span>
                      </div>
                    </div>
                    {/* Points + tier */}
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">{c.points.toLocaleString()} pts</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{
                        background: `${tier.key === 'gold' ? '#FBBF24' : tier.key === 'silver' ? '#A0A0B0' : '#CD7F32'}18`,
                        color: tier.key === 'gold' ? '#D4AF37' : tier.key === 'silver' ? '#A0A0B0' : '#CD7F32',
                      }}>{tier.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="primary" onClick={() => {
          if (!input.trim()) return;
          const val = input.trim();
          const found = customers.find(
            (c) => c.nfcTag === val || c.phone === val || c.name.toLowerCase() === val.toLowerCase() || memberId(c.id) === val.toUpperCase()
          );
          if (found) {
            selectCustomer(found);
          } else {
            showToast('Customer not found. Check NFC tag or phone number.', 'error');
          }
        }}>Link Customer</Button>
      </div>
    </Dialog>
  );
}
