import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../../lib/cn';
import {
  LayoutDashboard, ShoppingCart, Package, Receipt, Star, BarChart3, ScrollText, LogOut, Store, Settings,
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

  const userTabs = tabs.filter((t) => t.roles.includes(currentUser?.role || 'staff'));
  const storeName = useSettingsStore((s) => s.settings.general.storeName);
  const storeLogo = useSettingsStore((s) => s.settings.branding.storeLogo);

  const handleLogout = () => {
    logAudit('LOGOUT', `${currentUser?.name} signed out`, currentUser?.name, currentUser?.role);
    closeModal();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 dark:bg-slate-900 border-b border-slate-700/50 h-14 px-6 flex items-center gap-2 shadow-md">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mr-4">
        {storeLogo ? (
          <img src={storeLogo} alt={storeName} className="w-9 h-9 rounded-lg object-contain bg-white/10" />
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
        <span className="text-xs font-medium text-slate-300">{currentUser?.name}</span>
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
            currentUser?.role === 'owner'
              ? 'bg-indigo-500/20 text-indigo-300'
              : 'bg-emerald-500/20 text-emerald-300'
          )}
        >
          {currentUser?.role === 'owner' ? 'Owner' : 'Staff'}
        </span>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-300 hover:bg-red-500/15 transition-all border border-slate-700/50"
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>
    </nav>
  );
}
