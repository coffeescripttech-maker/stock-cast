import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Package } from 'lucide-react';
import type { InventorySettings } from '../../types/settings';

export default function InventorySettingsSection() {
  const inv = useSettingsStore((s) => s.settings.inventory);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<InventorySettings>({ ...inv });

  useEffect(() => { setForm({ ...inv }); }, [inv]);

  const handleSave = async () => {
    await updateSettings('inventory', form as unknown as Record<string, unknown>);
    showToast('Inventory settings saved', 'success');
  };

  const Toggle = ({ key, label }: { key: keyof InventorySettings; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
      <button
        onClick={() => setForm({ ...form, [key]: !form[key] })}
        className={`relative w-11 h-6 rounded-full transition-all ${form[key] ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form[key] ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Package size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Inventory Settings</h2>
          <p className="text-xs text-slate-400">Stock management and barcode configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Low Stock Threshold (Retail)" type="number" min={0} value={String(form.lowStockThresholdRt)}
          onChange={(e) => setForm({ ...form, lowStockThresholdRt: Number(e.target.value) })} />
        <Input label="Low Stock Threshold (Wholesale)" type="number" min={0} value={String(form.lowStockThresholdWs)}
          onChange={(e) => setForm({ ...form, lowStockThresholdWs: Number(e.target.value) })} />
        <Input label="Out of Stock Threshold" type="number" min={0} value={String(form.outOfStockThreshold)}
          onChange={(e) => setForm({ ...form, outOfStockThreshold: Number(e.target.value) })} />
      </div>

      <Input label="Barcode Prefix (Wholesale)" value={form.barcodePrefix}
        onChange={(e) => setForm({ ...form, barcodePrefix: e.target.value })} hint="Prepended to wholesale barcodes" />

      <Input label="Default Supplier" value={form.defaultSupplier}
        onChange={(e) => setForm({ ...form, defaultSupplier: e.target.value })} />

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1">
        <Toggle key="autoGenerateBarcodes" label="Auto-Generate Barcodes" />
        <Toggle key="enableNegativeStock" label="Allow Negative Stock" />
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}
