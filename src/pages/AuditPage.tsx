import { useState, useMemo } from 'react';
import { Search, Clock, Trash2 } from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { cn } from '../lib/cn';
import { fmtDate } from '../lib/formatters';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950',
  LOGOUT: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
  SALE_COMPLETED: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950',
  PRODUCT_ADDED: 'text-brand bg-indigo-50 dark:bg-indigo-950',
  PRODUCT_EDITED: 'text-brand bg-indigo-50 dark:bg-indigo-950',
  PRODUCT_DELETED: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
  TRANSACTION_VOIDED: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
  CUSTOMER_ADDED: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950',
  CUSTOMER_EDITED: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950',
  CUSTOMER_DELETED: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
  POINTS_ADJUSTED: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950',
  REWARDS_CONFIG_UPDATED: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950',
};

function getActionColor(action: string): string {
  // Use substring matching for actions that might have prefixes
  const exact = ACTION_COLORS[action];
  if (exact) return exact;
  const key = Object.keys(ACTION_COLORS).find((k) => action.startsWith(k));
  return key ? ACTION_COLORS[key] : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';
}

export default function AuditPage() {
  const auditLog = useDataStore((s) => s.auditLog);
  const clearAuditLog = useDataStore((s) => s.clearAuditLog);
  const logAudit = useDataStore((s) => s.logAudit);
  const currentUser = useAuthStore((s) => s.currentUser);
  const showToast = useUIStore((s) => s.showToast);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [clearOpen, setClearOpen] = useState(false);

  const actions = useMemo(() => {
    const set = new Set(auditLog.map((e) => e.action));
    return ['all', ...Array.from(set)] as string[];
  }, [auditLog]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return auditLog.filter((entry) => {
      const matchQ = !q || entry.action.toLowerCase().includes(q) || entry.user.toLowerCase().includes(q) || entry.details.toLowerCase().includes(q);
      const matchAction = actionFilter === 'all' || entry.action === actionFilter;
      return matchQ && matchAction;
    });
  }, [auditLog, search, actionFilter]);

  function handleClear() {
    clearAuditLog();
    logAudit('AUDIT_CLEARED', 'Audit log was cleared', currentUser?.name, currentUser?.role);
    showToast('Audit log cleared', 'info');
    setClearOpen(false);
  }

  return (
    <div className="animate-[fadeUp_0.25s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Audit Trail</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">System activity log</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setClearOpen(true)} disabled={auditLog.length === 0}>
          <Trash2 size={13} /> Clear Log
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, user, or details…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          {actions.slice(0, 15).map((a) => (
            <option key={a} value={a}>
              {a === 'all' ? 'All Actions' : a.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Log count */}
      <div className="text-xs text-slate-400 mb-4">
        Showing {filtered.length} of {auditLog.length} entries
      </div>

      {/* Audit entries */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Clock size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No audit entries found</p>
          <p className="text-xs mt-1">
            {auditLog.length === 0 ? 'Audit log is empty. Actions will appear here as they happen.' : 'Try a different search or filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-4 px-5 py-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
            >
              {/* Timestamp */}
              <div className="flex-shrink-0 w-24 text-right">
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  {fmtDate(entry.timestamp)}
                </div>
              </div>

              {/* Action badge */}
              <div className="flex-shrink-0">
                <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap', getActionColor(entry.action))}>
                  {entry.action.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-300">{entry.details}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {entry.user} ({entry.role})
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear confirmation */}
      <Dialog open={clearOpen} onOpenChange={(o) => { if (!o) setClearOpen(false); }} title="">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-red-bg flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Clear Audit Log?</h3>
          <p className="text-sm text-slate-500">
            This will permanently remove all {auditLog.length} audit entries.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="secondary" onClick={() => setClearOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleClear}>Clear All</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
