import { useEffect, useState } from 'react';
import type { ToastType } from '../../types/ui';
import { cn } from '../../lib/cn';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: ToastType;
}

const icons = {
  success: <CheckCircle2 size={16} />,
  error: <XCircle size={16} />,
  info: <Info size={16} />,
};

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-600',
  error: 'bg-red-500',
  info: 'bg-brand',
};

export function Toast({ message, type }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg flex items-center gap-2 max-w-xs',
        styles[type],
        'animate-[toastIn_0.3s_ease]',
        visible ? 'opacity-100' : 'opacity-0 transition-opacity duration-300'
      )}
    >
      {icons[type]} {message}
    </div>
  );
}
