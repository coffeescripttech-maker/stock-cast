import { Suspense, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavNew } from './TopNavNew';
import { BottomNav } from './BottomNav';
import { BluetoothDeviceChooser } from './BluetoothDeviceChooser';
import { CommandPalette } from './CommandPalette';
import { HelpModalContent } from './HelpButton';
import { Dialog } from '../ui/Dialog';
import { useUIStore } from '../../stores/uiStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useDataStore } from '../../stores/dataStore';
import { cn } from '../../lib/cn';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function AppLayout() {
  const [helpOpen, setHelpOpen] = useState(false);
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed);

  // Listen for help event from sidebar
  useEffect(() => {
    function onHelp() {
      setHelpOpen(true);
    }
    document.addEventListener('pos:help', onHelp);
    // here
    // Start notification polling (30s interval)
    useNotificationStore.getState().startPolling();

    return () => {
      document.removeEventListener('pos:help', onHelp);
      useNotificationStore.getState().stopPolling();
    };
  }, []);

  // Near-real-time cross-device sync: re-pull all data whenever the app is
  // focused/foregrounded and on a slow interval. This means a sale made on the
  // phone shows up on the desktop (and vice-versa) without a relogin/reload.
  useEffect(() => {
    let last = 0;
    const refresh = () => {
      const now = Date.now();
      if (now - last < 8000) return; // throttle bursts of focus events
      last = now;
      void useDataStore.getState().refreshAll();
    };
    const onVisible = () => {
      if (!document.hidden) refresh();
    };

    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    const interval = window.setInterval(onVisible, 60000);

    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 text-[#181818] dark:text-slate-100">
      {/* ═══ DARK BACKDROP — straight right edge, matches sidebar width exactly (desktop only) ═══ */}
      <div
        className={cn(
          'hidden lg:block fixed top-0 left-0 h-screen bg-[#1C1C1C]',
          'rounded-br-[48px] z-0',
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[72px]' : 'w-[220px]'
        )}
      />

      {/* Sidebar — fixed left, sits inside the dark backdrop */}
      <Sidebar />

      {/* Main content — full width on mobile, pushed right beside the sidebar on desktop */}
      <div
        className={cn(
          'relative z-10 ml-0 transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[220px]'
        )}>
        <TopNavNew />
        <main className="px-4 sm:px-6 lg:px-8 pb-28 lg:pb-8 animate-[fadeUp_0.25s_ease]">
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Mobile/tablet bottom navigation */}
      <BottomNav />

      {/* Desktop Bluetooth device picker (Electron only) */}
      <BluetoothDeviceChooser />

      {/* Command Palette overlay */}
      <CommandPalette />

      {/* Help dialog */}
      <Dialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="Keyboard Shortcuts"
        subtitle="Quick access shortcuts for the POS system">
        <HelpModalContent />
      </Dialog>
    </div>
  );
}
