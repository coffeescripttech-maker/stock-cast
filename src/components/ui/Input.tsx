import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, id, ...props }, ref) => (
    <div className="space-y-1.5 min-w-0">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          'w-full px-3.5 py-3 text-base sm:text-sm min-h-[44px] rounded-lg border border-slate-200 bg-slate-50 outline-none',
          'focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100',
          'dark:focus:border-brand dark:focus:bg-slate-800',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:text-[13px] sm:placeholder:text-sm',
          'font-sans transition-colors duration-150',
          className
        )}
        {...props}
      />
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';
