import { useState, useMemo, useEffect } from 'react';
import {
  Search, Receipt, XCircle, TrendingUp, DollarSign, ShoppingBag, Activity,
  ChevronLeft, ChevronRight, User, CalendarDays, Ban,
} from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { TypeBadge } from '../components/ui/Badge';
import { cn } from '../lib/cn';
import { fmtDate, fmtCurrency } from '../lib/formatters';
import type { Transaction, TxType } from '../types/transaction';

/* ─── Stats calculation ─── */
function computeTxStats(transactions: Transaction[]) {
  const completed = transactions.filter((tx) => tx.status === 'completed');
  const totalRevenue = completed.reduce((s, tx) => s + tx.total, 0);
  const voided = transactions.filter((tx) => tx.status === 'voided').length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = completed
    .filter((tx) => tx.date.slice(0, 10) === todayStr)
    .reduce((s, tx) => s + tx.total, 0);
  const todayCount = completed.filter((tx) => tx.date.slice(0, 10) === todayStr).length;
  const avgTx = completed.length > 0 ? totalRevenue / completed.length : 0;
  const voidRate = transactions.length > 0 ? (voided / transactions.length) * 100 : 0;
  return { totalRevenue, voided, todaySales, todayCount, avgTx, voidRate, totalTx: transactions.length };
}

export default function TransactionsPage() {
  const transactions = useDataStore((s) => s.transactions);
  const voidTransaction = useDataStore((s) => s.voidTransaction);
  const logAudit = useDataStore((s) => s.logAudit);
  const currentUser = useAuthStore((s) => s.currentUser);
  const showToast = useUIStore((s) => s.showToast);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TxType>('all');
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [voidTx, setVoidTx] = useState<Transaction | null>(null);

  /* Pagination state */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const stats = useMemo(() => computeTxStats(transactions), [transactions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return transactions.filter((tx) => {
      const matchQ = !q || tx.id.toLowerCase().includes(q) || tx.cashier.toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      return matchQ && matchType;
    });
  }, [transactions, search, typeFilter]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  /* Reset page on filter change */
  useEffect(() => { setPage(1); }, [search, typeFilter]);

  function handleVoid(tx: Transaction) {
    voidTransaction(tx.id);
    logAudit('TRANSACTION_VOIDED', `Voided TX ${tx.id} · ₱${fmtCurrency(tx.total)}`, currentUser?.name, currentUser?.role);
    showToast(`Transaction ${tx.id} voided`, 'error');
    setVoidTx(null);
    setDetailTx(null);
  }

  return (
    <div className="animate-[fadeUp_0.25s_ease] space-y-6 max-w-[1600px] mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Transactions</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {stats.totalTx} total · ₱{Math.round(stats.totalRevenue).toLocaleString()} all-time revenue
          </p>
        </div>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Sales */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-brand to-brand-dark text-white p-6 shadow-lg shadow-brand/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Today's Sales</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <TrendingUp size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">₱{fmtCurrency(stats.todaySales)}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">
              <ShoppingBag size={12} /> {stats.todayCount} transaction{stats.todayCount !== 1 && 's'} today
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Total Revenue</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <DollarSign size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">₱{Math.round(stats.totalRevenue).toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">All completed transactions</div>
          </div>
        </div>

        {/* Avg Transaction */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-sky-400 to-sky-600 text-white p-6 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Avg Transaction</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Activity size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">₱{fmtCurrency(stats.avgTx)}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Per completed sale</div>
          </div>
        </div>

        {/* Void Rate */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-orange-400 to-orange-600 text-white p-6 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Void Rate</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Ban size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{stats.voidRate.toFixed(1)}%</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">{stats.voided} voided transaction{stats.voided !== 1 && 's'}</div>
          </div>
        </div>
      </div>

      {/* ═══ TRANSACTIONS CARD ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by transaction ID or cashier…"
                className="w-full pl-9 pr-3 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:bg-slate-800 transition-all"
              />
            </div>

            {/* Type filter chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {(['all', 'rt', 'ws', 'mixed'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTypeFilter(t); setPage(1); }}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 text-[13px] font-bold rounded-xl transition-all whitespace-nowrap',
                    typeFilter === t
                      ? 'bg-brand text-white shadow-sm shadow-brand/20'
                      : 'text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 hover:border-brand hover:text-brand'
                  )}
                >
                  {t === 'all' ? 'All' : t === 'rt' ? 'Retail' : t === 'ws' ? 'Wholesale' : 'Mixed'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction List */}
        {paginated.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Receipt size={36} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-sm">No transactions found</p>
            <p className="text-xs mt-1">
              {search ? 'Try a different search or filter' : 'No transactions recorded yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {paginated.map((tx) => (
              <button
                key={tx.id}
                onClick={() => setDetailTx(tx)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors text-left group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors',
                    tx.status === 'voided'
                      ? 'bg-red-50 dark:bg-red-950/50'
                      : 'bg-slate-100 dark:bg-slate-800'
                  )}>
                    <Receipt size={16} className={tx.status === 'voided' ? 'text-red-400' : 'text-slate-400'} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
                        {tx.id}
                      </span>
                      <TypeBadge type={tx.type} />
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        tx.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                      )}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
                      <span>{fmtDate(tx.date)}</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="flex items-center gap-1">
                        <User size={10} /> {tx.cashier}
                      </span>
                      {tx.customerName && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span>{tx.customerName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <div className="text-right">
                    <div className={cn(
                      'text-base font-black font-mono',
                      tx.status === 'voided' ? 'text-slate-300 dark:text-slate-600 line-through' : 'text-slate-900 dark:text-slate-100'
                    )}>
                      ₱{fmtCurrency(tx.total)}
                    </div>
                    {tx.items.length > 0 && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {tx.items.reduce((s, i) => s + i.qty, 0)} item{tx.items.reduce((s, i) => s + i.qty, 0) !== 1 && 's'}
                      </div>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {sorted.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                {sorted.length} transaction{sorted.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-slate-300 dark:text-slate-600">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-brand cursor-pointer"
                >
                  {[10, 25, 50, 100].map((s) => (
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
                <div className="w-px bg-slate-200 dark:bg-slate-700/50" />
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

      {/* ═══ DETAIL MODAL ═══ */}
      <Dialog
        open={!!detailTx}
        onOpenChange={(o) => { if (!o) setDetailTx(null); }}
        title="Transaction Details"
        subtitle={detailTx?.id}
        className="w-[520px]"
      >
        {detailTx && (
          <div className="space-y-5">
            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-[16px] bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                  <CalendarDays size={11} /> DATE
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{fmtDate(detailTx.date)}</div>
              </div>
              <div className="p-3.5 rounded-[16px] bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                  <User size={11} /> CASHIER
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{detailTx.cashier}</div>
              </div>
              <div className="p-3.5 rounded-[16px] bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                  <ShoppingBag size={11} /> TYPE
                </div>
                <div className="mt-1"><TypeBadge type={detailTx.type} /></div>
              </div>
              <div className="p-3.5 rounded-[16px] bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                  <Activity size={11} /> STATUS
                </div>
                <span className={cn(
                  'inline-block mt-1 text-[11px] font-bold px-2.5 py-1 rounded-full',
                  detailTx.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                )}>
                  {detailTx.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Customer */}
            {detailTx.customerName && (
              <div className="p-3.5 rounded-[16px] bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2">
                <User size={14} className="text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Customer:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{detailTx.customerName}</span>
                  {detailTx.pointsEarned && detailTx.pointsEarned > 0 && (
                    <span className="ml-2 text-[10px] text-brand font-mono">★ +{detailTx.pointsEarned} pts</span>
                  )}
                </span>
              </div>
            )}

            {/* Items */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Items ({detailTx.items.length})</h4>
              <div className="space-y-1.5">
                {detailTx.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3.5 py-2.5 rounded-[14px] bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                      <span className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded',
                        item.type === 'rt' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      )}>
                        {item.type.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-3">
                      {item.qty} × ₱{fmtCurrency(item.price)}
                      <span className="ml-2 font-bold text-slate-800 dark:text-slate-200">₱{fmtCurrency(item.qty * item.price)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">₱{fmtCurrency(detailTx.rawTotal)}</span>
              </div>
              {detailTx.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">Points discount</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">-₱{fmtCurrency(detailTx.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <span className="text-slate-900 dark:text-slate-100">Total</span>
                <span className="text-brand">₱{fmtCurrency(detailTx.total)}</span>
              </div>
              {detailTx.amountTendered > 0 && (
                <>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Cash Tendered</span>
                    <span>₱{fmtCurrency(detailTx.amountTendered)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Change</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">₱{fmtCurrency(detailTx.change)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Points earned indicator */}
            {detailTx.pointsEarned && detailTx.pointsEarned > 0 && !detailTx.customerName && (
              <div className="text-[11px] text-brand font-mono text-center pt-2">
                ★ +{detailTx.pointsEarned} points earned
              </div>
            )}

            {/* Actions */}
            {detailTx.status === 'completed' && (
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <Button variant="danger" size="sm" onClick={() => setVoidTx(detailTx)}>
                  <XCircle size={13} /> Void Transaction
                </Button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* ═══ VOID CONFIRMATION ═══ */}
      <Dialog
        open={!!voidTx}
        onOpenChange={(o) => { if (!o) setVoidTx(null); }}
        title=""
      >
        {voidTx && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Void Transaction?</h3>
            <p className="text-sm text-slate-500">
              Void transaction <strong>{voidTx.id}</strong>?<br />
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="secondary" onClick={() => setVoidTx(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleVoid(voidTx)}>Void Transaction</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
