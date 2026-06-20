import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { HelpButton, HelpModalContent } from './HelpButton';
import { Dialog } from '../ui/Dialog';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function AppLayout() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <TopNav />
      <main className="flex-1 w-full px-6 md:px-8 py-7 mx-auto animate-[fadeUp_0.25s_ease]">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>

      <HelpButton onClick={() => setHelpOpen(true)} />

      <Dialog open={helpOpen} onOpenChange={setHelpOpen} title="Keyboard Shortcuts" subtitle="Quick access shortcuts for the POS system">
        <HelpModalContent />
      </Dialog>
    </div>
  );
}
