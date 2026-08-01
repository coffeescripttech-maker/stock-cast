import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { Search, Bell, Settings, Plus } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pos': 'Point of Sale',
  '/inventory': 'Inventory',
  '/transactions': 'Transactions',
  '/rewards': 'Rewards',
  '/reports': 'Reports',
  '/audit': 'Audit Trail',
  '/settings': 'Settings'
};

export function TopNavNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const setCommandPaletteOpen = useUIStore(s => s.setCommandPaletteOpen);
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const [notifOpen, setNotifOpen] = useState(false);

  // Derive title from current path
  const basePath = '/' + location.pathname.split('/').filter(Boolean)[0];
  const pageTitle = routeTitles[basePath] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 h-[52px] flex items-center justify-between pl-10 pr-6 bg-[#F7F8FA] dark:bg-slate-950 rounded-tl-[24px] border-t-2 border-l-2 border-brand">
      {/* Left: Page title */}
      <h1 className="text-[22px] font-bold text-[#181818] dark:text-white tracking-tight">
        {pageTitle}
      </h1>

      {/* Right: Utility icons */}
      <div className="flex items-center gap-1">
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
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-[#ECECEC] dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          title="Settings">
          <Settings size={15} />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle className="!w-9 !h-9 !rounded-full !border-[#ECECEC] !shadow-sm !text-slate-400 hover:!text-slate-600 hover:!shadow-md hover:-translate-y-0.5 !transition-all !duration-200" />

        {/* New Transaction */}
        <button
          onClick={() => navigate('/pos')}
          className="h-8 px-4 rounded-full bg-brand text-[#1C1C1C] font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5">
          <Plus size={15} />
          New Transaction
        </button>
      </div>
    </header>
  );
}
