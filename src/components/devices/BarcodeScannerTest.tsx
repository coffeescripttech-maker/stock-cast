import { useCallback, useEffect, useMemo, useState } from 'react';
import { Barcode, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { DeviceCard } from './DeviceLog';
import type { DeviceStatus } from './DeviceLog';
import { ScannerCapture } from './ScannerCapture';
import type { ScanRecord } from './ScannerCapture';

/**
 * Barcode scanner test.
 *
 * Store barcode scanners are keyboard-wedge devices: they type the scanned
 * code into whatever has focus and press Enter. This card keeps a capture
 * field focused and lists each scanned code with a timestamp + running count.
 */

interface BarcodeScannerTestProps {
  onStatusChange?: (online: boolean) => void;
  onCapture?: () => void;
}

export function BarcodeScannerTest({ onStatusChange, onCapture }: BarcodeScannerTestProps) {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [focused, setFocused] = useState(false);

  const handleScan = useCallback(
    (code: string) => {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setRecords((prev) =>
        [
          ...prev,
          { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), code, time },
        ].slice(-50)
      );
      onCapture?.();
    },
    [onCapture]
  );

  const clear = useCallback(() => setRecords([]), []);

  // Report to the page so the KPI card can count this device as "online".
  useEffect(() => {
    onStatusChange?.(focused);
  }, [focused, onStatusChange]);

  const status: DeviceStatus = focused ? 'listening' : 'idle';
  const statusLabel = focused ? 'Listening' : 'Idle';

  const uniqueCount = useMemo(() => new Set(records.map((r) => r.code)).size, [records]);

  return (
    <DeviceCard
      icon={<Barcode size={20} />}
      iconClass="bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"
      title="Barcode Scanner"
      subtitle="USB / wireless scanner (keyboard-wedge)"
      status={status}
      statusLabel={statusLabel}
      footer={
        <>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            {records.length} scan{records.length === 1 ? '' : 's'} · {uniqueCount} unique
          </span>
          <Button variant="ghost" size="sm" onClick={clear} className="ml-auto">
            <Trash2 size={14} />
            Clear
          </Button>
        </>
      }
    >
      <ScannerCapture
        onScan={handleScan}
        records={records}
        onFocusChange={setFocused}
        hint="Point your scanner at a barcode and pull the trigger — the code appears below instantly. Works with any scanner that acts like a keyboard."
        placeholder="Scan a barcode…"
      />
    </DeviceCard>
  );
}
