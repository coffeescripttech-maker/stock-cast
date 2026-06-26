import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Link } from 'lucide-react';
import type { IntegrationSettings } from '../../types/settings';

export default function IntegrationsSection() {
  const int = useSettingsStore((s) => s.settings.integrations);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState<IntegrationSettings>({ ...int });

  useEffect(() => { setForm({ ...int }); }, [int]);

  const handleSave = async () => {
    await updateSettings('integrations', form as unknown as Record<string, unknown>);
    showToast('Integration settings saved', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Link size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Integrations</h2>
          <p className="text-xs text-slate-400">Third-party service integrations</p>
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enable QR Payments</p>
          <p className="text-xs text-slate-400">Accept GCash, Maya, and other QR payments</p>
        </div>
        <button
          onClick={() => setForm({ ...form, enableQrPayments: !form.enableQrPayments })}
          className={`relative w-11 h-6 rounded-full transition-all ${form.enableQrPayments ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.enableQrPayments ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>

      {form.enableQrPayments && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4">
          <Input label="Payment Gateway API Key" type="password" value={form.paymentGatewayApiKey}
            onChange={(e) => setForm({ ...form, paymentGatewayApiKey: e.target.value })} />
        </div>
      )}

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enable Accounting Sync</p>
          <p className="text-xs text-slate-400">Sync transactions to accounting software</p>
        </div>
        <button
          onClick={() => setForm({ ...form, enableAccountingSync: !form.enableAccountingSync })}
          className={`relative w-11 h-6 rounded-full transition-all ${form.enableAccountingSync ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.enableAccountingSync ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>

      {form.enableAccountingSync && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Accounting Provider</label>
            <select value={form.accountingProvider}
              onChange={(e) => setForm({ ...form, accountingProvider: e.target.value as 'none' | 'xero' | 'quickbooks' })}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="xero">Xero</option>
              <option value="quickbooks">QuickBooks</option>
            </select>
          </div>
        </div>
      )}

      <Input label="Webhook URL" type="text" value={form.webhookUrl}
        onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
        hint="Receive real-time event notifications" />

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}
