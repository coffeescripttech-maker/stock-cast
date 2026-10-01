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
        />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => {
            if (hideOverlayClose) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (hideOverlayClose) e.preventDefault();
          }}
          className={cn(
            'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[500px] max-w-[94vw] max-h-[90dvh]',
            'rounded-2xl bg-white dark:bg-slate-800 p-5 sm:p-8 shadow-2xl',
            'data-[state=open]:animate-[scaleIn_0.2s_ease]',
            className
          )}
        >
          {showClose && (
            <div className="flex justify-end -mr-5 sm:-mr-8 -mt-2 sm:-mt-3 mb-1">
              <DialogPrimitive.Close className="w-11 h-11 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-red-950">
                <X size={18} />
              </DialogPrimitive.Close>
            </div>
          )}
          {title && (
            <DialogPrimitive.Title className="text-lg font-bold mb-1 text-slate-900 dark:text-slate-100 pr-10">
              {title}
            </DialogPrimitive.Title>
          )}
          {subtitle && (
            <DialogPrimitive.Description className="text-xs text-slate-400 dark:text-slate-500 mb-6">
              {subtitle}
            </DialogPrimitive.Description>
          )}
          <div className="overflow-y-auto overscroll-contain max-h-[calc(90dvh-5rem)] -mx-5 sm:-mx-8 -mb-5 sm:-mb-8 px-5 sm:px-8 pb-5 sm:pb-8">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
