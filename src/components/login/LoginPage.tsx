import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import { resolveApiUrl, setApiBase } from '../../lib/apiBase';
import { AlertCircle, Loader2, Store, Server } from 'lucide-react';

// Running inside the Capacitor Android app (WebView) vs a normal browser/Electron
const isNative =
  typeof window !== 'undefined' &&
  !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    ?.isNativePlatform?.();

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const currentUser = useAuthStore((s) => s.currentUser);
  const hydrate = useDataStore((s) => s.hydrate);
  const navigate = useNavigate();
  const storeName = useSettingsStore((s) => s.settings.general.storeName);
  const storeLogo = useSettingsStore((s) => s.settings.branding.storeLogo);

  // Server-address dialog (Android app only — the server lives on the PC)
  const [serverOpen, setServerOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState('');

  const openServerDialog = () => {
    setServerUrl(localStorage.getItem('ruizpos_api_base') ?? '');
    setServerOpen(true);
  };

  const saveServerUrl = () => {
    setApiBase(serverUrl);
    setServerOpen(false);
    window.location.reload();
  };

  // If already logged in, redirect
  if (currentUser) {
    return <Navigate to={currentUser.role === 'owner' ? '/dashboard' : '/pos'} replace />;
  }

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    const errMsg = await login(username, password);
    if (errMsg === null) {
      const user = useAuthStore.getState().currentUser!;

      // Hydrate all data from API
      try {
        await hydrate();
      } catch {
        // Data fetch failed — still let user through, stores will be empty
      }

      setError('');
      navigate(user.role === 'owner' ? '/dashboard' : '/pos', { replace: true });
    } else {
      setError(errMsg);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 dark:from-indigo-950 dark:via-slate-950 dark:to-slate-900">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-[400px] mx-4 p-8 sm:p-11 shadow-2xl border border-brand/5 animate-[fadeUp_0.4s_ease]">
        {/* Logo */}
        <div className="w-13 h-13 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-5">
          {storeLogo ? (
            <img src={resolveApiUrl(storeLogo)} alt={storeName} className="w-full h-full rounded-2xl object-contain" />
          ) : (
            <Store size={22} className="text-white" />
          )}
        </div>

        <h1 className="text-xl font-bold text-center mb-1.5 text-slate-900 dark:text-slate-100">
          {storeName || 'Ruiz Store'} POS
        </h1>
        <p className="text-xs text-slate-400 text-center mb-8 dark:text-slate-500">
          Sign in to access the inventory and sales system
        </p>

        <div className="space-y-4">
          <Input
            label="Username"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          {error && (
            <div className="flex items-start gap-2 bg-red-bg text-red-500 rounded-lg px-3.5 py-2.5 text-xs font-semibold leading-relaxed">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={handleLogin} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </div>

        <hr className="border-t border-slate-200 dark:border-slate-700 my-6" />

        <div className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
          <strong className="text-slate-600 dark:text-slate-300">Demo Accounts:</strong><br />
          <strong>Owner:</strong> admin / admin123 &nbsp;|&nbsp; <strong>Staff:</strong> staff / staff123
        </div>

        {/* Android app only — point this app at the PC running the POS server */}
        {isNative && (
          <button
            onClick={openServerDialog}
            className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand transition-colors">
            <Server size={13} />
            Configure Server Address
          </button>
        )}
      </div>

      {/* Server address dialog (Android) */}
      <Dialog
        open={serverOpen}
        onOpenChange={setServerOpen}
        title="Server Address"
        subtitle="Where should this app connect? Enter the PC's address that runs the POS server.">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Server URL
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.50:3001"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 font-mono tracking-wider"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Usually <span className="font-mono">http://&lt;PC-LAN-IP&gt;:3001</span>. Leave empty to use the
              app's own origin (desktop).
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setServerOpen(false)}>Cancel</Button>
            <Button variant="brand" onClick={saveServerUrl}>Save &amp; Reload</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
