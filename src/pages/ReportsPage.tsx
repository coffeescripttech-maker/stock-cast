import { useMemo } from 'react';
import { BarChart3, Package, Download } from 'lucide-react';
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

  function exportExcel() {
    // Build CSV from current tab data
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
    <div className="animate-[fadeUp_0.25s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reports</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Analyze sales and inventory data</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <Download size={13} /> Export CSV
        </Button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5 mb-6">
        {[
          { key: 'transactions' as const, label: 'Transaction Report', icon: BarChart3 },
          { key: 'inventory' as const, label: 'Inventory Report', icon: Package },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setReportTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors',
              reportTab === tab.key
                ? 'bg-brand text-white'
                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-600 hover:border-brand'
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {reportTab === 'transactions' ? (
        /* ---- TRANSACTION REPORT ---- */
        <div>
          {/* Filter */}
          <div className="flex gap-1.5 mb-5">
            {(['week', 'month', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setReportFilter(f)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                  reportFilter === f
                    ? 'bg-brand text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-600 hover:border-brand'
                )}
              >
                {f === 'week' ? 'Past Week' : f === 'month' ? 'Past Month' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <div className="text-xs text-slate-400 font-semibold">Total Sales</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">₱{fmtCurrency(totalSales)}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <div className="text-xs text-slate-400 font-semibold">Transactions</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalTx}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <div className="text-xs text-slate-400 font-semibold">Avg per Transaction</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">₱{fmtCurrency(avgTx)}</div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Bar chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
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

          {/* Transaction list */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Transaction Details</h3>
            {filteredTransactions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No transactions found for this period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-semibold">
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-left px-3 py-2">Cashier</th>
                      <th className="text-center px-3 py-2">Type</th>
                      <th className="text-center px-3 py-2">Items</th>
                      <th className="text-right px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredTransactions]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-50 dark:border-slate-800/50">
                          <td className="px-3 py-2.5 font-mono text-xs">{tx.id}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-500">{fmtDate(tx.date)}</td>
                          <td className="px-3 py-2.5">{tx.cashier}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded',
                              tx.type === 'rt' ? 'bg-emerald-50 text-emerald-700' : tx.type === 'ws' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
                            )}>{tx.type.toUpperCase()}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-500">{tx.items.reduce((s, i) => s + i.qty, 0)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">₱{fmtCurrency(tx.total)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ---- INVENTORY REPORT ---- */
        <div>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <div className="text-xs text-slate-400 font-semibold">Total Products</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{products.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <div className="text-xs text-slate-400 font-semibold">Total Stock Value</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">₱{fmtCurrency(invTotalValue)}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <div className="text-xs text-slate-400 font-semibold">RT Stock Value</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">₱{fmtCurrency(invRTValue)}</div>
              <div className="text-xs text-slate-400 mt-1">WS: ₱{fmtCurrency(invWSValue)}</div>
            </div>
          </div>

          {/* Stock value chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Stock Value by Product</h3>
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Inventory Details</h3>
            {products.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No products in inventory</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-semibold">
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-right px-3 py-2">RT Stock</th>
                      <th className="text-right px-3 py-2">WS Stock</th>
                      <th className="text-right px-3 py-2">RT Value</th>
                      <th className="text-right px-3 py-2">WS Value</th>
                      <th className="text-right px-3 py-2">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/50">
                        <td className="px-3 py-2.5 font-semibold">{p.name}</td>
                        <td className="px-3 py-2.5 text-right">{p.retailStock}</td>
                        <td className="px-3 py-2.5 text-right">{p.wholesaleStock}</td>
                        <td className="px-3 py-2.5 text-right text-emerald-600">₱{fmtCurrency(p.retailStock * p.retailPrice)}</td>
                        <td className="px-3 py-2.5 text-right text-amber-600">₱{fmtCurrency(p.wholesaleStock * p.wholesalePrice)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">₱{fmtCurrency(p.retailStock * p.retailPrice + p.wholesaleStock * p.wholesalePrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
