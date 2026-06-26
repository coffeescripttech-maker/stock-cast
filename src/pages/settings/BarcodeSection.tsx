import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Barcode } from 'lucide-react';
import type { BarcodeSettings } from '../../types/settings';

export default function BarcodeSection() {
  const bc = useSettingsStore((s) => s.settings.barcode);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<BarcodeSettings>({ ...bc });

  useEffect(() => { setForm({ ...bc }); }, [bc]);

  const handleSave = async () => {
    await updateSettings('barcode', form as unknown as Record<string, unknown>);
    showToast('Barcode settings saved', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Barcode size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Barcode</h2>
          <p className="text-xs text-slate-400">Barcode format and display settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Barcode Type</label>
          <select value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'CODE128' | 'EAN13' | 'UPC' })}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option value="CODE128">CODE128</option>
            <option value="EAN13">EAN-13</option>
            <option value="UPC">UPC</option>
          </select>
        </div>
        <Input label="Barcode Width" type="number" min={1} max={10} value={String(form.width)}
          onChange={(e) => setForm({ ...form, width: Number(e.target.value) })} />
        <Input label="Barcode Height" type="number" min={1} max={200} value={String(form.height)}
          onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} />
      </div>

      <div className="space-y-3">
        {[
          { key: 'showPriceBelow' as const, label: 'Show Price Below Barcode' },
          { key: 'showNameBelow' as const, label: 'Show Product Name Below Barcode' },
        ].map((t) => (
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
