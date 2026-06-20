import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useUIStore();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-brand hover:text-white hover:border-brand transition-all dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300',
        className
      )}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
