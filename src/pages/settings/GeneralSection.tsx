import { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Globe } from 'lucide-react';

interface Field {
  key: string;
  label: string;
  type?: 'text' | 'select';
  options?: string[];
}

const FIELDS: Field[] = [
  { key: 'storeName', label: 'Store Name' },
  { key: 'address', label: 'Address' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'taxId', label: 'Tax ID / TIN' },
  { key: 'timezone', label: 'Timezone', type: 'select', options: ['Asia/Manila', 'Asia/Tokyo', 'Asia/Singapore', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'UTC'] },
  { key: 'dateFormat', label: 'Date Format', type: 'select', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MMMM DD, YYYY'] },
  { key: 'currencyLocale', label: 'Currency Locale', type: 'select', options: ['en-PH', 'en-US', 'en-GB', 'ja-JP', 'en-SG', 'en-AU'] },
];

export default function GeneralSection() {
  const general = useSettingsStore((s) => s.settings.general);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState({ ...general });
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm({ ...general }); }, [general]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings('general', form as unknown as Record<string, unknown>);
    setSaving(false);
    showToast('General settings saved', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Globe size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">General Settings</h2>
          <p className="text-xs text-slate-400">Store information and regional preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          f.type === 'select' ? (
            <div key={f.key}>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">{f.label}</label>
              <select
                value={(form as any)[f.key] || ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ) : (
            <Input
              key={f.key}
              label={f.label}
              value={(form as any)[f.key] || ''}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          )
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Section'}
        </Button>
      </div>
    </div>
  );
}
