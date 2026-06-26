import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Mail } from 'lucide-react';
import type { EmailSmsSettings } from '../../types/settings';

export default function EmailSmsSection() {
  const es = useSettingsStore((s) => s.settings.emailSms);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<EmailSmsSettings>({ ...es });

  useEffect(() => { setForm({ ...es }); }, [es]);

  const handleSave = async () => {
    await updateSettings('emailSms', form as unknown as Record<string, unknown>);
    showToast('Email & SMS settings saved', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Mail size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Email & SMS</h2>
          <p className="text-xs text-slate-400">Mail server and SMS provider configuration</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">SMTP Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="SMTP Host" value={form.smtpHost}
            onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} />
          <Input label="SMTP Port" type="number" min={1} max={65535} value={String(form.smtpPort)}
            onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })} />
          <Input label="SMTP Username" value={form.smtpUser}
            onChange={(e) => setForm({ ...form, smtpUser: e.target.value })} />
          <Input label="SMTP Password" type="password" value={form.smtpPass}
            onChange={(e) => setForm({ ...form, smtpPass: e.target.value })} />
          <Input label="Sender Email" type="email" value={form.senderEmail}
            onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} />
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">SMS Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">SMS Provider</label>
            <select value={form.smsProvider}
              onChange={(e) => setForm({ ...form, smsProvider: e.target.value as 'none' | 'twilio' | 'chikka' | 'vonage' })}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="none">None</option>
              <option value="twilio">Twilio</option>
              <option value="chikka">Chikka</option>
              <option value="vonage">Vonage</option>
            </select>
          </div>
          <Input label="SMS API Key" type="password" value={form.smsApiKey}
            onChange={(e) => setForm({ ...form, smsApiKey: e.target.value })} />
          <Input label="SMS Sender ID" value={form.smsSenderId}
            onChange={(e) => setForm({ ...form, smsSenderId: e.target.value })} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}
