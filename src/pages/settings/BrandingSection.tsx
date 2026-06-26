import { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Palette, Upload, X } from 'lucide-react';

const BRAND_COLORS = [
  '#4f46e5', '#6366f1', '#7c3aed', '#8b5cf6', '#a855f7',
  '#db2777', '#e11d48', '#dc2626', '#ea580c', '#d97706',
  '#ca8a04', '#65a30d', '#16a34a', '#059669', '#0284c7',
];

export default function BrandingSection() {
  const branding = useSettingsStore((s) => s.settings.branding);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const uploadBranding = useSettingsStore((s) => s.uploadBranding);
  const showToast = useUIStore((s) => s.showToast);
  const [form, setForm] = useState({ ...branding });
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const favRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setForm({ ...branding }); }, [branding]);

  const handleColorChange = (key: 'primaryBrandColor' | 'secondaryBrandColor', value: string) => {
    setForm({ ...form, [key]: value });
  };

  const handleFileUpload = async (type: 'logo' | 'favicon', file: File) => {
    setUploading(type);
    const url = await uploadBranding(type, file);
    setUploading(null);
    if (url) {
      setForm({ ...form, [type === 'logo' ? 'storeLogo' : 'favicon']: url });
      showToast(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`, 'success');
    }
  };

  const handleSave = async () => {
    await updateSettings('branding', form as unknown as Record<string, unknown>);
    showToast('Branding settings saved', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Palette size={20} className="text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Branding</h2>
          <p className="text-xs text-slate-400">Customize your store brand identity</p>
        </div>
      </div>

      {/* Logo upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Store Logo</label>
          <div className="flex items-center gap-4">
            {form.storeLogo && (
              <div className="relative w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800">
                <img src={form.storeLogo} alt="Store logo" className="w-full h-full object-contain" />
                <button
                  onClick={() => setForm({ ...form, storeLogo: null })}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow"
                >
                  <X size={10} />
                </button>
              </div>
            )}
            <div>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('logo', file);
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => logoRef.current?.click()}
                disabled={uploading === 'logo'}
              >
                <Upload size={13} /> {uploading === 'logo' ? 'Uploading...' : form.storeLogo ? 'Replace' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Favicon</label>
          <div className="flex items-center gap-4">
            {form.favicon && (
              <div className="relative w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800">
                <img src={form.favicon} alt="Favicon" className="w-full h-full object-contain" />
                <button
                  onClick={() => setForm({ ...form, favicon: null })}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow"
                >
                  <X size={10} />
                </button>
              </div>
            )}
            <div>
              <input
                ref={favRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('favicon', file);
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => favRef.current?.click()}
                disabled={uploading === 'favicon'}
              >
                <Upload size={13} /> {uploading === 'favicon' ? 'Uploading...' : form.favicon ? 'Replace' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Color pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Primary Brand Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primaryBrandColor}
              onChange={(e) => handleColorChange('primaryBrandColor', e.target.value)}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
            />
            <span className="text-xs font-mono text-slate-500">{form.primaryBrandColor}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {BRAND_COLORS.slice(0, 8).map((c) => (
              <button
                key={c}
                onClick={() => handleColorChange('primaryBrandColor', c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${form.primaryBrandColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Secondary Brand Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.secondaryBrandColor}
              onChange={(e) => handleColorChange('secondaryBrandColor', e.target.value)}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
            />
            <span className="text-xs font-mono text-slate-500">{form.secondaryBrandColor}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {BRAND_COLORS.slice(8).map((c) => (
              <button
                key={c}
                onClick={() => handleColorChange('secondaryBrandColor', c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${form.secondaryBrandColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={handleSave}>Save Section</Button>
      </div>
    </div>
  );
}
