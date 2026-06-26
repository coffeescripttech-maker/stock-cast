import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, ShoppingCart, Package, RefreshCw, DollarSign, Activity, Clock, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useDataStore } from '../stores/dataStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { TypeBadge } from '../components/ui/Badge';
import { cn } from '../lib/cn';
import { fmtCurrency, fmtDate } from '../lib/formatters';

export default function DashboardPage() {
  const products = useDataStore((s) => s.products);
  const transactions = useDataStore((s) => s.transactions);
  const theme = useUIStore((s) => s.theme);
  const navigate = useNavigate();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const isDark = theme === 'dark';

  const todayStr = now.toDateString();
  const todayTx = useMemo(
    () => transactions.filter((t) => new Date(t.date).toDateString() === todayStr),
    [transactions, todayStr]
  );
  const todaySales = todayTx.reduce((s, t) => s + t.total, 0);
  const invSettings = useSettingsStore((s) => s.settings.inventory);
  const rtLow = products.filter((p) => p.retailStock <= invSettings.lowStockThresholdRt);
  const wsLow = products.filter((p) => p.wholesaleStock <= invSettings.lowStockThresholdWs);
  const recentTx = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [transactions]
  );

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
    <div className="animate-[fadeUp_0.25s_ease] space-y-6 max-w-[1600px] mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Manager's Dashboard</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Monitor your store's performance at a glance</p>
        </div>
        <div className="text-sm text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          {fmtNow()}
        </div>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-brand to-brand-dark text-white p-6 shadow-lg shadow-brand/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Today's Sales</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <DollarSign size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">₱{fmtCurrency(todaySales)}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">
              <TrendingUp size={12} /> Sales today
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-rose-500 to-red-600 text-white p-6 shadow-lg shadow-rose-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Retail Low Stock</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <AlertTriangle size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{rtLow.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">≤ 10 units remaining</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-orange-400 to-orange-600 text-white p-6 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Wholesale Low Stock</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Package size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{wsLow.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">≤ 30 units remaining</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Transactions Today</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Activity size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{todayTx.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">Completed sales</div>
          </div>
        </div>
      </div>

      {/* ═══ WEEKLY SALES CHART ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Weekly Sales Overview</h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock size={12} />
            <span>Last 7 days</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Sales performance for the current week</p>
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

      {/* ═══ LOW STOCK ALERTS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertCard
          title="Retail Stock Alerts"
          icon={<ShoppingCart size={16} />}
          items={rtLow}
          type="rt"
          threshold={10}
          accent="rose"
          onManage={() => navigate('/inventory')}
        />
        <AlertCard
          title="Wholesale Stock Alerts"
          icon={<Package size={16} />}
          items={wsLow}
          type="ws"
          threshold={30}
          accent="orange"
          onManage={() => navigate('/inventory')}
        />
      </div>

      {/* ═══ RECENT TRANSACTIONS ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Recent Transactions</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-semibold text-brand hover:text-brand-dark flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Latest sales with sale type breakdown</p>
        <div className="space-y-2">
          {recentTx.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No transactions yet</p>
              <p className="text-xs mt-1">Sales will appear here once recorded</p>
            </div>
          ) : (
            recentTx.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/10 to-brand/5 dark:from-brand/20 dark:to-brand/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={15} className="text-brand" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      ₱{fmtCurrency(tx.total)}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {fmtDate(tx.date)} · {tx.cashier}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TypeBadge type={tx.type} />
                  <span className={cn(
                    'text-[10px] font-bold px-2.5 py-0.5 rounded-full',
                    tx.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                  )}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/* ═══════════ LOW STOCK ALERT CARD ═════════════ */
/* ═══════════════════════════════════════════════ */

const ACCENT_CONFIG = {
  rose: { border: 'border-rose-200 dark:border-rose-900', bg: 'bg-rose-50/50 dark:bg-rose-950/30', critical: 'border-red-200 dark:border-red-900', criticalBg: 'bg-red-50/50 dark:bg-red-950/30', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300', badgeCritical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', alert: 'bg-rose-100/50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', alertCritical: 'bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: 'text-rose-500', cardGradient: 'from-rose-500 to-red-600' },
  orange: { border: 'border-amber-200 dark:border-amber-900', bg: 'bg-amber-50/50 dark:bg-amber-950/30', critical: 'border-red-200 dark:border-red-900', criticalBg: 'bg-red-50/50 dark:bg-red-950/30', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', badgeCritical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', alert: 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', alertCritical: 'bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: 'text-orange-500', cardGradient: 'from-orange-400 to-orange-600' },
};

function AlertCard({
  title,
  icon,
  items,
  type,
  threshold,
  accent,
  onManage,
}: {
  title: string;
  icon: React.ReactNode;
  items: any[];
  type: 'rt' | 'ws';
  threshold: number;
  accent: 'rose' | 'orange';
  onManage: () => void;
}) {
  const ac = ACCENT_CONFIG[accent];
  const isWS = type === 'ws';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span className={ac.icon}>{icon}</span>
          {title}
        </h3>
        <span className={cn(
          'text-[11px] font-bold px-2.5 py-0.5 rounded-full',
          items.length === 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ac.badge
        )}>
          {items.length === 0 ? 'All healthy' : `${items.length} item${items.length > 1 ? 's' : ''}`}
        </span>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-1">
        <RefreshCw size={11} />
        {isWS ? 'AI bulk order guidance · ≤30 units' : 'AI-powered reorder recommendations · ≤10 units'}
      </p>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center py-6 text-sm text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-3">
              <Package size={20} className="text-emerald-500" />
            </div>
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
                isCritical ? ac.criticalBg : ac.bg,
                isCritical ? ac.critical : ac.border
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.name}</span>
                <span className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  isCritical ? ac.badgeCritical : ac.badge
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
                isCritical ? ac.alertCritical : ac.alert
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
        className="mt-4 w-full py-2.5 text-sm font-semibold text-brand hover:bg-brand/5 rounded-xl transition-colors border border-transparent hover:border-brand/10"
      >
        Manage Inventory
      </button>
    </div>
  );
}
