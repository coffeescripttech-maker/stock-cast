import { useState, useMemo } from 'react';
import { Search, Receipt, XCircle } from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { TypeBadge } from '../components/ui/Badge';
import { cn } from '../lib/cn';
import { fmtDate, fmtCurrency } from '../lib/formatters';
import type { Transaction } from '../types/transaction';

export default function TransactionsPage() {
  const transactions = useDataStore((s) => s.transactions);
  const voidTransaction = useDataStore((s) => s.voidTransaction);
  const logAudit = useDataStore((s) => s.logAudit);
  const currentUser = useAuthStore((s) => s.currentUser);
  const showToast = useUIStore((s) => s.showToast);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'rt' | 'ws' | 'mixed'>('all');
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [voidTx, setVoidTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter((tx) => {
      const matchQ = !q || tx.id.toLowerCase().includes(q) || tx.cashier.toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      return matchQ && matchType;
    });
  }, [transactions, search, typeFilter]);

  // Sort by date descending
  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filtered]
  );

  function handleVoid(tx: Transaction) {
    voidTransaction(tx.id);
    logAudit('TRANSACTION_VOIDED', `Voided TX ${tx.id} · ₱${fmtCurrency(tx.total)}`, currentUser?.name, currentUser?.role);
    showToast(`Transaction ${tx.id} voided`, 'error');
    setVoidTx(null);
    setDetailTx(null);
  }

  return (
    <div className="animate-[fadeUp_0.25s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Transactions</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">View and manage sales transactions</p>
        </div>
        <div className="text-xs text-slate-400">{transactions.length} total transactions</div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by transaction ID or cashier…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'rt', 'ws', 'mixed'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                typeFilter === t
                  ? 'bg-brand text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-600 hover:border-brand'
              )}
            >
              {t === 'all' ? 'All' : t === 'rt' ? 'Retail' : t === 'ws' ? 'Wholesale' : 'Mixed'}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Receipt size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No transactions found</p>
          <p className="text-xs mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((tx) => (
            <button
              key={tx.id}
              onClick={() => setDetailTx(tx)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-brand/30 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Receipt size={16} className="text-slate-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {tx.id} — ₱{fmtCurrency(tx.total)}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {fmtDate(tx.date)} · {tx.cashier}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <TypeBadge type={tx.type} />
                <span className={cn(
                  'text-[11px] font-semibold px-2.5 py-0.5 rounded-full',
                  tx.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                )}>
                  {tx.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog
        open={!!detailTx}
        onOpenChange={(o) => { if (!o) setDetailTx(null); }}
        title="Transaction Details"
        subtitle={detailTx?.id}
        className="w-[480px]"
      >
        {detailTx && (
          <div className="space-y-4">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">DATE</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{fmtDate(detailTx.date)}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">CASHIER</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{detailTx.cashier}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">TYPE</div>
                <div className="mt-0.5"><TypeBadge type={detailTx.type} /></div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">STATUS</div>
                <span className={cn(
                  'inline-block mt-0.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full',
                  detailTx.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                )}>
                  {detailTx.status.toUpperCase()}
                </span>
              </div>
            </div>

            {detailTx.customerName && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-xs">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Customer:</span> {detailTx.customerName}
              </div>
            )}

            {/* Items */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 mb-2">Items</h4>
              <div className="space-y-1.5">
                {detailTx.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {item.name}{' '}
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded ml-1',
                        item.type === 'rt' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      )}>
                        {item.type.toUpperCase()}
                      </span>
                    </span>
                    <span className="text-slate-500">
                      {item.qty} × ₱{fmtCurrency(item.price)}
                      <span className="ml-3 font-semibold text-slate-800 dark:text-slate-200">₱{fmtCurrency(item.qty * item.price)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold">₱{fmtCurrency(detailTx.rawTotal)}</span>
              </div>
              {detailTx.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Points discount</span>
                  <span className="font-semibold text-emerald-600">-₱{fmtCurrency(detailTx.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1">
                <span>Total</span>
                <span>₱{fmtCurrency(detailTx.total)}</span>
              </div>
              {detailTx.amountTendered != null && (
                <>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Cash Tendered</span>
                    <span>₱{fmtCurrency(detailTx.amountTendered)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Change</span>
                    <span className="font-semibold text-emerald-600">₱{fmtCurrency(detailTx.change)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Points earned */}
            {detailTx.pointsEarned && detailTx.pointsEarned > 0 && (
              <div className="text-xs text-brand font-mono text-center">
                ★ +{detailTx.pointsEarned} points earned{detailTx.customerName ? ` for ${detailTx.customerName}` : ''}
              </div>
            )}

            {/* Actions */}
            {detailTx.status === 'completed' && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="danger" size="sm" onClick={() => setVoidTx(detailTx)}>
                  <XCircle size={13} /> Void Transaction
                </Button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Void Confirmation */}
      <Dialog
        open={!!voidTx}
        onOpenChange={(o) => { if (!o) setVoidTx(null); }}
        title=""
      >
        {voidTx && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-red-bg flex items-center justify-center mx-auto mb-4">
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
