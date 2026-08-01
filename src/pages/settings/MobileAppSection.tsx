import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useUIStore } from '../../stores/uiStore';
import { getApiBase, setApiBase } from '../../lib/apiBase';
import { Smartphone } from 'lucide-react';

const STORAGE_KEY = 'ruizpos_api_base';

export default function MobileAppSection() {
  const showToast = useUIStore((s) => s.showToast);
  const [serverUrl, setServerUrl] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });

  const handleSave = () => {
    setApiBase(serverUrl);
    showToast(
      'Server address saved — restart the app (or reload) to apply',
      'success'
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Smartphone size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Mobile App</h2>
          <p className="text-xs text-slate-400">Connection settings for the Android app</p>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        The Android app runs on the phone while the POS server runs on your PC. Enter the PC's
        LAN address so the phone can reach it. On desktop / web this is optional and defaults to
        the app's own origin.
      </p>

      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
          Server Address
        </label>
        <input
          type="text"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="http://192.168.1.50:3001"
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 font-mono tracking-wider"
        />
        <p className="text-[11px] text-slate-400 mt-1.5">
          Leave empty to use the app's own origin. Currently connected to:{' '}
          <span className="font-mono text-slate-500">{getApiBase()}</span>
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="brand" onClick={handleSave}>Save Server Address</Button>
      </div>
    </div>
  );
}
