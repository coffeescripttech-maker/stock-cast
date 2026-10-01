import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import { resolveApiUrl, setApiBase } from '../../lib/apiBase';
import { getApiBase } from '../../lib/apiBase';
import { AlertCircle, Loader2, Store, Server, CheckCircle } from 'lucide-react';

// Running inside the Capacitor Android app (WebView) vs a normal browser/Electron
const isNative =
  typeof window !== 'undefined' &&
  !!(
    window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.();

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(s => s.login);
  const currentUser = useAuthStore(s => s.currentUser);
  const hydrate = useDataStore(s => s.hydrate);
  const navigate = useNavigate();
  const storeName = useSettingsStore(s => s.settings.general.storeName);
  const storeLogo = useSettingsStore(s => s.settings.branding.storeLogo);

  // Server-address dialog (Android app only — the server lives on the PC)
  const [serverOpen, setServerOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState('');

  // "Forgot password" — self-service flow. Because this POS has no email/SMS,
  // the reset code is returned directly in the response and displayed on-screen.
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Step tracking: 0 = enter username, 1 = enter code + new password, 2 = done
  const [forgotStep, setForgotStep] = useState(0);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const openServerDialog = () => {
    setServerUrl(localStorage.getItem('ruizpos_api_base') ?? '');
    setServerOpen(true);
  };

  const saveServerUrl = () => {
    setApiBase(serverUrl);
    setServerOpen(false);
    window.location.reload();
  };

  // ── Forgot Password handlers ──

  const handleForgotRequest = async () => {
    if (!forgotUsername.trim()) {
      setForgotError('Please enter your username');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await fetch(`${getApiBase()}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername.trim() })
      });
      const data = await res.json();
      if (!data.success) {
        setForgotError(data.error || 'Failed to generate reset code');
      } else {
        // If a code was returned, move to step 1
        if (data.data?.code) {
          setResetCode(data.data.code);
          setForgotStep(1);
        } else {
          setForgotError(
            'Could not generate reset code. Ask the owner for help.'
          );
        }
      }
    } catch {
      setForgotError(
        `Cannot reach the server at ${getApiBase()}. Make sure the server is running.`
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || resetCode.length !== 6) {
      setForgotError('Please enter the 6-digit reset code');
      return;
    }
    if (!newPassword) {
      setForgotError('Please enter a new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await fetch(`${getApiBase()}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername.trim(),
          code: resetCode,
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (!data.success) {
        setForgotError(data.error || 'Password reset failed');
      } else {
        setForgotStep(2);
      }
    } catch {
      setForgotError(
        `Cannot reach the server at ${getApiBase()}. Make sure the server is running.`
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotDialog = () => {
    setForgotOpen(false);
    // Reset state after close animation runs
    setTimeout(() => {
      setForgotStep(0);
      setForgotUsername('');
      setForgotError('');
      setForgotLoading(false);
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    }, 300);
  };

  // If already logged in, redirect
  if (currentUser) {
    return (
      <Navigate
        to={currentUser.role === 'owner' ? '/dashboard' : '/pos'}
        replace
      />
    );
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
      navigate(user.role === 'owner' ? '/dashboard' : '/pos', {
        replace: true
      });
    } else {
      setError(errMsg);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleLogin();
  };

  return (
    <div className="min-h-dvh flex items-start sm:items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 dark:from-indigo-950 dark:via-slate-950 dark:to-slate-900 overflow-y-auto overscroll-contain py-6 sm:py-0">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-[400px] mx-4 p-5 sm:p-8 lg:p-11 shadow-2xl border border-brand/5 animate-[fadeUp_0.4s_ease]">
        {/* Logo */}
        <div className="w-13 h-13 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-5">
          {storeLogo ? (
            <img
              src={resolveApiUrl(storeLogo)}
              alt={storeName}
              className="w-full h-full rounded-2xl object-contain"
            />
          ) : (
            <Store size={22} className="text-white" />
          )}
        </div>

        <h1 className="text-xl font-bold text-center mb-1.5 text-slate-900 dark:text-slate-100 break-words line-clamp-2">
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
            onChange={e => {
              setUsername(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          {error && (
            <div className="flex items-start gap-2 bg-red-bg text-red-500 rounded-lg px-3.5 py-2.5 text-xs font-semibold leading-relaxed">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{error}</span>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleLogin}
            disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>

          <div className="text-center">
            <button
              onClick={() => setForgotOpen(true)}
              className="text-xs font-semibold text-slate-400 hover:text-brand transition-colors inline-flex items-center justify-center min-h-[44px] px-4 -mx-4">
              Forgot password?
            </button>
          </div>
        </div>

        <hr className="border-t border-slate-200 dark:border-slate-700 my-6" />

        {/* Android app only — point this app at the PC running the POS server */}
        {isNative && (
          <button
            onClick={openServerDialog}
            className="mt-4 w-full flex items-center justify-center gap-1.5 min-h-[44px] text-xs font-semibold text-slate-400 hover:text-brand transition-colors">
            <Server size={13} className="flex-shrink-0" />
            Configure Server Address
          </button>
        )}
      </div>

      {/* Forgot-password flow — self-service, code displayed on-screen */}
      <Dialog
        open={forgotOpen}
        onOpenChange={closeForgotDialog}
        title="Forgot Password?"
        subtitle={
          forgotStep === 0
            ? 'Enter your username to get a reset code.'
            : forgotStep === 1
              ? 'Enter the reset code and choose a new password.'
              : 'Password reset successful!'
        }
        hideOverlayClose>
        {/* Step 0: Enter username */}
        {forgotStep === 0 && (
          <div className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="Enter your username"
              value={forgotUsername}
              onChange={e => {
                setForgotUsername(e.target.value);
                setForgotError('');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !forgotLoading) handleForgotRequest();
              }}
              disabled={forgotLoading}
            />

            {forgotError && (
              <div className="flex items-start gap-2 bg-red-bg text-red-500 rounded-lg px-3.5 py-2.5 text-xs font-semibold leading-relaxed">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{forgotError}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              A 6-digit reset code will be generated and displayed on this
              screen. Show this code to the user who needs to reset their
              password.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" onClick={closeForgotDialog} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button
                variant="brand"
                className="flex-1 sm:flex-none"
                onClick={handleForgotRequest}
                disabled={forgotLoading}>
                {forgotLoading && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Generate Reset Code
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Enter code + new password */}
        {forgotStep === 1 && (
          <div className="space-y-4">
            {/* Display the reset code prominently */}
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 px-5 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1.5">
                Reset Code
              </p>
              <p className="text-2xl sm:text-3xl font-black font-mono tracking-[0.2em] text-amber-800 dark:text-amber-200 break-all">
                {resetCode}
              </p>
              <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-1.5">
                This code expires in 10 minutes
              </p>
            </div>

            <Input
              label="Reset Code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter the 6-digit code above"
              value={resetCode}
              onChange={e => {
                setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setForgotError('');
              }}
              maxLength={6}
              disabled={forgotLoading}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Enter a new password"
              value={newPassword}
              onChange={e => {
                setNewPassword(e.target.value);
                setForgotError('');
              }}
              disabled={forgotLoading}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter the new password"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                setForgotError('');
              }}
              disabled={forgotLoading}
            />

            {forgotError && (
              <div className="flex items-start gap-2 bg-red-bg text-red-500 rounded-lg px-3.5 py-2.5 text-xs font-semibold leading-relaxed">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{forgotError}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="secondary"
                className="flex-1 sm:flex-none"
                onClick={() => setForgotStep(0)}
                disabled={forgotLoading}>
                Back
              </Button>
              <Button
                variant="brand"
                className="flex-1 sm:flex-none"
                onClick={handleResetPassword}
                disabled={forgotLoading}>
                {forgotLoading && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Reset Password
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Done */}
        {forgotStep === 2 && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Password has been reset successfully!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You can now sign in with your new password.
              </p>
            </div>
            <Button
              variant="brand"
              className="w-full"
              onClick={() => {
                closeForgotDialog();
                setUsername(forgotUsername);
              }}>
              Back to Sign In
            </Button>
          </div>
        )}
      </Dialog>

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
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.50:3001"
              className="w-full px-3.5 py-3 text-base sm:text-sm min-h-[44px] rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 font-mono tracking-wider"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Usually{' '}
              <span className="font-mono">http://&lt;PC-LAN-IP&gt;:3001</span>.
              Leave empty to use the app's own origin (desktop).
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setServerOpen(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="brand" className="flex-1 sm:flex-none" onClick={saveServerUrl}>
              Save &amp; Reload
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
