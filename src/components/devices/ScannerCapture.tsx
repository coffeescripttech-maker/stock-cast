import { useEffect, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { useScannerCapture } from './useScannerCapture';
import { cn } from '../../lib/cn';

/**
 * Keyboard-wedge capture widget shared by the barcode scanner and RFID reader
 * tests. Renders an always-focused input that buffers keystrokes and commits a
 * scan on Enter, a live feed of captured codes, and the recent scan list.
 *
 * Clicking anywhere in the widget refocuses the field so the next scan lands.
 */

export interface ScanRecord {
  id: string;
  code: string;
  time: string;
}

interface ScannerCaptureProps {
  onScan: (code: string) => void;
  records: ScanRecord[];
  hint: string;
  onFocusChange?: (focused: boolean) => void;
  placeholder?: string;
}

export function ScannerCapture({
  onScan,
  records,
  hint,
  onFocusChange,
  placeholder = 'Waiting for scan…',
}: ScannerCaptureProps) {
  const { value, setValue, inputRef, handleKeyDown, refocus } = useScannerCapture(onScan);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    onFocusChange?.(focused);
  }, [focused, onFocusChange]);

  return (
    <div className="space-y-3" onClick={refocus}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border bg-slate-50 dark:bg-slate-800/50 px-3 py-2 transition',
          'focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
          focused
            ? 'border-brand ring-2 ring-brand/20'
            : 'border-slate-200 dark:border-slate-700 border-dashed'
        )}
      >
        <ScanLine size={16} className={cn('flex-shrink-0', focused ? 'text-brand' : 'text-slate-400')} />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="bg-transparent flex-1 outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">{hint}</p>

      <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
        {records.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-600">— no scans captured yet —</p>
        ) : (
          records
            .slice()
            .reverse()
            .map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0 text-xs"
              >
                <span className="font-mono text-sky-600 dark:text-sky-400 truncate">{r.code}</span>
                <span className="text-slate-400 flex-shrink-0 font-mono">{r.time}</span>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
