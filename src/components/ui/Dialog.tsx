import { type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/cn';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showClose?: boolean;
  className?: string;
  hideOverlayClose?: boolean;
}

export function Dialog({
  open,
  onOpenChange,
  children,
  title,
  subtitle,
  showClose = true,
  className,
  hideOverlayClose = false,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 bg-black/45 z-50 data-[state=open]:animate-[fadeIn_0.2s_ease]',
          )}
          onClick={hideOverlayClose ? undefined : undefined}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[500px] max-w-[94vw] max-h-[90vh] overflow-y-auto',
            'rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-2xl',
            'data-[state=open]:animate-[scaleIn_0.2s_ease]',
            className
          )}
        >
          {showClose && (
            <DialogPrimitive.Close className="absolute top-5 right-5 w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-red-950">
              <X size={14} />
            </DialogPrimitive.Close>
          )}
          {title && (
            <DialogPrimitive.Title className="text-lg font-bold mb-1 text-slate-900 dark:text-slate-100">
              {title}
            </DialogPrimitive.Title>
          )}
          {subtitle && (
            <DialogPrimitive.Description className="text-xs text-slate-400 dark:text-slate-500 mb-6">
              {subtitle}
            </DialogPrimitive.Description>
          )}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
