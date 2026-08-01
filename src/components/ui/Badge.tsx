import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'brand' | 'purple';
  className?: string;
}

const variants: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  success: 'bg-green-bg text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-orange-bg text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-bg text-red-600 dark:bg-red-950 dark:text-red-300',
  brand: 'bg-indigo-50 text-brand dark:bg-indigo-950 dark:text-indigo-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold', variants[variant], className)}>
      {children}
    </span>
  );
}

// Type badge for RT/WS/Mixed
interface TypeBadgeProps {
  type: 'rt' | 'ws' | 'mixed';
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  if (type === 'ws') return <Badge variant="warning" className={cn('text-[11px]', className)}>WS</Badge>;
  if (type === 'rt') return <Badge variant="success" className={cn('text-[11px]', className)}>RT</Badge>;
  return <Badge variant="purple" className={cn('text-[11px]', className)}>Mixed</Badge>;
}
