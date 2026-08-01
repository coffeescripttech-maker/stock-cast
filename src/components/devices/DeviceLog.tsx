import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

/**
 * Shared building blocks for the Device Test page.
 *
 * - `useDeviceLog`   — small log-line state manager (time-stamped entries)
 * - `<DeviceLog />`  — dark monospace "console" that renders those lines
 * - `<DeviceStatusBadge />` — colored status chip (idle/connecting/…/error)
 * - `<DeviceCard />` — consistent card shell (header w/ icon tile + badge,
 *   body, optional footer buttons) reused by all three device tests
 */

export type DeviceStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'connected'
  | 'ok'
  | 'error';

export type LogLevel = 'info' | 'success' | 'error' | 'data';

export interface LogEntry {
  id: string;
  time: string;
  level: LogLevel;
  message: string;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: 'text-slate-400',
  success: 'text-emerald-400',
  error: 'text-red-400',
  data: 'text-sky-300',
};

const STATUS_STYLES: Record<DeviceStatus, { chip: string; dot: string }> = {
  idle: {
    chip: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
  connecting: {
    chip: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
    dot: 'bg-sky-500 animate-pulse',
  },
  listening: {
    chip: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
    dot: 'bg-sky-500 animate-pulse',
  },
  connected: {
    chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  ok: {
    chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  error: {
    chip: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    dot: 'bg-red-500',
  },
};

// ---------------------------------------------------------------------------
// useDeviceLog
// ---------------------------------------------------------------------------

function nowTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export function useDeviceLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const addLog = useCallback((level: LogLevel, message: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    setEntries((prev) => [...prev, { id, time: nowTime(), level, message }].slice(-200));
  }, []);

  const clearLog = useCallback(() => setEntries([]), []);

  return { entries, addLog, clearLog };
}

// ---------------------------------------------------------------------------
// DeviceLog
// ---------------------------------------------------------------------------

interface DeviceLogProps {
  entries: LogEntry[];
  placeholder?: string;
  className?: string;
}

export function DeviceLog({ entries, placeholder = '— no activity yet —', className }: DeviceLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'bg-slate-950 rounded-xl border border-slate-800 p-3 h-40 overflow-y-auto',
        'font-mono text-[11px] leading-relaxed space-y-1',
        className
      )}
    >
      {entries.length === 0 ? (
        <p className="text-slate-600">{placeholder}</p>
      ) : (
        entries.map((e) => (
          <div key={e.id} className="flex items-start gap-2">
            <span className="text-slate-600 flex-shrink-0">{e.time}</span>
            <span className={cn('break-all', LEVEL_COLORS[e.level])}>{e.message}</span>
          </div>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeviceStatusBadge
// ---------------------------------------------------------------------------

interface DeviceStatusBadgeProps {
  status: DeviceStatus;
  label: string;
}

export function DeviceStatusBadge({ status, label }: DeviceStatusBadgeProps) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
        s.chip
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// DeviceCard
// ---------------------------------------------------------------------------

interface DeviceCardProps {
  icon: React.ReactNode;
  iconClass: string; // colored tile classes, e.g. "bg-brand/10 text-brand"
  title: string;
  subtitle: string;
  status: DeviceStatus;
  statusLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function DeviceCard({
  icon,
  iconClass,
  title,
  subtitle,
  status,
  statusLabel,
  children,
  footer,
  className,
}: DeviceCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800',
        'shadow-sm overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', iconClass)}>
              {icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{title}</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{subtitle}</p>
            </div>
          </div>
          <DeviceStatusBadge status={status} label={statusLabel} />
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 space-y-4">{children}</div>

      {/* Footer actions */}
      {footer && (
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          {footer}
        </div>
      )}
    </div>
  );
}
