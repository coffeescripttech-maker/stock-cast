import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  iconBg?: string;
  className?: string;
  /** Use gradient background instead of solid white */
  gradient?: 'brand' | 'red' | 'orange' | 'emerald' | 'indigo';
}

const GRADIENTS: Record<string, string> = {
  brand: 'bg-gradient-to-br from-brand to-brand-dark text-white',
  red: 'bg-gradient-to-br from-rose-500 to-red-600 text-white',
  orange: 'bg-gradient-to-br from-orange-400 to-orange-600 text-white',
  emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
  indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white',
};

export function StatCard({ label, value, sub, icon, iconBg, className, gradient }: StatCardProps) {
  const isGradient = !!gradient;

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-5 shadow-sm border',
      isGradient
        ? GRADIENTS[gradient!] + ' border-transparent shadow-lg'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      className
    )}>
      {/* Decorative circles (gradient mode only) */}
      {isGradient && (
        <>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />
        </>
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            isGradient ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
          )}>
            {label}
          </span>
          {icon && (
            <div
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                isGradient ? 'bg-white/15' : undefined
              )}
              style={!isGradient && iconBg ? { background: iconBg } : undefined}
            >
              <div className={cn(
                isGradient ? 'text-white' : undefined
              )}>
                {icon}
              </div>
            </div>
          )}
        </div>
        <div className={cn(
          'leading-none mb-1',
          isGradient ? 'text-3xl font-black font-mono tracking-tight' : 'text-2xl font-bold'
        )}>
          {value}
        </div>
        {sub && (
          <div className={cn(
            'text-xs',
            isGradient ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'
          )}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
