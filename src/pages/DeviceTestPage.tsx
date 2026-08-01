import { useCallback, useState } from 'react';
import { CheckCircle2, Plug, RefreshCw, ScanLine, Usb } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { BluetoothPrinterTest } from '../components/devices/BluetoothPrinterTest';
import { BarcodeScannerTest } from '../components/devices/BarcodeScannerTest';
import { RfidReaderTest } from '../components/devices/RfidReaderTest';

/**
 * Device Test page — verify the store's physical hardware works before going live:
 *   • Bluetooth thermal printer  (Web Bluetooth + ESC/POS test receipt)
 *   • Barcode scanner            (keyboard-wedge capture)
 *   • RFID reader                (keyboard-wedge capture)
 *
 * KPI cards mirror the pattern used on AuditPage / DashboardPage.
 */

export default function DeviceTestPage() {
  const [deviceOnline, setDeviceOnline] = useState({ printer: false, scanner: false, rfid: false });
  const [testsPassed, setTestsPassed] = useState(0);
  const [scansCaptured, setScansCaptured] = useState(0);

  const onlineCount = Object.values(deviceOnline).filter(Boolean).length;

  const setOnline = useCallback((key: keyof typeof deviceOnline) => (online: boolean) => {
    setDeviceOnline((prev) => (prev[key] === online ? prev : { ...prev, [key]: online }));
  }, []);

  const resetCounters = () => {
    setTestsPassed(0);
    setScansCaptured(0);
  };

  return (
    <div className="animate-[fadeUp_0.25s_ease] space-y-6 max-w-[1600px] mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Verify your Bluetooth printer, barcode scanner &amp; RFID reader
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={resetCounters}
          disabled={testsPassed === 0 && scansCaptured === 0}
        >
          <RefreshCw size={13} /> Reset Counters
        </Button>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-brand to-brand-dark text-white p-5 sm:p-6 shadow-lg shadow-brand/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Device Types</span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Usb size={18} className="text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-4xl font-black font-mono tracking-tight">3</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Printer · scanner · RFID</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-5 sm:p-6 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Connected</span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Plug size={18} className="text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-4xl font-black font-mono tracking-tight">{onlineCount}/3</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Devices currently online</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-sky-500 to-sky-700 text-white p-5 sm:p-6 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Tests Passed</span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <CheckCircle2 size={18} className="text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-4xl font-black font-mono tracking-tight">{testsPassed}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Successful prints + scans</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-amber-400 to-amber-600 text-white p-5 sm:p-6 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Scans Captured</span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <ScanLine size={18} className="text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-4xl font-black font-mono tracking-tight">{scansCaptured}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Barcodes + tags captured</div>
          </div>
        </div>
      </div>

      {/* ═══ DEVICE CARDS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
        <BluetoothPrinterTest onStatusChange={setOnline('printer')} onResult={(ok) => ok && setTestsPassed((c) => c + 1)} />
        <BarcodeScannerTest
          onStatusChange={setOnline('scanner')}
          onCapture={() => {
            setScansCaptured((c) => c + 1);
            setTestsPassed((c) => c + 1);
          }}
        />
        <RfidReaderTest
          onStatusChange={setOnline('rfid')}
          onCapture={() => {
            setScansCaptured((c) => c + 1);
            setTestsPassed((c) => c + 1);
          }}
        />
      </div>
    </div>
  );
}
