import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, ShoppingCart, Package, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useDataStore } from '../stores/dataStore';
import { useUIStore } from '../stores/uiStore';
import { StatCard } from '../components/ui/StatCard';
import { TypeBadge } from '../components/ui/Badge';
import { cn } from '../lib/cn';
import { fmtCurrency, fmtDate } from '../lib/formatters';

export default function DashboardPage() {
  const products = useDataStore((s) => s.products);
  const transactions = useDataStore((s) => s.transactions);
  const theme = useUIStore((s) => s.theme);
  const navigate = useNavigate();

  const [now, setNow] = useState(new Date());

  // Update the live date every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const isDark = theme === 'dark';

  // Computed values
  const todayStr = now.toDateString();
  const todayTx = useMemo(
    () => transactions.filter((t) => new Date(t.date).toDateString() === todayStr),
    [transactions, todayStr]
  );
  const todaySales = todayTx.reduce((s, t) => s + t.total, 0);
  const rtLow = products.filter((p) => p.retailStock <= 10);
  const wsLow = products.filter((p) => p.wholesaleStock <= 30);
  const recentTx = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [transactions]
  );

  // Weekly chart data
  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((d, i) => {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - now.getDay() + 1 + i);
      const dayStr = dt.toDateString();
      const dayTx = transactions.filter((t) => new Date(t.date).toDateString() === dayStr);
      const sales = dayTx.reduce((s, t) => s + t.total, 0);
      return { day: d, sales };
    });
  }, [transactions, now]);

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#64748b' : '#94a3b8';

  function fmtNow() {
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="animate-[fadeUp_0.25s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Manager's Dashboard</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Monitor your store's performance at a glance
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today's Sales"
          value={`₱${fmtCurrency(todaySales)}`}
          sub={fmtNow()}
          icon={<TrendingUp size={16} />}
          iconBg="bg-green-bg"
        />
        <StatCard
          label="Retail Low Stock"
          value={String(rtLow.length)}
          sub="≤ 10 units"
          icon={<AlertTriangle size={16} />}
          iconBg="bg-red-bg"
        />
        <StatCard
          label="Wholesale Low Stock"
          value={String(wsLow.length)}
          sub="≤ 30 units"
          icon={<Package size={16} />}
          iconBg="bg-orange-bg"
        />
        <StatCard
          label="Transactions Today"
          value={String(todayTx.length)}
          sub="Completed sales"
          icon={<ShoppingCart size={16} />}
          iconBg="bg-blue-bg"
        />
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 mb-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Weekly Sales Overview</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Sales performance for the last 7 days</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number) => [`₱${fmtCurrency(value)}`, 'Sales']}
                cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9', radius: 8 }}
              />
              <Bar
                dataKey="sales"
                fill="#4f46e5"
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AlertCard
          title="Retail Stock Alerts"
          icon="🛒"
          items={rtLow}
          type="rt"
          threshold={10}
          onManage={() => navigate('/inventory')}
        />
        <AlertCard
          title="Wholesale Stock Alerts"
          icon="📦"
          items={wsLow}
          type="ws"
          threshold={30}
          onManage={() => navigate('/inventory')}
        />
      </div>

      {/* Recent transactions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Recent Transactions</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Latest sales with sale type breakdown</p>
        <div className="space-y-2">
          {recentTx.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  ₱{fmtCurrency(tx.total)}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {fmtDate(tx.date)} · {tx.cashier}
                </div>
              </div>
              <div className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
        {recentTx.length > 0 && (
          <button
            onClick={() => navigate('/transactions')}
            className="mt-4 w-full py-2.5 text-sm font-semibold text-brand hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            View All Transactions
          </button>
        )}
      </div>
    </div>
  );
}

/* --- Alert Card Component --- */

function AlertCard({
  title,
  icon,
  items,
  type,
  threshold,
  onManage,
}: {
  title: string;
  icon: string;
  items: any[];
  type: 'rt' | 'ws';
  threshold: number;
  onManage: () => void;
}) {
  const isWS = type === 'ws';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          {icon} {title}
        </h3>
        <span className={cn(
          'text-[11px] font-bold px-2.5 py-0.5 rounded-full',
          isWS ? 'bg-orange-bg text-orange-700' : 'bg-red-bg text-red-600'
        )}>
          {items.length} items
        </span>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-1">
        <RefreshCw size={11} />
        {isWS ? 'AI bulk order guidance · ≤30 units' : 'AI-powered reorder recommendations · ≤10 units'}
      </p>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center py-6 text-sm text-slate-400 dark:text-slate-500">
            All {isWS ? 'wholesale' : 'retail'} stock levels are healthy
          </div>
        )}
        {items.slice(0, 5).map((p: any) => {
          const stock = isWS ? p.wholesaleStock : p.retailStock;
          const isCritical = stock <= (isWS ? 5 : 3);
          const reorderQty = Math.ceil(threshold * 5 - stock + (isWS ? 50 : 30));
          const days = stock > 0 ? `~${Math.max(1, Math.round(stock / 3))} day${Math.round(stock / 3) > 1 ? 's' : ''}` : 'No sales data';
          const aiMsg = isWS
            ? (stock < 5 ? 'Critically insufficient. Emergency bulk restock required.' : stock < 12 ? 'Cannot fulfill standard wholesale orders. Consider supplier negotiation.' : 'Stock below wholesale buffer. Reorder to fulfil bulk customer demand.')
            : (stock < 3 ? 'Critically low for retail. Schedule reorder within 24–48 hrs.' : 'Approaching retail minimum. Reorder to maintain shelf availability.');

          return (
            <div
              key={p.id}
              className={cn(
                'p-4 rounded-xl border',
                isCritical
                  ? 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30'
                  : 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.name}</span>
                <span className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  isCritical
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                )}>
                  {stock} {isWS ? 'WS' : 'RT'} left
                </span>
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                ₱{isWS ? p.wholesalePrice : p.retailPrice} {isWS ? 'WS' : 'retail'} · Category: {p.category || 'Others'}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div>
                    <div className="text-[9px] text-slate-400">Days Left</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{days}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400 flex-shrink-0">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  </svg>
                  <div>
                    <div className="text-[9px] text-slate-400">Reorder</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{reorderQty} units</div>
                  </div>
                </div>
              </div>
              <div className={cn(
                'flex items-start gap-1.5 text-xs p-2 rounded-lg',
                isCritical
                  ? 'bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              )}>
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                <span>AI: {aiMsg}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onManage}
        className="mt-4 w-full py-2.5 text-sm font-semibold text-brand hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
      >
        Manage Inventory
      </button>
    </div>
  );
}
