import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ThemeToggle } from './ThemeToggle';
import { ChangePasswordDialog } from '../ui/ChangePasswordDialog';
import { cn } from '../../lib/cn';
import { resolveApiUrl } from '../../lib/apiBase';
import {
  LayoutDashboard, ShoppingCart, Package, Receipt, Star, BarChart3, ScrollText, LogOut, Store, Settings,
  ChevronDown, Lock, User as UserIcon,
} from 'lucide-react';

interface NavTab {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: ('owner' | 'staff')[];
}

const tabs: NavTab[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} />, roles: ['owner'] },
  { path: '/pos', label: 'Point of Sale', icon: <ShoppingCart size={15} />, roles: ['owner', 'staff'] },
  { path: '/inventory', label: 'Inventory', icon: <Package size={15} />, roles: ['owner'] },
  { path: '/transactions', label: 'Transactions', icon: <Receipt size={15} />, roles: ['owner'] },
  { path: '/rewards', label: 'Rewards', icon: <Star size={15} />, roles: ['owner', 'staff'] },
  { path: '/reports', label: 'Reports', icon: <BarChart3 size={15} />, roles: ['owner'] },
  { path: '/audit', label: 'Audit Trail', icon: <ScrollText size={15} />, roles: ['owner'] },
  { path: '/settings', label: 'Settings', icon: <Settings size={15} />, roles: ['owner'] },
];

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();
  const { logAudit } = useDataStore();
  const closeModal = useUIStore((s) => s.closeModal);

  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const userTabs = tabs.filter((t) => t.roles.includes(currentUser?.role || 'staff'));
  const storeName = useSettingsStore((s) => s.settings.general.storeName);
  const storeLogo = useSettingsStore((s) => s.settings.branding.storeLogo);

  const handleLogout = () => {
    setMenuOpen(false);
    logAudit('LOGOUT', `${currentUser?.displayName} signed out`, currentUser?.displayName, currentUser?.role);
    closeModal();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 dark:bg-slate-900 border-b border-slate-700/50 h-14 px-6 flex items-center gap-2 shadow-md">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mr-4">
        {storeLogo ? (
          <img src={resolveApiUrl(storeLogo)} alt={storeName} className="w-9 h-9 rounded-lg object-contain bg-white/10" />
        ) : (
          <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center shadow-sm">
            <Store size={18} className="text-white" />
          </div>
        )}
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">{storeName}</div>
          <div className="text-[10px] text-slate-400">POS System</div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 flex-1 overflow-x-auto">
        {userTabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              location.pathname === tab.path
                ? 'bg-brand/20 text-brand-light shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 ml-auto flex-shrink-0">
        <ThemeToggle />

        <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all border border-slate-700/50 max-w-[200px]">
              <span className="flex items-center gap-1.5 min-w-0">
                <UserIcon size={13} className="text-slate-400 flex-shrink-0" />
                <span className="truncate">{currentUser?.displayName}</span>
              </span>
              <ChevronDown size={12} className={cn('text-slate-400 flex-shrink-0 transition-transform', menuOpen && 'rotate-180')} />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-[60] min-w-[210px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl"
            >
              {/* Header: name + role badge */}
              <div className="pointer-events-none px-2.5 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {currentUser?.displayName}
                </div>
                <span
                  className={cn(
                    'inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold',
                    currentUser?.role === 'owner'
                      ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                  )}
                >
                  {currentUser?.role === 'owner' ? 'Owner' : 'Staff'}
                </span>
              </div>

              <DropdownMenu.Item
                onSelect={() => {
                  setMenuOpen(false);
                  setPwOpen(true);
                }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer transition-colors data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-700/60"
              >
                <Lock size={13} className="text-slate-400" />
                Change Password
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onSelect={handleLogout}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 outline-none cursor-pointer transition-colors data-[highlighted]:bg-red-50 dark:data-[highlighted]:bg-red-500/10"
              >
                <LogOut size={13} />
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </nav>
  );
}