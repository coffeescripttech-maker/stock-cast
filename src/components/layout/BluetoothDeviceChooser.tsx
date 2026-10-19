import { useEffect, useState } from 'react';
import { Bluetooth } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';

/**
 * Desktop (Electron) Bluetooth device picker.
 *
 * Electron does not show the OS Bluetooth chooser, so the main process forwards
 * the list of devices discovered during a `navigator.bluetooth.requestDevice()`
 * call. This component shows an in-app picker and replies with the chosen
 * deviceId (or cancels). It is a no-op in the browser, where the native chooser
 * is used instead.
 */

interface BtDevice {
  deviceId: string;
  deviceName: string;
}

export function BluetoothDeviceChooser() {
  const [devices, setDevices] = useState<BtDevice[] | null>(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onBluetoothDevices) return;
    return api.onBluetoothDevices((list) => setDevices(list));
  }, []);

  const choose = (deviceId: string) => {
    window.electronAPI?.selectBluetoothDevice(deviceId);
    setDevices(null);
  };

  const named = (devices ?? []).filter((d) => d.deviceName);
  const unnamed = (devices ?? []).filter((d) => !d.deviceName);
  const ordered = [...named, ...unnamed];

  return (
    <Dialog
      open={devices !== null}
      onOpenChange={(open) => {
        if (!open) choose('');
      }}
      title="Select Bluetooth Printer"
      subtitle="Choose the thermal printer to connect to"
      hideOverlayClose
    >
      <div className="space-y-2">
        {ordered.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No devices found. Make sure the printer is powered on and in pairing mode.
          </p>
        ) : (
          ordered.map((d) => (
            <button
              key={d.deviceId}
              onClick={() => choose(d.deviceId)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-left text-sm text-slate-700 dark:text-slate-200 hover:border-brand hover:bg-brand/5 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                <Bluetooth size={16} />
              </span>
              <span className="truncate">{d.deviceName || 'Unnamed device'}</span>
            </button>
          ))
        )}
        <Button variant="ghost" size="sm" className="w-full" onClick={() => choose('')}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
}
