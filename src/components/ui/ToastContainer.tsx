import { useUIStore } from '../../stores/uiStore';
import { Toast } from './Toast';

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+104px)] lg:bottom-6 right-3 sm:right-4 lg:right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none max-w-[calc(100vw-1.5rem)] lg:max-w-none max-h-[50dvh] overflow-hidden">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} />
      ))}
    </div>
  );
}
