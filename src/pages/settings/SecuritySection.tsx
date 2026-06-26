import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Shield } from 'lucide-react';
import type { SecuritySettings } from '../../types/settings';

const TOGGLES: { key: keyof SecuritySettings; label: string }[] = [
  { key: 'requireStrongPassword', label: 'Require Strong Password' },
  { key: 'enable2fa', label: 'Enable Two-Factor Authentication' },
];

export default function SecuritySection() {
  const sec = useSettingsStore((s) => s.settings.security);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<SecuritySettings>({ ...sec });

  useEffect(() => { setForm({ ...sec }); }, [sec]);

  const handleSave = async () => {
    await updateSettings('security', form as unknown as Record<string, unknown>);
    showToast('Security settings saved', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Shield size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Users & Security</h2>
          <p className="text-xs text-slate-400">Authentication rules and session management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Password Min Length" type="number" min={4} max={128} value={String(form.passwordMinLength)}
          onChange={(e) => setForm({ ...form, passwordMinLength: Number(e.target.value) })} />
        <Input label="Session Timeout (minutes)" type="number" min={1} value={String(form.sessionTimeout)}
          onChange={(e) => setForm({ ...form, sessionTimeout: Number(e.target.value) })} hint="Auto-logout after inactivity" />
        <Input label="Max Login Attempts" type="number" min={1} value={String(form.maxLoginAttempts)}
          onChange={(e) => setForm({ ...form, maxLoginAttempts: Number(e.target.value) })} />
        <Input label="Lockout Duration (minutes)" type="number" min={1} value={String(form.lockoutDuration)}
          onChange={(e) => setForm({ ...form, lockoutDuration: Number(e.target.value) })} />
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1">
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-center justify-between py-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.label}</p>
            <button
              onClick={() => setForm({ ...form, [t.key]: !form[t.key] })}
              className={`relative w-11 h-6 rounded-full transition-all ${form[t.key] ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form[t.key] ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}
