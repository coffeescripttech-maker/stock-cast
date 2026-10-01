import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useUIStore();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={theme === 'dark'}
      className={cn(
        'w-11 h-11 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all',
        'text-slate-400 hover:text-white hover:bg-white/10',
        'border border-slate-700/50',
        className
      )}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
