import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  iconBg?: string;
  className?: string;
  /** Accent color for the icon background */
  accent?: 'brand' | 'red' | 'orange' | 'emerald' | 'indigo';
  /** Color for the left accent strip — overrides accent-based color */
  stripColor?: string;
}

const ACCENTS: Record<string, string> = {
  brand: 'text-brand bg-brand/15',
  red: 'text-red-500 bg-red-50 dark:bg-red-950',
  orange: 'text-orange-500 bg-orange-50 dark:bg-orange-950',
  emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950',
  indigo: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950',
};

const STRIP_CLASSES: Record<string, string> = {
  brand: 'bg-brand',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  emerald: 'bg-emerald-500',
  indigo: 'bg-indigo-500',
};

export function StatCard({ label, value, sub, icon, iconBg, className, accent = 'brand' }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[20px] bg-white dark:bg-[#1C1C1C]',
        'border border-[#ECECEC] dark:border-[#2a2a2a] p-6',
        'shadow-[0_4px_16px_rgba(0,0,0,0.05)]',
        'hover:-translate-y-1 hover:shadow-lg transition-all duration-250',
        className
      )}
    >
      {/* Left accent strip — rounded from the left edge (pill shape) */}
      <span
        className={cn(
          'absolute left-0 top-3 bottom-3 w-[3.5px] rounded-r-full',
          STRIP_CLASSES[accent]
        )}
      />

      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] dark:text-slate-400">
          {label}
        </span>
        {icon && (
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
              accent ? ACCENTS[accent] : ''
            )}
            style={!accent && iconBg ? { background: iconBg } : undefined}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="text-3xl font-black font-mono tracking-tight text-[#181818] dark:text-white leading-none mb-1">
        {value}
      </div>
      {sub && (
        <div className="text-xs text-[#6B7280] dark:text-slate-400 mt-2">
          {sub}
        </div>
      )}
    </div>
  );
}
