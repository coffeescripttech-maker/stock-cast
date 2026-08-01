import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Star,
  BarChart3,
  ScrollText,
  Settings,
  HelpCircle,
  LogOut,
  Store,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarItem {
  path?: string;
  icon: React.ReactNode;
  label: string;
  action?: () => void;
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed);
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const storeName = useSettingsStore(s => s.settings.general.storeName);
  const storeLogo = useSettingsStore(s => s.settings.branding.storeLogo);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const mainItems: SidebarItem[] = [
    {
      path: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard'
    },
    { path: '/pos', icon: <ShoppingCart size={20} />, label: 'POS' },
    { path: '/inventory', icon: <Package size={20} />, label: 'Inventory' },
    {
      path: '/transactions',
      icon: <Receipt size={20} />,
      label: 'Transactions'
    },
    { path: '/rewards', icon: <Star size={20} />, label: 'Rewards' },
    { path: '/reports', icon: <BarChart3 size={20} />, label: 'Reports' },
    { path: '/audit', icon: <ScrollText size={20} />, label: 'Audit' }
  ];

  const bottomItems: SidebarItem[] = [
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
    {
      icon: <HelpCircle size={20} />,
      label: 'Help',
      action: () => document.dispatchEvent(new CustomEvent('pos:help'))
    },
    {
      icon: <LogOut size={20} />,
      label: 'Logout',
      action: () => {
        logout();
        navigate('/login', { replace: true });
      }
    }
  ];

  function handleNav(item: SidebarItem) {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  }

  return (
    <>
      {/* Collapse toggle — subtle floating button on the edge */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'fixed z-50 flex items-center justify-center transition-all duration-300',
          'w-5 h-5 rounded-full bg-brand text-white hover:text-white hover:bg-brand',
          sidebarCollapsed
            ? 'left-[84px] top-[16px]'
            : 'left-[234px] top-[16px]'
        )}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {sidebarCollapsed ? (
          <ChevronRight size={20} />
        ) : (
          <ChevronLeft size={20} />
        )}
      </button>

      {/* Sidebar */}
      <nav
        className={cn(
          'fixed top-0 z-40 flex flex-col shadow-xl shadow-black/20 transition-all duration-300 ease-in-out animate-[sidebarIn_0.3s_ease]',
          sidebarCollapsed ? 'w-[72px]' : 'w-[220px]',
          'h-screen bg-[#1C1C1C] overflow-hidden'
        )}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 flex-shrink-0 mt-2">
          {storeLogo ? (
            <img
              src={storeLogo}
              alt={storeName}
              className="w-10 h-10 rounded-xl object-cover shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-sm flex-shrink-0">
              <Store size={20} className="text-[#1C1C1C]" />
            </div>
          )}
          {!sidebarCollapsed && (
            <span className="ml-3 text-sm font-bold text-white tracking-tight truncate">
              {storeName}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 mb-3 border-t border-white/10" />

        {/* Main navigation */}
        <div className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
          {mainItems.map(item => {
            const active = item.path ? isActive(item.path) : false;
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item)}
                className={cn(
                  'flex items-center gap-3 rounded-xl transition-all duration-200 group',
                  sidebarCollapsed
                    ? 'justify-center w-12 h-12 mx-auto'
                    : 'w-full px-3 py-2.5',
                  active
                    ? 'bg-brand text-[#1C1C1C] shadow-sm'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                )}
                title={sidebarCollapsed ? item.label : undefined}>
                <span
                  className={cn(
                    'flex-shrink-0 transition-transform duration-200',
                    !active && 'group-hover:scale-110'
                  )}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span
                    className={cn(
                      'text-xs font-semibold truncate',
                      active ? 'text-[#1C1C1C]' : 'text-slate-400'
                    )}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-5 mb-2 border-t border-white/10" />

        {/* Bottom section */}
        <div className="flex flex-col gap-1 px-3 pb-5">
          {bottomItems.map(item => {
            const active = item.path ? isActive(item.path) : false;
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item)}
                className={cn(
                  'flex items-center gap-3 rounded-xl transition-all duration-200 group',
                  sidebarCollapsed
                    ? 'justify-center w-12 h-12 mx-auto'
                    : 'w-full px-3 py-2.5',
                  active
                    ? 'bg-brand text-[#1C1C1C] shadow-sm'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                )}
                title={sidebarCollapsed ? item.label : undefined}>
                <span
                  className={cn(
                    'flex-shrink-0 transition-transform duration-200',
                    !active && 'group-hover:scale-110'
                  )}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span
                    className={cn(
                      'text-xs font-semibold truncate',
                      active ? 'text-[#1C1C1C]' : 'text-slate-400'
                    )}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
