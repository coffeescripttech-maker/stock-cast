import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { Search, Bell, Settings, Plus, Menu } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pos': 'Point of Sale',
  '/inventory': 'Inventory',
  '/transactions': 'Transactions',
  '/rewards': 'Rewards',
  '/reports': 'Reports',
  '/audit': 'Audit Trail',
  '/devices': 'Device Testing',
  '/settings': 'Settings'
};

export function TopNavNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const setCommandPaletteOpen = useUIStore(s => s.setCommandPaletteOpen);
  const mobileMenuOpen = useUIStore(s => s.mobileMenuOpen);
  const toggleMobileMenu = useUIStore(s => s.toggleMobileMenu);
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const [notifOpen, setNotifOpen] = useState(false);

  // Derive title from current path
  const basePath = '/' + location.pathname.split('/').filter(Boolean)[0];
  const pageTitle = routeTitles[basePath] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 h-[52px] flex items-center justify-between gap-2 pl-3 pr-3 sm:pl-6 sm:pr-6 lg:pl-10 lg:pr-6 bg-[#F7F8FA] dark:bg-slate-950 rounded-tl-[24px] border-t-2 border-l-2 border-brand">
      {/* Left: mobile hamburger + page title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-[#ECECEC] dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0"
          title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-lg sm:text-[22px] font-bold text-[#181818] dark:text-white tracking-tight truncate min-w-0">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Utility icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-[#ECECEC] dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          title="Search (Ctrl+K)">
          <Search size={15} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-[#ECECEC] dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            title="Notifications">
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="hidden lg:flex w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-[#ECECEC] dark:border-slate-700 shadow-sm items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          title="Settings">
          <Settings size={15} />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle className="hidden lg:flex !w-9 !h-9 !rounded-full !border-[#ECECEC] !shadow-sm !text-slate-400 hover:!text-slate-600 hover:!shadow-md hover:-translate-y-0.5 !transition-all !duration-200" />

        {/* New Transaction */}
        <button
          onClick={() => navigate('/pos')}
          className="hidden lg:flex h-8 px-4 rounded-full bg-brand text-[#1C1C1C] font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 items-center gap-1.5">
          <Plus size={15} />
          <span className="hidden md:inline">New Transaction</span>
        </button>
      </div>
    </header>
  );
}
