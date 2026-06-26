import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Percent } from 'lucide-react';
import type { TaxSettings } from '../../types/settings';

export default function TaxCurrencySection() {
  const tax = useSettingsStore((s) => s.settings.tax);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<TaxSettings>({ ...tax });

  useEffect(() => { setForm({ ...tax }); }, [tax]);

  const handleSave = async () => {
    await updateSettings('tax', form as unknown as Record<string, unknown>);
    showToast('Tax & Currency settings saved', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Percent size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tax & Currency</h2>
          <p className="text-xs text-slate-400">Tax rates, currency formatting, and separators</p>
        </div>
      </div>

      {/* Enable Tax Toggle */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enable Tax</p>
          <p className="text-xs text-slate-400">Apply tax to all transactions</p>
        </div>
        <button
          onClick={() => setForm({ ...form, enabled: !form.enabled })}
          className={`relative w-11 h-6 rounded-full transition-all ${form.enabled ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.enabled ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>

      {form.enabled && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Tax Label</label>
            <select value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="VAT">VAT</option>
              <option value="GST">GST</option>
              <option value="Sales Tax">Sales Tax</option>
            </select>
          </div>
          <Input label="Tax Rate (%)" type="number" min={0} max={100} step={0.01} value={String(form.rate)}
            onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} />
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.inclusivePricing}
                onChange={(e) => setForm({ ...form, inclusivePricing: e.target.checked })}
                className="rounded border-slate-300 text-brand focus:ring-brand" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Inclusive Pricing</span>
            </label>
          </div>
        </div>
      )}

      {/* Currency Formatting */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Currency Format</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input label="Currency Symbol" value={form.currencySymbol}
            onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })} />
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Position</label>
            <select value={form.currencyPosition}
              onChange={(e) => setForm({ ...form, currencyPosition: e.target.value as 'before' | 'after' })}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="before">Before (₱1,000)</option>
              <option value="after">After (1,000₱)</option>
            </select>
          </div>
          <Input label="Decimal Separator" value={form.decimalSeparator} maxLength={1}
            onChange={(e) => setForm({ ...form, decimalSeparator: e.target.value })} />
          <Input label="Thousand Separator" value={form.thousandSeparator} maxLength={1}
            onChange={(e) => setForm({ ...form, thousandSeparator: e.target.value })} />
        </div>
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
          <span className="text-sm text-slate-500">Preview: </span>
          <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">
            {form.currencyPosition === 'before' ? form.currencySymbol : ''}
            1{form.thousandSeparator}234{form.decimalSeparator}56
            {form.currencyPosition === 'after' ? form.currencySymbol : ''}
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}
