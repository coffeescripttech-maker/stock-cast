import { Suspense, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavNew } from './TopNavNew';
import { CommandPalette } from './CommandPalette';
import { HelpModalContent } from './HelpButton';
import { Dialog } from '../ui/Dialog';
import { useUIStore } from '../../stores/uiStore';
import { useNotificationStore } from '../../stores/notificationStore';
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

    // Start notification polling (30s interval)
    useNotificationStore.getState().startPolling();

    return () => {
      document.removeEventListener('pos:help', onHelp);
      useNotificationStore.getState().stopPolling();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 text-[#181818] dark:text-slate-100">
      {/* ═══ DARK BACKDROP — straight right edge, matches sidebar width exactly ═══ */}
      <div
        className={cn(
          'fixed top-0 left-0 h-screen bg-[#1C1C1C]',
          'rounded-br-[48px] z-0',
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[72px]' : 'w-[220px]'
        )}
      />

      {/* Sidebar — fixed left, sits inside the dark backdrop */}
      <Sidebar />

      {/* Main content — pushed right with margin to sit flush against sidebar */}
      <div
        className={cn(
          'relative z-10 transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[220px]'
        )}>
        <TopNavNew />
        <main className="px-8 pb-8 animate-[fadeUp_0.25s_ease]">
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

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
