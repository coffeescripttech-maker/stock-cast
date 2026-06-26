import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Receipt } from 'lucide-react';
import type { ReceiptSettings } from '../../types/settings';

export default function ReceiptSection() {
  const receipt = useSettingsStore((s) => s.settings.receipt);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<ReceiptSettings>({ ...receipt });

  useEffect(() => { setForm({ ...receipt }); }, [receipt]);

  const handleSave = async () => {
    await updateSettings('receipt', form as unknown as Record<string, unknown>);
    showToast('Receipt settings saved', 'success');
  };

  const Toggle = ({ key, label }: { key: keyof ReceiptSettings; label: string }) => (
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
          <Receipt size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Receipt & Invoice</h2>
          <p className="text-xs text-slate-400">Receipt appearance and content customization</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Header Text</label>
          <textarea value={form.headerText} rows={2}
            onChange={(e) => setForm({ ...form, headerText: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 resize-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Footer Text</label>
          <textarea value={form.footerText} rows={2}
            onChange={(e) => setForm({ ...form, footerText: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 resize-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Return Policy Text</label>
          <textarea value={form.returnPolicyText} rows={2}
            onChange={(e) => setForm({ ...form, returnPolicyText: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 resize-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Paper Size</label>
          <select value={form.paperSize}
            onChange={(e) => setForm({ ...form, paperSize: e.target.value as '58mm' | '80mm' })}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option value="58mm">58mm (Thermal Receipt)</option>
            <option value="80mm">80mm (Standard)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Discount Label</label>
          <input type="text" value={form.discountLabel}
            onChange={(e) => setForm({ ...form, discountLabel: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1">
        <Toggle key="showLogoOnReceipt" label="Show Logo on Receipt" />
        <Toggle key="showCustomerInfo" label="Show Customer Info" />
        <Toggle key="showBarcodeOnReceipt" label="Show Barcode" />
        <Toggle key="showQrCodeOnReceipt" label="Show QR Code" />
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}
