import { useCallback, useEffect, useState } from 'react';
import { Bluetooth, CheckCircle2, Loader2, Printer, Trash2, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { buildTestReceipt } from '../../lib/escpos';
import { MTU_CHUNK_BYTES } from '../../lib/ble';
import { usePrinterStore } from '../../stores/printerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { DeviceCard, DeviceLog, useDeviceLog } from './DeviceLog';
import type { DeviceStatus } from './DeviceLog';

/**
 * Bluetooth thermal printer test.
 *
 * Flow:  Connect & Print → Web Bluetooth device chooser → GATT connect →
 * discover writable characteristic → send an ESC/POS test receipt → confirm
 * the write. Disconnect / print-again are available while connected.
 *
 * The live connection lives in the shared `printerStore`, so a printer paired
 * here is the same one the POS checkout prints receipts to.
 *
 * Works in Chrome/Edge and the packaged Electron app — http://127.0.0.1 is a
 * secure context, and modern Electron shows the OS Bluetooth chooser for
 * requestDevice() with no extra main-process handler.
 *
 * Common ESC/POS-over-BLE vendor service UUIDs are listed in lib/ble.ts so
 * GATT access is granted; if the printer uses a different one, the log shows
 * the services we could see so the UUID can be added there.
 */

interface BluetoothPrinterTestProps {
  onStatusChange?: (online: boolean) => void;
  onResult?: (ok: boolean) => void;
}

export function BluetoothPrinterTest({ onStatusChange, onResult }: BluetoothPrinterTestProps) {
  const storeName = useSettingsStore((s) => s.settings.general.storeName);
  const { entries, addLog, clearLog } = useDeviceLog();

  const storeDevice = usePrinterStore((s) => s.device);
  const connected = usePrinterStore((s) => s.connected);
  const connecting = usePrinterStore((s) => s.connecting);
  const error = usePrinterStore((s) => s.error);
  const storeConnect = usePrinterStore((s) => s.connect);
  const storeDisconnect = usePrinterStore((s) => s.disconnect);
  const printRaw = usePrinterStore((s) => s.printRaw);

  const [status, setStatus] = useState<DeviceStatus>('idle');

  // Derive the visual status from the shared connection so the card stays in
  // sync even when the connection is dropped from elsewhere.
  useEffect(() => {
    if (connecting) setStatus('connecting');
    else if (connected) setStatus('connected');
    else if (error) setStatus('error');
    else setStatus('idle');
  }, [connecting, connected, error]);

  // Sync the parent's online flag with the shared connection.
  useEffect(() => {
    onStatusChange?.(connected);
  }, [connected, onStatusChange]);

  // Report a dropped link back to the log.
  useEffect(() => {
    if (!storeDevice) return;
    const onDisconnected = () => {
      setStatus((s) => (s === 'connected' || s === 'ok' ? 'idle' : s));
      addLog('info', 'Device disconnected.');
    };
    storeDevice.addEventListener('gattserverdisconnected', onDisconnected);
    return () => storeDevice.removeEventListener('gattserverdisconnected', onDisconnected);
  }, [storeDevice, addLog]);

  const sendReceipt = useCallback(async () => {
    const bytes = buildTestReceipt(storeName);
    addLog(
      'info',
      `Sending ESC/POS test receipt (${bytes.length} bytes in ${MTU_CHUNK_BYTES}B chunks)…`
    );
    await printRaw(bytes);
    addLog('success', `Write OK — ${bytes.length} bytes sent to printer.`);
  }, [storeName, addLog, printRaw]);

  const connectAndPrint = async () => {
    if (connecting) return;
    addLog('info', 'Requesting Bluetooth device…');
    try {
      const ok = await storeConnect();
      if (!ok) {
        const msg = usePrinterStore.getState().error;
        if (msg) addLog('error', msg);
        else addLog('info', 'Device selection cancelled.');
        setStatus('idle');
        return;
      }
      const dev = usePrinterStore.getState().device;
      addLog('data', `Device: ${dev?.name ?? 'Unnamed device'}`);
      addLog('info', 'GATT connected — finding writable characteristic…');
      await sendReceipt();
      setStatus('ok');
      onResult?.(true);
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  const printAgain = async () => {
    try {
      await sendReceipt();
      setStatus('ok');
      onResult?.(true);
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  const disconnect = () => {
    storeDisconnect();
    setStatus('idle');
    addLog('info', 'Disconnected.');
  };

  const statusLabel =
    status === 'connecting'
      ? 'Connecting…'
      : status === 'connected'
        ? 'Connected'
        : status === 'ok'
          ? 'Printed OK'
          : status === 'error'
            ? 'Error'
            : 'Idle';

  const showConnected = status === 'connected' || status === 'ok';

  return (
    <DeviceCard
      icon={<Printer size={20} />}
      iconClass="bg-brand/10 text-brand"
      title="Bluetooth Thermal Printer"
      subtitle="ESC/POS receipt printer via Web Bluetooth"
      status={status}
      statusLabel={statusLabel}
      footer={
        <>
          {!showConnected ? (
            <Button variant="brand" size="sm" onClick={connectAndPrint} disabled={connecting}>
              {connecting ? <Loader2 size={14} className="animate-spin" /> : <Bluetooth size={14} />}
              {connecting ? 'Working…' : 'Connect & Print'}
            </Button>
          ) : (
            <>
              <Button variant="brand" size="sm" onClick={printAgain}>
                <CheckCircle2 size={14} />
                Print Test Receipt
              </Button>
              <Button variant="secondary" size="sm" onClick={disconnect}>
                <XCircle size={14} />
                Disconnect
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={clearLog} className="ml-auto">
            <Trash2 size={14} />
            Clear
          </Button>
        </>
      }
    >
      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
        Connect to your Bluetooth thermal printer and print a test receipt. The connection is shared
        with the POS checkout — receipts print here too. Make sure the printer is powered on and in
        pairing mode. Works in Chrome/Edge and the desktop app.
      </p>
      <DeviceLog entries={entries} placeholder="— not connected yet —" className="h-48" />
    </DeviceCard>
  );
}