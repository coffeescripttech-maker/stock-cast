import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 cursor-pointer font-sans active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200',
        secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
        danger: 'border border-slate-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-500 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-red-950',
        green: 'bg-emerald-500 text-white hover:bg-emerald-600',
        outline: 'border border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-5 py-3 text-sm',
        icon: 'w-8 h-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  )
);
Button.displayName = 'Button';
