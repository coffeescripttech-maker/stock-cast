import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Bell } from 'lucide-react';
import type { NotificationSettings } from '../../types/settings';

const TOGGLES: { key: keyof NotificationSettings; label: string }[] = [
  { key: 'lowStockAlert', label: 'Low Stock Alert' },
  { key: 'newCustomerAlert', label: 'New Customer Alert' },
  { key: 'emailNotifications', label: 'Email Notifications' },
  { key: 'pushNotifications', label: 'Push Notifications' },
];

export default function NotificationsSection() {
  const notif = useSettingsStore((s) => s.settings.notifications);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<NotificationSettings>({ ...notif });

  useEffect(() => { setForm({ ...notif }); }, [notif]);

  const handleSave = async () => {
    await updateSettings('notifications', form as unknown as Record<string, unknown>);
    showToast('Notification settings saved', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Bell size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Notifications</h2>
          <p className="text-xs text-slate-400">Alert preferences and notification thresholds</p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Daily Sales Report Time" type="text" value={form.dailySalesReportTime}
          onChange={(e) => setForm({ ...form, dailySalesReportTime: e.target.value })} hint="24-hour format (HH:MM)" />
        <Input label="Large Transaction Threshold (₱)" type="number" min={0} value={String(form.largeTransactionThreshold)}
          onChange={(e) => setForm({ ...form, largeTransactionThreshold: Number(e.target.value) })} hint="Alert when transaction exceeds this amount" />
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}
