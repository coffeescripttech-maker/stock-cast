import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertCircle, Loader2, Store } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const currentUser = useAuthStore((s) => s.currentUser);
  const hydrate = useDataStore((s) => s.hydrate);
  const navigate = useNavigate();
  const storeName = useSettingsStore((s) => s.settings.general.storeName);
  const storeLogo = useSettingsStore((s) => s.settings.branding.storeLogo);

  // If already logged in, redirect
  if (currentUser) {
    return <Navigate to={currentUser.role === 'owner' ? '/dashboard' : '/pos'} replace />;
  }

  const handleLogin = async () => {
    setLoading(true);
    setError(false);

    const success = await login(username, password);
    if (success) {
      const user = useAuthStore.getState().currentUser!;

      // Hydrate all data from API
      try {
        await hydrate();
      } catch {
        // Data fetch failed — still let user through, stores will be empty
      }

      setError(false);
      navigate(user.role === 'owner' ? '/dashboard' : '/pos', { replace: true });
    } else {
      setError(true);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 dark:from-indigo-950 dark:via-slate-950 dark:to-slate-900">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-11 w-[400px] shadow-2xl border border-brand/5 animate-[fadeUp_0.4s_ease]">
        {/* Logo */}
        <div className="w-13 h-13 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-5">
          {storeLogo ? (
            <img src={storeLogo} alt={storeName} className="w-full h-full rounded-2xl object-contain" />
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
            onChange={(e) => { setUsername(e.target.value); setError(false); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          {error && (
            <div className="flex items-center gap-2 bg-red-bg text-red-500 rounded-lg px-3.5 py-2.5 text-xs font-semibold">
              <AlertCircle size={14} />
              Invalid username or password. Please try again.
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
      </div>
    </div>
  );
}
