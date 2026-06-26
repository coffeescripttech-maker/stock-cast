import { useState, useMemo, useEffect } from 'react';
import { Search, Clock, Trash2, Activity, Users, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [search, actionFilter]);

  // Compute stats
  const uniqueUsers = useMemo(() => new Set(auditLog.map((e) => e.user)).size, [auditLog]);
  const todayEntries = useMemo(() => {
    const today = new Date().toDateString();
    return auditLog.filter((e) => new Date(e.timestamp).toDateString() === today).length;
  }, [auditLog]);

  function handleClear() {
    clearAuditLog();
    logAudit('AUDIT_CLEARED', 'Audit log was cleared', currentUser?.name, currentUser?.role);
    showToast('Audit log cleared', 'info');
    setClearOpen(false);
  }

  return (
    <div className="animate-[fadeUp_0.25s_ease] space-y-6 max-w-[1600px] mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Audit Trail</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">System activity log · {auditLog.length} entries</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setClearOpen(true)} disabled={auditLog.length === 0}>
          <Trash2 size={13} /> Clear Log
        </Button>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-brand to-brand-dark text-white p-6 shadow-lg shadow-brand/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Total Entries</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Activity size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{auditLog.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Recorded system events</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Today</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Clock size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{todayEntries}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Events recorded today</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-sky-500 to-sky-700 text-white p-6 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Unique Users</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Users size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{uniqueUsers}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Distinct users tracked</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-amber-400 to-amber-600 text-white p-6 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Action Types</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <AlertTriangle size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{actions.length - 1}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Unique action categories</div>
          </div>
        </div>
      </div>

      {/* ═══ ENTRIES CARD ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by action, user, or details…"
                className="w-full pl-9 pr-3 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:bg-slate-800 transition-all"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:bg-slate-800 transition-all cursor-pointer"
            >
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a === 'all' ? 'All Actions' : a.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Entry list */}
        {paginated.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Clock size={36} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-sm">No audit entries found</p>
            <p className="text-xs mt-1">
              {auditLog.length === 0 ? 'Audit log is empty. Actions will appear here as they happen.' : 'Try a different search or filter'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginated.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                {/* Timestamp */}
                <div className="flex-shrink-0 w-[76px] text-right pt-0.5">
                  <div className="text-[10px] text-slate-400 font-mono leading-tight">
                    {fmtDate(entry.timestamp)}
                  </div>
                </div>

                {/* Action badge */}
                <div className="flex-shrink-0 pt-0.5">
                  <span className={cn('text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap', getActionColor(entry.action))}>
                    {entry.action.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{entry.details}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <span className="font-medium text-slate-500 dark:text-slate-400">{entry.user}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span>{entry.role}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                {filtered.length} of {auditLog.length} entries
              </span>
              <span className="text-[11px] text-slate-300 dark:text-slate-600">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-brand cursor-pointer"
                >
                  {[25, 50, 100].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                Page {page} of {totalPages}
              </span>
              <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700/50">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={cn(
                    'px-3 py-1.5 text-[11px] font-bold transition-colors',
                    page <= 1
                      ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 text-slate-600 hover:text-brand hover:bg-brand/5 dark:hover:bg-slate-700'
                  )}
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="w-px bg-slate-200 dark:border-slate-700/50" />
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={cn(
                    'px-3 py-1.5 text-[11px] font-bold transition-colors',
                    page >= totalPages
                      ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 text-slate-600 hover:text-brand hover:bg-brand/5 dark:hover:bg-slate-700'
                  )}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear confirmation */}
      <Dialog open={clearOpen} onOpenChange={(o) => { if (!o) setClearOpen(false); }} title="">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-4">
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
