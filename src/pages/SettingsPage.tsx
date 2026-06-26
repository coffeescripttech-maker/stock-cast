import { useState } from 'react';
import {
  Globe, Palette, Monitor, ShoppingCart, Package, Receipt, Percent,
  Barcode, Shield, Bell, Mail, Database, Link, Info,
} from 'lucide-react';
import { cn } from '../lib/cn';
import GeneralSection from './settings/GeneralSection';
import BrandingSection from './settings/BrandingSection';
import AppearanceSection from './settings/AppearanceSection';
import PosSettingsSection from './settings/PosSettingsSection';
import InventorySettingsSection from './settings/InventorySettingsSection';
import ReceiptSection from './settings/ReceiptSection';
import TaxCurrencySection from './settings/TaxCurrencySection';
import BarcodeSection from './settings/BarcodeSection';
import SecuritySection from './settings/SecuritySection';
import NotificationsSection from './settings/NotificationsSection';
import EmailSmsSection from './settings/EmailSmsSection';
import BackupSection from './settings/BackupSection';
import IntegrationsSection from './settings/IntegrationsSection';
import AboutSection from './settings/AboutSection';

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const SECTIONS: Section[] = [
  { id: 'general', label: 'General', icon: <Globe size={16} />, component: <GeneralSection /> },
  { id: 'branding', label: 'Branding', icon: <Palette size={16} />, component: <BrandingSection /> },
  { id: 'appearance', label: 'Appearance', icon: <Monitor size={16} />, component: <AppearanceSection /> },
  { id: 'pos', label: 'POS Settings', icon: <ShoppingCart size={16} />, component: <PosSettingsSection /> },
  { id: 'inventory', label: 'Inventory', icon: <Package size={16} />, component: <InventorySettingsSection /> },
  { id: 'receipt', label: 'Receipt & Invoice', icon: <Receipt size={16} />, component: <ReceiptSection /> },
  { id: 'tax', label: 'Tax & Currency', icon: <Percent size={16} />, component: <TaxCurrencySection /> },
  { id: 'barcode', label: 'Barcode', icon: <Barcode size={16} />, component: <BarcodeSection /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} />, component: <SecuritySection /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} />, component: <NotificationsSection /> },
  { id: 'emailSms', label: 'Email & SMS', icon: <Mail size={16} />, component: <EmailSmsSection /> },
  { id: 'backup', label: 'Backup', icon: <Database size={16} />, component: <BackupSection /> },
  { id: 'integrations', label: 'Integrations', icon: <Link size={16} />, component: <IntegrationsSection /> },
  { id: 'about', label: 'About', icon: <Info size={16} />, component: <AboutSection /> },
];

export default function SettingsPage() {
  const [active, setActive] = useState('general');

  const activeSection = SECTIONS.find((s) => s.id === active) || SECTIONS[0];

  return (
    <div className="animate-[fadeUp_0.25s_ease] max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
          Configure your POS system — changes take effect immediately
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0">
          <nav className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden sticky top-20">
            <div className="p-2 space-y-0.5 max-h-[calc(100vh-12rem)] overflow-y-auto">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
                    active === s.id
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                >
                  <span className="flex-shrink-0">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-6 pb-12">
          {activeSection.component}
        </main>
      </div>
    </div>
  );
}
