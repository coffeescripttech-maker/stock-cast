import { useCallback, useEffect, useMemo, useState } from 'react';
import { Radio, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { DeviceCard } from './DeviceLog';
import type { DeviceStatus } from './DeviceLog';
import { ScannerCapture } from './ScannerCapture';
import type { ScanRecord } from './ScannerCapture';

/**
 * RFID reader test.
 *
 * Like the barcode scanner, most RFID readers run in HID (keyboard) mode: tap a
 * tag and it types the UID into the focused field, then presses Enter. This card
 * shares the keyboard-wedge capture widget and lists each tapped tag/UID.
 * Serial-only readers need to be switched to HID mode in their own config tool.
 */

interface RfidReaderTestProps {
  onStatusChange?: (online: boolean) => void;
  onCapture?: () => void;
}

export function RfidReaderTest({ onStatusChange, onCapture }: RfidReaderTestProps) {
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

  useEffect(() => {
    onStatusChange?.(focused);
  }, [focused, onStatusChange]);

  const status: DeviceStatus = focused ? 'listening' : 'idle';
  const statusLabel = focused ? 'Listening' : 'Idle';

  const uniqueCount = useMemo(() => new Set(records.map((r) => r.code)).size, [records]);

  return (
    <DeviceCard
      icon={<Radio size={20} />}
      iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
      title="RFID Reader"
      subtitle="RFID / NFC tag reader (HID keyboard mode)"
      status={status}
      statusLabel={statusLabel}
      footer={
        <>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            {records.length} tag{records.length === 1 ? '' : 's'} · {uniqueCount} unique
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
        hint="Hold an RFID/NFC tag next to the reader — the UID appears below. If nothing happens, the reader may be in serial mode; switch it to HID (keyboard) mode in its config tool."
        placeholder="Tap a tag to capture its UID…"
      />
    </DeviceCard>
  );
}
