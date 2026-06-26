import { useState, useMemo, useEffect } from 'react';
import { BarChart3, Package, Download, TrendingUp, ShoppingCart, DollarSign, Layers, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { useDataStore } from '../stores/dataStore';
import { useReportStore } from '../stores/reportStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';
import { fmtCurrency, fmtDate } from '../lib/formatters';

export default function ReportsPage() {
  const transactions = useDataStore((s) => s.transactions);
  const products = useDataStore((s) => s.products);
  const reportTab = useReportStore((s) => s.reportTab);
  const setReportTab = useReportStore((s) => s.setReportTab);
  const reportFilter = useReportStore((s) => s.reportFilter);
  const setReportFilter = useReportStore((s) => s.setReportFilter);
  const theme = useUIStore((s) => s.theme);
  const showToast = useUIStore((s) => s.showToast);

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#64748b' : '#94a3b8';

  /* ── Transaction table state ── */
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(15);
  const txSortFields = ['date', 'id', 'cashier', 'type', 'items', 'total'] as const;
  type TxSortField = (typeof txSortFields)[number];
  const [txSortBy, setTxSortBy] = useState<TxSortField>('date');
  const [txSortDir, setTxSortDir] = useState<'asc' | 'desc'>('desc');

  /* ── Inventory table state ── */
  const [invSearch, setInvSearch] = useState('');
  const [invPage, setInvPage] = useState(1);
  const [invPageSize, setInvPageSize] = useState(15);
  const invSortFields = ['name', 'rtStock', 'wsStock', 'rtValue', 'wsValue', 'totalValue'] as const;
  type InvSortField = (typeof invSortFields)[number];
  const [invSortBy, setInvSortBy] = useState<InvSortField>('name');
  const [invSortDir, setInvSortDir] = useState<'asc' | 'desc'>('asc');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      if (reportFilter === 'all') return true;
      if (reportFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(tx.date) >= weekAgo;
      }
      if (reportFilter === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(tx.date) >= monthAgo;
      }
      return true;
    });
  }, [transactions, reportFilter]);

  const totalSales = filteredTransactions.reduce((s, t) => s + t.total, 0);
  const totalTx = filteredTransactions.length;
  const avgTx = totalTx > 0 ? totalSales / totalTx : 0;

  const rtSales = filteredTransactions
    .filter((tx) => tx.type === 'rt')
    .reduce((s, t) => s + t.total, 0);
  const wsSales = filteredTransactions
    .filter((tx) => tx.type === 'ws')
    .reduce((s, t) => s + t.total, 0);
  const mixedSales = filteredTransactions
    .filter((tx) => tx.type === 'mixed')
    .reduce((s, t) => s + t.total, 0);

  // Daily chart data for transactions
  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions.forEach((tx) => {
      const day = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map.set(day, (map.get(day) || 0) + tx.total);
    });
    return Array.from(map.entries())
      .map(([day, sales]) => ({ day, sales }))
      .sort((a, b) => {
        const da = new Date(a.day).getTime();
        const db = new Date(b.day).getTime();
        return da - db;
      });
  }, [filteredTransactions]);

  const pieData = [
    { name: 'Retail', value: rtSales, color: '#10b981' },
    { name: 'Wholesale', value: wsSales, color: '#f59e0b' },
    { name: 'Mixed', value: mixedSales, color: '#8b5cf6' },
  ].filter((d) => d.value > 0);

  // Inventory report data
  const invTotalValue = products.reduce((s, p) => s + p.retailStock * p.retailPrice + p.wholesaleStock * p.wholesalePrice, 0);
  const invRTValue = products.reduce((s, p) => s + p.retailStock * p.retailPrice, 0);
  const invWSValue = products.reduce((s, p) => s + p.wholesaleStock * p.wholesalePrice, 0);

  /* ── Transaction table computed ── */
  const txFiltered = useMemo(() => {
    const q = txSearch.toLowerCase().trim();
    let list = filteredTransactions;
    if (q) {
      list = list.filter((tx) =>
        tx.cashier.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q) ||
        fmtDate(tx.date).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const mul = txSortDir === 'asc' ? 1 : -1;
      if (txSortBy === 'date') return mul * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (txSortBy === 'id') return mul * a.id.localeCompare(b.id);
      if (txSortBy === 'cashier') return mul * a.cashier.localeCompare(b.cashier);
      if (txSortBy === 'type') return mul * a.type.localeCompare(b.type);
      if (txSortBy === 'items') {
        const aItems = a.items.reduce((s, i) => s + i.qty, 0);
        const bItems = b.items.reduce((s, i) => s + i.qty, 0);
        return mul * (aItems - bItems);
      }
      return mul * (a.total - b.total);
    });
    return list;
  }, [filteredTransactions, txSearch, txSortBy, txSortDir]);

  const txTotalPages = Math.max(1, Math.ceil(txFiltered.length / txPageSize));
  const txPaginated = useMemo(() => {
    const start = (txPage - 1) * txPageSize;
    return txFiltered.slice(start, start + txPageSize);
  }, [txFiltered, txPage, txPageSize]);

  useEffect(() => { setTxPage(1); }, [txSearch, txSortBy, txSortDir]);

  function toggleTxSort(field: TxSortField) {
    if (txSortBy === field) setTxSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setTxSortBy(field); setTxSortDir('asc'); }
  }

  /* ── Inventory table computed ── */
  const invFiltered = useMemo(() => {
    const q = invSearch.toLowerCase().trim();
    let list = products;
    if (q) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.retailBarcode.toLowerCase().includes(q) ||
        p.wholesaleBarcode.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const mul = invSortDir === 'asc' ? 1 : -1;
      if (invSortBy === 'name') return mul * a.name.localeCompare(b.name);
      if (invSortBy === 'rtStock') return mul * (a.retailStock - b.retailStock);
      if (invSortBy === 'wsStock') return mul * (a.wholesaleStock - b.wholesaleStock);
      if (invSortBy === 'rtValue') return mul * ((a.retailStock * a.retailPrice) - (b.retailStock * b.retailPrice));
      if (invSortBy === 'wsValue') return mul * ((a.wholesaleStock * a.wholesalePrice) - (b.wholesaleStock * b.wholesalePrice));
      return mul * ((a.retailStock * a.retailPrice + a.wholesaleStock * a.wholesalePrice) - (b.retailStock * b.retailPrice + b.wholesaleStock * b.wholesalePrice));
    });
    return list;
  }, [products, invSearch, invSortBy, invSortDir]);

  const invTotalPages = Math.max(1, Math.ceil(invFiltered.length / invPageSize));
  const invPaginated = useMemo(() => {
    const start = (invPage - 1) * invPageSize;
    return invFiltered.slice(start, start + invPageSize);
  }, [invFiltered, invPage, invPageSize]);

  useEffect(() => { setInvPage(1); }, [invSearch, invSortBy, invSortDir]);

  function toggleInvSort(field: InvSortField) {
    if (invSortBy === field) setInvSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setInvSortBy(field); setInvSortDir('asc'); }
  }

  function exportExcel() {
    let csv = '';
    if (reportTab === 'transactions') {
      csv = 'ID,Date,Cashier,Type,Items,Subtotal,Discount,Total,Tendered,Change,Status\n';
      filteredTransactions.forEach((tx) => {
        const itemCount = tx.items.reduce((s, i) => s + i.qty, 0);
        csv += `${tx.id},"${fmtDate(tx.date)}","${tx.cashier}",${tx.type},${itemCount},${tx.rawTotal},${tx.discount},${tx.total},${tx.amountTendered},${tx.change},${tx.status}\n`;
      });
    } else {
      csv = 'Product,Category,RT Barcode,WS Barcode,RT Price,WS Price,RT Stock,WS Stock\n';
      products.forEach((p) => {
        csv += `"${p.name}","${p.category}","${p.retailBarcode}","${p.wholesaleBarcode}",${p.retailPrice},${p.wholesalePrice},${p.retailStock},${p.wholesaleStock}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = reportTab === 'transactions' ? 'transactions.csv' : 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report exported as CSV', 'success');
  }

  return (
    <div className="animate-[fadeUp_0.25s_ease] space-y-6 max-w-[1600px] mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Reports</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Analyze sales and inventory data</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <Download size={13} /> Export CSV
        </Button>
      </div>

      {/* ═══ TAB SWITCHER ═══ */}
      <div className="flex gap-1.5">
        {[
          { key: 'transactions' as const, label: 'Transaction Report', icon: BarChart3 },
          { key: 'inventory' as const, label: 'Inventory Report', icon: Package },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setReportTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold rounded-xl transition-all',
              reportTab === tab.key
                ? 'bg-brand text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-600 hover:border-brand hover:text-brand'
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {reportTab === 'transactions' ? (
        /* ============================================= */
        /* ============ TRANSACTION REPORT ============= */
        /* ============================================= */
        <div className="space-y-6">

          {/* Filter chips */}
          <div className="flex gap-1.5">
            {(['week', 'month', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setReportFilter(f)}
                className={cn(
                  'px-4 py-2 text-[12px] font-bold rounded-xl transition-all',
                  reportFilter === f
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-600 hover:border-brand hover:text-brand'
                )}
              >
                {f === 'week' ? 'Past Week' : f === 'month' ? 'Past Month' : 'All Time'}
              </button>
            ))}
          </div>

          {/* ═══ KPI CARDS ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-brand to-brand-dark text-white p-6 shadow-lg shadow-brand/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Total Sales</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <DollarSign size={18} className="text-white" />
                  </div>
                </div>
                <div className="text-3xl font-black font-mono tracking-tight">₱{fmtCurrency(totalSales)}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">
                  <TrendingUp size={12} /> {reportFilter === 'all' ? 'All time' : `Filtered (${reportFilter})`}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Transactions</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <ShoppingCart size={18} className="text-white" />
                  </div>
                </div>
                <div className="text-3xl font-black font-mono tracking-tight">{totalTx}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Total completed sales</div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-sky-500 to-sky-700 text-white p-6 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Avg per Transaction</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <Layers size={18} className="text-white" />
                  </div>
                </div>
                <div className="text-3xl font-black font-mono tracking-tight">₱{fmtCurrency(avgTx)}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Average order value</div>
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Daily Sales</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        border: `1px solid ${gridColor}`,
                        borderRadius: '12px',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [`₱${fmtCurrency(value)}`, 'Sales']}
                    />
                    <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie chart */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Sales by Type</h3>
              <div className="h-64 flex flex-col items-center justify-center">
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`₱${fmtCurrency(value)}`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2 text-xs">
                      {pieData.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-slate-500">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">No data for this period</p>
                )}
              </div>
            </div>
          </div>

          {/* Transaction table */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-5 pb-0 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Search by cashier, ID, type…"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:bg-slate-800 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={txSortBy}
                  onChange={(e) => { setTxSortBy(e.target.value as TxSortField); setTxSortDir('desc'); }}
                  className="text-[11px] font-semibold px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-brand cursor-pointer"
                >
                  {txSortFields.map((f) => (
                    <option key={f} value={f}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setTxSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-400 hover:text-brand transition-colors"
                  title={txSortDir === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <ArrowUpDown size={13} className={cn('transition-transform', txSortDir === 'desc' && 'rotate-180')} />
                </button>
              </div>
            </div>
            <div className="p-5">
              {txFiltered.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No transactions found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-semibold">
                        <th className="text-left px-3 py-2">
                          <button onClick={() => toggleTxSort('id')} className={cn('flex items-center gap-1 hover:text-slate-700 transition-colors', txSortBy === 'id' && 'text-brand')}>
                            ID <ArrowUpDown size={10} className={cn('transition-transform', txSortBy === 'id' && txSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                        <th className="text-left px-3 py-2">
                          <button onClick={() => toggleTxSort('date')} className={cn('flex items-center gap-1 hover:text-slate-700 transition-colors', txSortBy === 'date' && 'text-brand')}>
                            Date <ArrowUpDown size={10} className={cn('transition-transform', txSortBy === 'date' && txSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                        <th className="text-left px-3 py-2">
                          <button onClick={() => toggleTxSort('cashier')} className={cn('flex items-center gap-1 hover:text-slate-700 transition-colors', txSortBy === 'cashier' && 'text-brand')}>
                            Cashier <ArrowUpDown size={10} className={cn('transition-transform', txSortBy === 'cashier' && txSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                        <th className="text-center px-3 py-2">
                          <button onClick={() => toggleTxSort('type')} className={cn('flex items-center gap-1 justify-center hover:text-slate-700 transition-colors', txSortBy === 'type' && 'text-brand')}>
                            Type <ArrowUpDown size={10} className={cn('transition-transform', txSortBy === 'type' && txSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                        <th className="text-center px-3 py-2">
                          <button onClick={() => toggleTxSort('items')} className={cn('flex items-center gap-1 justify-center hover:text-slate-700 transition-colors', txSortBy === 'items' && 'text-brand')}>
                            Items <ArrowUpDown size={10} className={cn('transition-transform', txSortBy === 'items' && txSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                        <th className="text-right px-3 py-2">
                          <button onClick={() => toggleTxSort('total')} className={cn('flex items-center gap-1 justify-end hover:text-slate-700 transition-colors', txSortBy === 'total' && 'text-brand')}>
                            Total <ArrowUpDown size={10} className={cn('transition-transform', txSortBy === 'total' && txSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {txPaginated.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{tx.id}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-500">{fmtDate(tx.date)}</td>
                          <td className="px-3 py-2.5 text-sm">{tx.cashier}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full',
                              tx.type === 'rt' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                              tx.type === 'ws' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                              'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                            )}>{tx.type.toUpperCase()}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-500">{tx.items.reduce((s, i) => s + i.qty, 0)}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-800 dark:text-slate-200">₱{fmtCurrency(tx.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {txFiltered.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {txFiltered.length} transaction{txFiltered.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-slate-300 dark:text-slate-600">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Show</span>
                    <select
                      value={txPageSize}
                      onChange={(e) => { setTxPageSize(Number(e.target.value)); setTxPage(1); }}
                      className="text-[10px] font-semibold px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-brand cursor-pointer"
                    >
                      {[15, 30, 50].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Page {txPage} of {txTotalPages}
                  </span>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700/50">
                    <button
                      onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                      disabled={txPage <= 1}
                      className={cn(
                        'px-2.5 py-1.5 text-[10px] font-bold transition-colors',
                        txPage <= 1
                          ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 text-slate-600 hover:text-brand hover:bg-brand/5 dark:hover:bg-slate-700'
                      )}
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <div className="w-px bg-slate-200 dark:border-slate-700/50" />
                    <button
                      onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                      disabled={txPage >= txTotalPages}
                      className={cn(
                        'px-2.5 py-1.5 text-[10px] font-bold transition-colors',
                        txPage >= txTotalPages
                          ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 text-slate-600 hover:text-brand hover:bg-brand/5 dark:hover:bg-slate-700'
                      )}
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ============================================= */
        /* ============ INVENTORY REPORT =============== */
        /* ============================================= */
        <div className="space-y-6">

          {/* ═══ KPI CARDS ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-brand to-brand-dark text-white p-6 shadow-lg shadow-brand/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Total Products</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <Package size={18} className="text-white" />
                  </div>
                </div>
                <div className="text-3xl font-black font-mono tracking-tight">{products.length}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Registered in inventory</div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Total Stock Value</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <DollarSign size={18} className="text-white" />
                  </div>
                </div>
                <div className="text-3xl font-black font-mono tracking-tight">₱{fmtCurrency(invTotalValue)}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Combined RT + WS value</div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-amber-400 to-amber-600 text-white p-6 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Retail Stock</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <Layers size={18} className="text-white" />
                  </div>
                </div>
                <div className="text-lg font-black font-mono tracking-tight">₱{fmtCurrency(invRTValue)}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">WS: ₱{fmtCurrency(invWSValue)}</div>
              </div>
            </div>
          </div>

          {/* Stock value chart */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Top 10 Products by Stock Value</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...products].sort((a, b) => (b.retailStock * b.retailPrice + b.wholesaleStock * b.wholesalePrice) - (a.retailStock * a.retailPrice + a.wholesaleStock * a.wholesalePrice)).slice(0, 10)}
                  margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="4 4" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} width={140} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: `1px solid ${gridColor}`, borderRadius: '12px', fontSize: '13px' }}
                    formatter={(value: number) => [`₱${fmtCurrency(value)}`, 'Stock Value']}
                  />
                  <Bar dataKey={(p: any) => p.retailStock * p.retailPrice + p.wholesaleStock * p.wholesalePrice} fill="#4f46e5" radius={[0, 6, 6, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product table */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-5 pb-0 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  placeholder="Search by product name or barcode…"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:bg-slate-800 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={invSortBy}
                  onChange={(e) => { setInvSortBy(e.target.value as InvSortField); setInvSortDir('asc'); }}
                  className="text-[11px] font-semibold px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-brand cursor-pointer"
                >
                  {invSortFields.map((f) => (
                    <option key={f} value={f}>
                      {f === 'rtStock' ? 'RT Stock' :
                       f === 'wsStock' ? 'WS Stock' :
                       f === 'rtValue' ? 'RT Value' :
                       f === 'wsValue' ? 'WS Value' :
                       f === 'totalValue' ? 'Total Value' :
                       f.charAt(0).toUpperCase() + f.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setInvSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-400 hover:text-brand transition-colors"
                  title={invSortDir === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <ArrowUpDown size={13} className={cn('transition-transform', invSortDir === 'desc' && 'rotate-180')} />
                </button>
              </div>
            </div>
            <div className="p-5">
              {invFiltered.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No products found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-semibold">
                        <th className="text-left px-3 py-2">
                          <button onClick={() => toggleInvSort('name')} className={cn('flex items-center gap-1 hover:text-slate-700 transition-colors', invSortBy === 'name' && 'text-brand')}>
                            Product <ArrowUpDown size={10} className={cn('transition-transform', invSortBy === 'name' && invSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                        <th className="text-right px-3 py-2">
                          <button onClick={() => toggleInvSort('rtStock')} className={cn('flex items-center gap-1 justify-end hover:text-slate-700 transition-colors', invSortBy === 'rtStock' && 'text-brand')}>
                            RT Stock <ArrowUpDown size={10} className={cn('transition-transform', invSortBy === 'rtStock' && invSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                        <th className="text-right px-3 py-2">
                          <button onClick={() => toggleInvSort('wsStock')} className={cn('flex items-center gap-1 justify-end hover:text-slate-700 transition-colors', invSortBy === 'wsStock' && 'text-brand')}>
                            WS Stock <ArrowUpDown size={10} className={cn('transition-transform', invSortBy === 'wsStock' && invSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                        <th className="text-right px-3 py-2">
                          <button onClick={() => toggleInvSort('rtValue')} className={cn('flex items-center gap-1 justify-end hover:text-slate-700 transition-colors', invSortBy === 'rtValue' && 'text-brand')}>
                            RT Value <ArrowUpDown size={10} className={cn('transition-transform', invSortBy === 'rtValue' && invSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                        <th className="text-right px-3 py-2">
                          <button onClick={() => toggleInvSort('wsValue')} className={cn('flex items-center gap-1 justify-end hover:text-slate-700 transition-colors', invSortBy === 'wsValue' && 'text-brand')}>
                            WS Value <ArrowUpDown size={10} className={cn('transition-transform', invSortBy === 'wsValue' && invSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                        <th className="text-right px-3 py-2">
                          <button onClick={() => toggleInvSort('totalValue')} className={cn('flex items-center gap-1 justify-end hover:text-slate-700 transition-colors', invSortBy === 'totalValue' && 'text-brand')}>
                            Total Value <ArrowUpDown size={10} className={cn('transition-transform', invSortBy === 'totalValue' && invSortDir === 'desc' && 'rotate-180')} />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invPaginated.map((p) => (
                        <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-200">{p.name}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-400">{p.retailStock}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-400">{p.wholesaleStock}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">₱{fmtCurrency(p.retailStock * p.retailPrice)}</td>
                          <td className="px-3 py-2.5 text-right text-amber-600 dark:text-amber-400 font-medium">₱{fmtCurrency(p.wholesaleStock * p.wholesalePrice)}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-800 dark:text-slate-200">₱{fmtCurrency(p.retailStock * p.retailPrice + p.wholesaleStock * p.wholesalePrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {invFiltered.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {invFiltered.length} product{invFiltered.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-slate-300 dark:text-slate-600">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Show</span>
                    <select
                      value={invPageSize}
                      onChange={(e) => { setInvPageSize(Number(e.target.value)); setInvPage(1); }}
                      className="text-[10px] font-semibold px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-brand cursor-pointer"
                    >
                      {[15, 30, 50].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Page {invPage} of {invTotalPages}
                  </span>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700/50">
                    <button
                      onClick={() => setInvPage((p) => Math.max(1, p - 1))}
                      disabled={invPage <= 1}
                      className={cn(
                        'px-2.5 py-1.5 text-[10px] font-bold transition-colors',
                        invPage <= 1
                          ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 text-slate-600 hover:text-brand hover:bg-brand/5 dark:hover:bg-slate-700'
                      )}
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <div className="w-px bg-slate-200 dark:border-slate-700/50" />
                    <button
                      onClick={() => setInvPage((p) => Math.min(invTotalPages, p + 1))}
                      disabled={invPage >= invTotalPages}
                      className={cn(
                        'px-2.5 py-1.5 text-[10px] font-bold transition-colors',
                        invPage >= invTotalPages
                          ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 text-slate-600 hover:text-brand hover:bg-brand/5 dark:hover:bg-slate-700'
                      )}
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
