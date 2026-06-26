import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Database } from 'lucide-react';
import type { BackupSettings } from '../../types/settings';

export default function BackupSection() {
  const bk = useSettingsStore((s) => s.settings.backup);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<BackupSettings>({ ...bk });

  useEffect(() => { setForm({ ...bk }); }, [bk]);

  const handleSave = async () => {
    await updateSettings('backup', form as unknown as Record<string, unknown>);
    showToast('Backup settings saved', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Database size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Backup & Restore</h2>
          <p className="text-xs text-slate-400">Database backup automation and retention</p>
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enable Auto-Backup</p>
          <p className="text-xs text-slate-400">Automatically backup the database on schedule</p>
        </div>
        <button
          onClick={() => setForm({ ...form, enableAutoBackup: !form.enableAutoBackup })}
          className={`relative w-11 h-6 rounded-full transition-all ${form.enableAutoBackup ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.enableAutoBackup ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>

      {form.enableAutoBackup && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Auto-Backup Frequency</label>
            <select value={form.autoBackupFrequency}
              onChange={(e) => setForm({ ...form, autoBackupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <Input label="Backup Retention (days)" type="number" min={1} value={String(form.backupRetentionDays)}
            onChange={(e) => setForm({ ...form, backupRetentionDays: Number(e.target.value) })} />
          <Input label="Backup Location (path)" value={form.backupLocation}
            onChange={(e) => setForm({ ...form, backupLocation: e.target.value })} hint="Server file path for backup storage" />
        </div>
      )}

      {bk.lastBackup && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-600 dark:text-slate-400">
          Last backup: <span className="font-mono font-semibold">{bk.lastBackup}</span>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}
