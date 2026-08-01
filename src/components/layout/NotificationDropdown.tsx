import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../stores/notificationStore';
import { Bell, Package, DollarSign, UserPlus, X, CheckCheck } from 'lucide-react';
import type { AppNotification } from '../../types/notification';

interface Props {
  open: boolean;
  onClose: () => void;
}

const iconMap: Record<AppNotification['type'], React.ReactNode> = {
  low_stock: <Package size={14} className="text-amber-400" />,
  large_txn: <DollarSign size={14} className="text-blue-400" />,
  new_customer: <UserPlus size={14} className="text-emerald-400" />,
};

export function NotificationDropdown({ open, onClose }: Props) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  const handleNotificationClick = (n: AppNotification) => {
    markAsRead(n.id);
    onClose();
    if (n.link) navigate(n.link);
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Notifications
          {notifications.length > 0 && (
            <span className="ml-2 text-[10px] font-semibold text-slate-400">
              ({notifications.length})
            </span>
          )}
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-0.5">
          <X size={16} />
        </button>
      </div>

      {/* List */}
      <div className="max-h-[300px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-slate-400">
            <Bell size={28} className="mb-2 opacity-40" />
            <p className="text-xs">All caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/30 last:border-0 group"
            >
              <span className="mt-0.5 flex-shrink-0">{iconMap[n.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {n.message}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.timestamp)}</p>
              </div>
              <button
                onClick={(e) => handleDismiss(e, n.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 transition-opacity p-0.5 -mr-0.5"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <button
          onClick={() => { markAllRead(); onClose(); }}
          className="w-full py-2.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-t border-slate-100 dark:border-slate-800 transition-colors flex items-center justify-center gap-1.5"
        >
          <CheckCheck size={14} />
          Mark all as read
        </button>
      )}
    </div>
  );
}
