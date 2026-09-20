import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Input } from './Input';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { passwordValidation } from '../../lib/passwordPolicy';
import * as api from '../../api/client';
import { ApiError } from '../../api/client';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Self-service "change my password" dialog. Available to every user from the
 * TopNav user menu (and reused anywhere else we need it). Mirrors the store's
 * password policy live — min length + strong-password checklist — then calls
 * POST /auth/change-password which verifies the current password server-side.
 */
export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const security = useSettingsStore((s) => s.settings.security);
  const showToast = useUIStore((s) => s.showToast);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const minLen = Math.max(security.passwordMinLength || 6, 4);
  const requireStrong = !!security.requireStrongPassword;

  // Reset the form every time the dialog opens (fresh for each attempt).
  useEffect(() => {
    if (open) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setError('');
      setSaving(false);
    }
  }, [open]);

  const {
    tooShort,
    rules,
    valid: policyValid,
  } = passwordValidation(security, next);

  const mismatch = confirm.length > 0 && confirm !== next;
  const valid = current.length > 0 && policyValid && confirm === next;

  async function handleSubmit() {
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/auth/change-password', {
        currentPassword: current,
        newPassword: next,
      });
      showToast('Password updated', 'success');
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to update password'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Change Password"
      subtitle="You'll use this password on your next login."
    >
      <div className="space-y-4">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            setError('');
          }}
          placeholder="Enter your current password"
        />

        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => {
            setNext(e.target.value);
            setError('');
          }}
          placeholder={`At least ${minLen} characters`}
        />
        {tooShort && (
          <p className="text-xs font-semibold text-red-500">
            Must be at least {minLen} characters
          </p>
        )}
        {requireStrong && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {rules.map((r) => (
              <div key={r.label} className="flex items-center gap-1.5 text-xs">
                <span
                  className={
                    r.ok
                      ? 'text-emerald-500'
                      : 'text-slate-300 dark:text-slate-600'
                  }
                >
                  {r.ok ? '✓' : '○'}
                </span>
                <span
                  className={
                    r.ok
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }
                >
                  {r.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setError('');
          }}
          placeholder="Re-enter the new password"
        />
        {mismatch && (
          <p className="text-xs font-semibold text-red-500">
            Passwords do not match
          </p>
        )}

        {error && (
          <p className="text-xs font-semibold text-red-500">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={handleSubmit}
            disabled={!valid || saving}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Update Password
          </Button>
        </div>
      </div>
    </Dialog>
  );
}