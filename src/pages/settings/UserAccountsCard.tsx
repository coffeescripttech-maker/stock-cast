import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { passwordValidation } from '../../lib/passwordPolicy';
import * as api from '../../api/client';
import { ApiError } from '../../api/client';
import type { PosUser } from '../../types/auth';
import {
  Users, Plus, Pencil, KeyRound, Power, Loader2, CheckCircle2, XCircle, ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/cn';

type PosUserRole = 'owner' | 'staff';

/* ---------------------------------- helpers ---------------------------------- */

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: PosUserRole;
  onChange: (role: PosUserRole) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as PosUserRole)}
        className={cn(
          'w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none appearance-none pr-9',
          'focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100',
          'dark:focus:border-brand dark:focus:bg-slate-800',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <option value="owner">Owner</option>
        <option value="staff">Staff</option>
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
        active
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-slate-400/15 text-slate-500 dark:text-slate-400'
      )}
    >
      {active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/** Small inline strong-password checklist (mirrors ChangePasswordDialog). */
function PasswordChecklist({ password }: { password: string }) {
  const security = useSettingsStore((s) => s.settings.security);
  const { rules } = passwordValidation(security, password);
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      {rules.map((r) => (
        <div key={r.label} className="flex items-center gap-1.5 text-xs">
          <span className={r.ok ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}>
            {r.ok ? '✓' : '○'}
          </span>
          <span className={r.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- dialogs ---------------------------------- */

function AddUserDialog({ open, onOpenChange, onDone }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const security = useSettingsStore((s) => s.settings.security);
  const showToast = useUIStore((s) => s.showToast);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<PosUserRole>('staff');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setUsername('');
      setDisplayName('');
      setRole('staff');
      setPassword('');
      setConfirm('');
      setError('');
      setSaving(false);
    }
  }, [open]);

  const { minLength, tooShort, valid: policyValid } = passwordValidation(security, password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid =
    username.trim().length > 0 &&
    displayName.trim().length > 0 &&
    policyValid &&
    confirm === password;

  async function handleSubmit() {
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/users', {
        username: username.trim(),
        displayName: displayName.trim(),
        role,
        password,
      });
      showToast(`User "${username.trim()}" created`, 'success');
      onOpenChange(false);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add User"
      subtitle="The new user signs in with these credentials."
    >
      <div className="space-y-4">
        <Input
          label="Username"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(''); }}
          placeholder="e.g. cashier01"
          hint="Letters, numbers, dots, dashes and underscores only"
          autoComplete="off"
        />
        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
          placeholder="Name shown on the POS and receipts"
          autoComplete="off"
        />
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Role</label>
          <RoleSelect value={role} onChange={setRole} />
        </div>
        <Input
          label={`Password (min ${minLength} characters)`}
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          autoComplete="new-password"
        />
        {tooShort && (
          <p className="text-xs font-semibold text-red-500 -mt-2">
            Must be at least {minLength} characters
          </p>
        )}
        <PasswordChecklist password={password} />

        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(''); }}
          autoComplete="new-password"
        />
        {mismatch && (
          <p className="text-xs font-semibold text-red-500 -mt-2">Passwords do not match</p>
        )}

        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="brand" onClick={handleSubmit} disabled={!valid || saving}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Create User
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function EditUserDialog({ open, user, onOpenChange, onDone }: {
  open: boolean;
  user: PosUser | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const { currentUser } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);

  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<PosUserRole>('staff');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user) {
      setDisplayName(user.displayName);
      setRole(user.role);
      setError('');
      setSaving(false);
    }
  }, [open, user]);

  // Server blocks self-demotion, so disable the role picker on your own row.
  const isSelf = user ? currentUser?.id === user.id : false;
  const valid = displayName.trim().length > 0;

  async function handleSubmit() {
    if (!user || !valid) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/users/${user.id}`, {
        displayName: displayName.trim(),
        role,
      });
      showToast('User updated', 'success');
      onOpenChange(false);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${user?.username ?? ''}`}
      subtitle="Update the display name and role for this user."
    >
      <div className="space-y-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Username can't be changed — it's the login identifier.
        </div>
        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
        />
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Role</label>
          <RoleSelect value={role} onChange={setRole} disabled={isSelf} />
          {isSelf && (
            <p className="text-xs text-slate-400">You can't change your own role.</p>
          )}
        </div>

        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="brand" onClick={handleSubmit} disabled={!valid || saving}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function ResetPasswordDialog({ open, user, onOpenChange, onDone }: {
  open: boolean;
  user: PosUser | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const security = useSettingsStore((s) => s.settings.security);
  const showToast = useUIStore((s) => s.showToast);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPassword('');
      setConfirm('');
      setError('');
      setSaving(false);
    }
  }, [open]);

  const { minLength, tooShort, valid: policyValid } = passwordValidation(security, password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid = policyValid && confirm === password;

  async function handleSubmit() {
    if (!user || !valid) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/users/${user.id}/reset-password`, { newPassword: password });
      showToast(`Password reset for ${user.username}`, 'success');
      onOpenChange(false);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Reset Password — ${user?.username ?? ''}`}
      subtitle="The user will sign in with this new password next time."
    >
      <div className="space-y-4">
        <Input
          label={`New password (min ${minLength} characters)`}
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          autoComplete="new-password"
        />
        {tooShort && (
          <p className="text-xs font-semibold text-red-500 -mt-2">
            Must be at least {minLength} characters
          </p>
        )}
        <PasswordChecklist password={password} />

        <Input
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(''); }}
          autoComplete="new-password"
        />
        {mismatch && (
          <p className="text-xs font-semibold text-red-500 -mt-2">Passwords do not match</p>
        )}

        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="brand" onClick={handleSubmit} disabled={!valid || saving}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Reset Password
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/* ---------------------------------- main card ---------------------------------- */

export default function UserAccountsCard() {
  const { currentUser } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);

  const [users, setUsers] = useState<PosUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<PosUser | null>(null);
  const [resetting, setResetting] = useState<PosUser | null>(null);

  async function fetchUsers() {
    try {
      const res = await api.get<{ data: PosUser[] }>('/users');
      setUsers(res.data);
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Which active owners can be deactivated/demoted? The server enforces these
  // too — this is just so the UI doesn't even offer the option.
  const activeOwners = users.filter((u) => u.role === 'owner' && u.isActive).length;

  function canDeactivate(u: PosUser): boolean {
    if (currentUser?.id === u.id) return false; // never your own account
    if (u.role === 'owner' && u.isActive && activeOwners <= 1) return false; // never the last owner
    return true;
  }

  async function handleToggleActive(u: PosUser) {
    if (!canDeactivate(u) || togglingId !== null) return;
    setTogglingId(u.id);
    try {
      const next = !u.isActive;
      await api.put(`/users/${u.id}`, { isActive: next });
      showToast(next ? `${u.username} activated` : `${u.username} deactivated`, 'success');
      await fetchUsers();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update user', 'error');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
            <Users size={20} className="text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Accounts</h2>
            <p className="text-xs text-slate-400">Create users, manage roles and access</p>
          </div>
        </div>
        <Button variant="brand" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Add User
        </Button>
      </div>

      {loadError && (
        <div className="text-xs font-semibold text-red-500">{loadError}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <th className="py-2 pr-4 font-semibold">Username</th>
              <th className="py-2 pr-4 font-semibold">Display name</th>
              <th className="py-2 pr-4 font-semibold">Role</th>
              <th className="py-2 pr-4 font-semibold">Status</th>
              <th className="py-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                  <Loader2 size={16} className="animate-spin inline-block mr-2" />
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                const deactivable = canDeactivate(u);
                return (
                  <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-200">
                      {u.username}
                      {isSelf && (
                        <span className="ml-2 text-[10px] font-bold text-brand px-1.5 py-0.5 rounded-full bg-brand/10">
                          you
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{u.displayName}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold',
                          u.role === 'owner'
                            ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                        )}
                      >
                        {u.role === 'owner' ? 'Owner' : 'Staff'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4"><StatusPill active={u.isActive} /></td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(u)}
                          title="Edit display name / role"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setResetting(u)}
                          title="Reset password"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                        >
                          <KeyRound size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={!deactivable || togglingId !== null}
                          title={
                            !deactivable
                              ? isSelf
                                ? "You can't deactivate your own account"
                                : "Can't deactivate the last active owner"
                              : u.isActive
                                ? 'Deactivate — user can no longer sign in'
                                : 'Activate — user can sign in again'
                          }
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                            u.isActive
                              ? 'text-slate-400 hover:text-red-500 hover:bg-red-500/10'
                              : 'text-emerald-500 hover:bg-emerald-500/10',
                            (!deactivable || togglingId !== null) && 'opacity-40 cursor-not-allowed'
                          )}
                        >
                          {togglingId === u.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Power size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} onDone={fetchUsers} />
      <EditUserDialog open={editing !== null} user={editing} onOpenChange={(o) => { if (!o) setEditing(null); }} onDone={fetchUsers} />
      <ResetPasswordDialog open={resetting !== null} user={resetting} onOpenChange={(o) => { if (!o) setResetting(null); }} onDone={fetchUsers} />
    </div>
  );
}