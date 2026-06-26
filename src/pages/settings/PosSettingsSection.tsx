import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { ShoppingCart } from 'lucide-react';
import type { PosSettings } from '../../types/settings';

const TOGGLES: { key: keyof PosSettings; label: string; desc: string }[] = [
  { key: 'autoPrintReceipt', label: 'Auto-Print Receipt', desc: 'Automatically print receipt after each sale' },
  { key: 'soundOnScan', label: 'Sound on Scan', desc: 'Play a sound when a barcode is scanned' },
  { key: 'quickAddMode', label: 'Quick-Add Mode', desc: 'Auto-add product on scan without quantity prompt' },
  { key: 'customerRequired', label: 'Customer Required', desc: 'Force customer selection before checkout' },
  { key: 'enableRewards', label: 'Enable Rewards', desc: 'Show loyalty rewards features in POS' },
];

export default function PosSettingsSection() {
  const pos = useSettingsStore((s) => s.settings.pos);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<PosSettings>({ ...pos });

  useEffect(() => { setForm({ ...pos }); }, [pos]);

  const handleSave = async () => {
    await updateSettings('pos', form as unknown as Record<string, unknown>);
    showToast('POS settings saved', 'success');
  };

  const Toggle = ({ item }: { item: { key: keyof PosSettings; label: string; desc: string } }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.label}</p>
        <p className="text-xs text-slate-400">{item.desc}</p>
      </div>
      <button
        onClick={() => setForm({ ...form, [item.key]: !form[item.key] })}
        className={`relative w-11 h-6 rounded-full transition-all ${form[item.key] ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form[item.key] ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <ShoppingCart size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">POS Settings</h2>
          <p className="text-xs text-slate-400">Point of sale behavior and defaults</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Default Sale Type</label>
          <select
            value={form.defaultSaleType}
            onChange={(e) => setForm({ ...form, defaultSaleType: e.target.value as 'rt' | 'ws' })}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="rt">Retail (Per Piece)</option>
            <option value="ws">Wholesale (Per Box/Case)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Default Quantity</label>
          <input
            type="number"
            min={1}
            value={form.defaultQuantity}
            onChange={(e) => setForm({ ...form, defaultQuantity: Math.max(1, Number(e.target.value)) })}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Decimal Places</label>
          <input
            type="number"
            min={0}
            max={4}
            value={form.decimalPlaces}
            onChange={(e) => setForm({ ...form, decimalPlaces: Math.max(0, Math.min(4, Number(e.target.value))) })}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1">
        {TOGGLES.map((t) => <Toggle key={t.key} item={t} />)}
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}
