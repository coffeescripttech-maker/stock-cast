import { Bluetooth, BluetoothConnected, Loader2 } from 'lucide-react';
import { usePrinterStore } from '../../stores/printerStore';
import { useUIStore } from '../../stores/uiStore';

/**
 * Compact Bluetooth printer status pill shown on the POS page.
 *
 * Reflects the one shared connection (same one the Device Test page manages),
 * lets the cashier pair a printer right at the register without leaving POS,
 * and reports obvious connect/disconnect errors as toasts.
 */
export function BluetoothPrinterButton() {
  const connected = usePrinterStore((s) => s.connected);
  const connecting = usePrinterStore((s) => s.connecting);
  const device = usePrinterStore((s) => s.device);
  const connect = usePrinterStore((s) => s.connect);
  const disconnect = usePrinterStore((s) => s.disconnect);
  const showToast = useUIStore((s) => s.showToast);

  const onClick = async () => {
    if (connecting) return;
    if (connected) {
      disconnect();
      showToast('Bluetooth printer disconnected', 'info');
      return;
    }
    const ok = await connect();
    if (ok) {
      showToast('Bluetooth printer connected', 'success');
    } else {
      const msg = usePrinterStore.getState().error;
      showToast(msg ?? 'Bluetooth connection cancelled', 'error');
    }
  };

  const label = connected
    ? device?.name ?? 'Printer connected'
    : connecting
      ? 'Connecting…'
      : 'Connect Printer';

  return (
    <button
      onClick={onClick}
      disabled={connecting}
      title={connected ? 'Connected — click to disconnect' : 'Pair a Bluetooth thermal printer'}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
        connected
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400'
          : 'border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
      }`}
    >
      {connecting ? (
        <Loader2 size={12} className="animate-spin" />
      ) : connected ? (
        <BluetoothConnected size={12} />
      ) : (
        <Bluetooth size={12} />
      )}
      <span className="max-w-[160px] truncate">{label}</span>
    </button>
  );
}