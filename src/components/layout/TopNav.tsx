import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { useUIStore } from '../../stores/uiStore';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../../lib/cn';
import {
  LayoutDashboard, ShoppingCart, Package, Receipt, Star, BarChart3, ScrollText, LogOut, Home,
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
];

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();
  const { logAudit } = useDataStore();
  const closeModal = useUIStore((s) => s.closeModal);

  const userTabs = tabs.filter((t) => t.roles.includes(currentUser?.role || 'staff'));

  const handleLogout = () => {
    logAudit('LOGOUT', `${currentUser?.name} signed out`, currentUser?.name, currentUser?.role);
    closeModal();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-14 px-6 flex items-center gap-2">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center">
          <Home size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Ruiz Store</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">POS System</div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 flex-1">
        {userTabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              location.pathname === tab.path
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 ml-auto">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{currentUser?.name}</span>
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
            currentUser?.role === 'owner'
              ? 'bg-indigo-50 text-brand dark:bg-indigo-950 dark:text-indigo-300'
              : 'bg-green-bg text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
          )}
        >
          {currentUser?.role === 'owner' ? 'Owner' : 'Staff'}
        </span>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-all dark:border-slate-600 dark:text-slate-400 dark:hover:bg-red-950"
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>
    </nav>
  );
}
