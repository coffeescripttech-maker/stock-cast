import { useCallback, useEffect, useRef, useState } from 'react';
import { Bluetooth, CheckCircle2, Loader2, Printer, Trash2, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { buildTestReceipt } from '../../lib/escpos';
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
 * Works in Chrome/Edge and the packaged Electron app — http://127.0.0.1 is a
 * secure context, and modern Electron shows the OS Bluetooth chooser for
 * requestDevice() with no extra main-process handler.
 *
 * Common ESC/POS-over-BLE vendor service UUIDs are listed in optionalServices
 * so GATT access is granted; if the printer uses a different one, the log shows
 * the services we could see so the UUID can be added here.
 */

const PRINTER_SERVICE_UUIDS: string[] = [
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // common 58mm ESC/POS over BLE
  '0000ff00-0000-1000-8000-00805f9b34fb', // vendor "FF00" service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // vendor "FFE0" service
];

function bluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

function describeError(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message;
    if (/cancel/i.test(m)) return 'cancelled';
    return m;
  }
  return String(err);
}

interface BluetoothPrinterTestProps {
  onStatusChange?: (online: boolean) => void;
  onResult?: (ok: boolean) => void;
}

export function BluetoothPrinterTest({ onStatusChange, onResult }: BluetoothPrinterTestProps) {
  const storeName = useSettingsStore((s) => s.settings.general.storeName);
  const { entries, addLog, clearLog } = useDeviceLog();
  const [status, setStatus] = useState<DeviceStatus>('idle');
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [busy, setBusy] = useState(false);

  const writableRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const manualDisconnectRef = useRef(false);

  // Reset UI if the device is dropped by the OS while the page is open.
  useEffect(() => {
    const d = device;
    if (!d) return;
    const onDisconnected = () => {
      if (manualDisconnectRef.current) {
        manualDisconnectRef.current = false;
        return;
      }
      writableRef.current = null;
      setDevice(null);
      setStatus('idle');
      onStatusChange?.(false);
      addLog('info', 'Device disconnected.');
    };
    d.addEventListener('gattserverdisconnected', onDisconnected);
    return () => d.removeEventListener('gattserverdisconnected', onDisconnected);
  }, [device, addLog, onStatusChange]);

  const sendReceipt = useCallback(
    async (writable: BluetoothRemoteGATTCharacteristic) => {
      const bytes = buildTestReceipt(storeName);
      addLog('info', `Sending ESC/POS test receipt (${bytes.length} bytes)…`);
      if (writable.properties.writeWithoutResponse) {
        await writable.writeValueWithoutResponse(bytes);
      } else {
        await writable.writeValueWithResponse(bytes);
      }
      addLog('success', `Write OK — ${bytes.length} bytes sent to printer.`);
    },
    [storeName, addLog]
  );

  const connectAndPrint = async () => {
    if (busy) return;
    if (!bluetoothSupported()) {
      addLog('error', 'Web Bluetooth is not available in this browser. Use Chrome/Edge or the desktop app.');
      setStatus('error');
      return;
    }
    setBusy(true);
    setStatus('connecting');
    addLog('info', 'Requesting Bluetooth device…');
    let btDevice: BluetoothDevice | null = null;
    try {
      btDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS,
      });
      addLog('data', `Device: ${btDevice.name ?? 'Unnamed device'}`);
      setDevice(btDevice);

      const server = await btDevice.gatt?.connect();
      if (!server) throw new Error('Device has no GATT server.');

      const services = await server.getPrimaryServices();
      addLog('info', `GATT connected — ${services.length} service(s) exposed.`);

      let writable: BluetoothRemoteGATTCharacteristic | null = null;
      for (const svc of services) {
        addLog('data', `Service ${svc.uuid}`);
        const characteristics = await svc.getCharacteristics();
        for (const ch of characteristics) {
          if (ch.properties.write || ch.properties.writeWithoutResponse) {
            writable = ch;
            addLog(
              'data',
              `  → writable characteristic ${ch.uuid} (write=${ch.properties.write}, no-response=${ch.properties.writeWithoutResponse})`
            );
            break;
          }
        }
        if (writable) break;
      }

      if (!writable) {
        throw new Error(
          'No writable characteristic found on this printer. The log lists the services this device exposes — if your printer uses a different vendor service, add its UUID to PRINTER_SERVICE_UUIDS.'
        );
      }

      writableRef.current = writable;
      setStatus('connected');
      onStatusChange?.(true);

      await sendReceipt(writable);
      setStatus('ok');
      onResult?.(true);
    } catch (err) {
      const message = describeError(err);
      if (message === 'cancelled') {
        addLog('info', 'Device selection cancelled.');
        setStatus('idle');
      } else {
        addLog('error', message);
        setStatus('error');
      }
      try {
        btDevice?.gatt?.disconnect();
      } catch {
        /* already gone */
      }
    } finally {
      setBusy(false);
    }
  };

  const printAgain = async () => {
    const writable = writableRef.current;
    if (!writable || busy) return;
    setBusy(true);
    try {
      await sendReceipt(writable);
      setStatus('ok');
      onResult?.(true);
    } catch (err) {
      addLog('error', describeError(err));
      setStatus('error');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = () => {
    manualDisconnectRef.current = true;
    try {
      device?.gatt?.disconnect();
    } catch {
      /* ignore */
    }
    writableRef.current = null;
    setDevice(null);
    setStatus('idle');
    onStatusChange?.(false);
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

  const connected = status === 'connected' || status === 'ok';

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
          {!connected ? (
            <Button variant="brand" size="sm" onClick={connectAndPrint} disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Bluetooth size={14} />}
              {busy ? 'Working…' : 'Connect & Print'}
            </Button>
          ) : (
            <>
              <Button variant="brand" size="sm" onClick={printAgain} disabled={busy}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
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
        Connect to your Bluetooth thermal printer and print a test receipt. Make sure the printer is powered on and
        in pairing mode. Works in Chrome/Edge and the desktop app.
      </p>
      <DeviceLog entries={entries} placeholder="— not connected yet —" className="h-48" />
    </DeviceCard>
  );
}
