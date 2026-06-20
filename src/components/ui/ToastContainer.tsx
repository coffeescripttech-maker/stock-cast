import { useUIStore } from '../../stores/uiStore';
import { Toast } from './Toast';

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} />
      ))}
    </div>
  );
}
