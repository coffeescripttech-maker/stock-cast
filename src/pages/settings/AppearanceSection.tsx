import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Monitor, Sun, Moon } from 'lucide-react';
import type { AppearanceSettings } from '../../types/settings';

export default function AppearanceSection() {
  const appearance = useSettingsStore((s) => s.settings.appearance);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const applyAppearance = useSettingsStore((s) => s.applyAppearance);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<AppearanceSettings>({ ...appearance });

  useEffect(() => { setForm({ ...appearance }); }, [appearance]);

  const handleSave = async () => {
    await updateSettings('appearance', form as unknown as Record<string, unknown>);
    applyAppearance();
    showToast('Appearance settings saved', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Monitor size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Appearance</h2>
          <p className="text-xs text-slate-400">Theme, layout, and visual preferences</p>
        </div>
      </div>

      {/* Default Theme */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Default Theme</label>
        <div className="flex gap-3">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setForm({ ...form, defaultTheme: t })}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                form.defaultTheme === t
                  ? 'border-brand bg-brand/10 text-brand dark:bg-brand/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {t === 'light' ? <Sun size={16} /> : <Moon size={16} />}
              {t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Font Size</label>
        <div className="flex gap-2">
          {(['small', 'normal', 'large'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setForm({ ...form, fontSize: s })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 capitalize ${
                form.fontSize === s
                  ? 'border-brand bg-brand/10 text-brand dark:bg-brand/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        {[
          { key: 'denseMode', label: 'Dense Mode', desc: 'Compact spacing for higher information density' },
          { key: 'animationsEnabled', label: 'Animations', desc: 'Enable UI transitions and animations' },
          { key: 'sidebarCollapsedDefault', label: 'Sidebar Collapsed', desc: 'Start with navigation sidebar collapsed' },
        ].map((t) => (
          <div key={t.key} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.label}</p>
              <p className="text-xs text-slate-400">{t.desc}</p>
            </div>
            <button
              onClick={() => setForm({ ...form, [t.key]: !(form as any)[t.key] })}
              className={`relative w-11 h-6 rounded-full transition-all ${
                (form as any)[t.key] ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                (form as any)[t.key] ? 'left-[22px]' : 'left-0.5'
              }`} />
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
