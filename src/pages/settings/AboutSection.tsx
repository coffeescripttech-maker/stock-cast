import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Info } from 'lucide-react';

export default function AboutSection() {
  const about = useSettingsStore((s) => s.settings.about);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState({ ...about });

  useEffect(() => { setForm({ ...about }); }, [about]);

  const handleSave = async () => {
    await updateSettings('about', form as unknown as Record<string, unknown>);
    showToast('About settings saved', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Info size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">About</h2>
          <p className="text-xs text-slate-400">Application information and credits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="App Version" value={form.appVersion}
          onChange={(e) => setForm({ ...form, appVersion: e.target.value })} />
        <Input label="License Type" value={form.licenseType}
          onChange={(e) => setForm({ ...form, licenseType: e.target.value })} />
        <Input label="Developer Info" value={form.developerInfo}
          onChange={(e) => setForm({ ...form, developerInfo: e.target.value })} />
        <Input label="Footer Credits" value={form.footerCredits}
          onChange={(e) => setForm({ ...form, footerCredits: e.target.value })} />
        <Input label="Privacy Policy URL" type="url" value={form.privacyPolicyUrl}
          onChange={(e) => setForm({ ...form, privacyPolicyUrl: e.target.value })} />
        <Input label="Terms of Service URL" type="url" value={form.termsUrl}
          onChange={(e) => setForm({ ...form, termsUrl: e.target.value })} />
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}
