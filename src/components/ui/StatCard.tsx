import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  iconBg?: string;
  className?: string;
}

export function StatCard({ label, value, sub, icon, iconBg, className }: StatCardProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700',
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{label}</span>
        {icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={iconBg ? { background: iconBg } : undefined}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold leading-none mb-1">{value}</div>
      {sub && <div className="text-xs text-slate-400 dark:text-slate-500">{sub}</div>}
    </div>
  );
}
