import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Search, Plus, Trash2, Edit3, Package, AlertTriangle, DollarSign, ScanLine,
  ArrowUpDown, Grid3X3, List, Download, BarChart3,
  TrendingUp, X, ChevronLeft, ChevronRight,
  Activity, Clock, Truck,
} from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { BarcodeVisual } from '../components/pos/BarcodeVisual';
import { cn } from '../lib/cn';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/constants';
import { fmtCurrency } from '../lib/formatters';
import type { Product, ProductCategory } from '../types/product';

/* ─── Stock thresholds (from settings) ─── */
function getThresholds() {
  const inv = useSettingsStore.getState().settings.inventory;
  return { LOW_STOCK_RT: inv.lowStockThresholdRt, LOW_STOCK_WS: inv.lowStockThresholdWs };
}

/* ─── Categories with rich metadata ─── */
const CATEGORY_META = Object.fromEntries(
  CATEGORIES.map((c) => [c, CATEGORY_COLORS[c] || CATEGORY_COLORS.Others])
);

/* ─── Stats calculation ─── */
function computeStats(products: Product[], rtThreshold: number, wsThreshold: number) {
  const total = products.length;
  const totalValue = products.reduce(
    (s, p) => s + p.retailStock * p.retailPrice + p.wholesaleStock * p.wholesalePrice, 0
  );
  const lowStock = products.filter((p) => p.retailStock <= rtThreshold || p.wholesaleStock <= wsThreshold).length;
  const outOfStock = products.filter((p) => p.retailStock === 0 && p.wholesaleStock === 0).length;
  return { total, totalValue, lowStock, outOfStock };
}

/* ─── Category distribution for analytics ─── */
function categoryDistribution(products: Product[]) {
  const dist: Record<string, number> = {};
  products.forEach((p) => {
    const cat = p.category || 'Others';
    dist[cat] = (dist[cat] || 0) + 1;
  });
  return dist;
}

/* ======================================================================
   PAGE COMPONENT
   ====================================================================== */

export default function InventoryPage() {
  const products = useDataStore((s) => s.products);
  const addProduct = useDataStore((s) => s.addProduct);
  const updateProduct = useDataStore((s) => s.updateProduct);
  const deleteProduct = useDataStore((s) => s.deleteProduct);
  const logAudit = useDataStore((s) => s.logAudit);
  const currentUser = useAuthStore((s) => s.currentUser);
  const showToast = useUIStore((s) => s.showToast);

  /* ── UI state ── */
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<ProductCategory | 'All'>('All');
  const sortFields = ['name', 'retailPrice', 'wholesalePrice', 'retailStock', 'wholesaleStock', 'category'] as const;
  type SortField = (typeof sortFields)[number];
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  /* ── Modal state ── */
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [barcodeTarget, setBarcodeTarget] = useState<Product | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  /* ── Computed ── */
  const { LOW_STOCK_RT, LOW_STOCK_WS } = useMemo(() => getThresholds(), []);
  const stats = useMemo(() => computeStats(products, LOW_STOCK_RT, LOW_STOCK_WS), [products, LOW_STOCK_RT, LOW_STOCK_WS]);
  const catDist = useMemo(() => categoryDistribution(products), [products]);
  const maxCatCount = Math.max(1, ...Object.values(catDist));

  const activeCategories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category || 'Others'));
    return ['All' as const, ...CATEGORIES.filter((c) => cats.has(c))];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = products.filter((p) => {
      if (catFilter !== 'All' && p.category !== catFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.retailBarcode.toLowerCase().includes(q) ||
        p.wholesaleBarcode.toLowerCase().includes(q)
      );
    });
    list.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'name') return mul * a.name.localeCompare(b.name);
      if (sortBy === 'category') return mul * (a.category || '').localeCompare(b.category || '');
      return mul * ((a[sortBy] as number) - (b[sortBy] as number));
    });
    return list;
  }, [products, search, catFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  /* Reset to page 1 when filters/sort change */
  useEffect(() => { setPage(1); }, [search, catFilter, sortBy, sortDir, pageSize]);

  const paginatedIds = useMemo(() => new Set(paginated.map((p) => p.id)), [paginated]);
  const visibleSelectedCount = [...selectedIds].filter((id) => paginatedIds.has(id)).length;
  const allSelected = paginated.length > 0 && visibleSelectedCount === paginated.length;

  /* ── Handlers ── */
  function toggleSort(field: SortField) {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortDir('asc'); }
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function openAddForm() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEditForm(p: Product) {
    setEditingProduct(p);
    setFormOpen(true);
  }

  function handleSave(data: Omit<Product, 'id'>) {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
      logAudit('PRODUCT_EDITED', `Edited: "${data.name}"`, currentUser?.name, currentUser?.role);
      showToast(`"${data.name}" updated`, 'success');
    } else {
      addProduct(data);
      logAudit('PRODUCT_ADDED', `Added: "${data.name}"`, currentUser?.name, currentUser?.role);
      showToast(`"${data.name}" added successfully`, 'success');
    }
    setFormOpen(false);
    clearSelection();
  }

  function confirmDelete(p: Product) {
    setDeleteTarget(p);
    setDeleteOpen(true);
  }

  function doDelete() {
    if (!deleteTarget) return;
    logAudit('PRODUCT_DELETED', `Deleted: "${deleteTarget.name}"`, currentUser?.name, currentUser?.role);
    deleteProduct(deleteTarget.id);
    showToast(`"${deleteTarget.name}" deleted`, 'error');
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  function doBulkDelete() {
    selectedIds.forEach((id) => {
      const p = products.find((x) => x.id === id);
      if (p) {
        logAudit('PRODUCT_DELETED', `Bulk deleted: "${p.name}"`, currentUser?.name, currentUser?.role);
        deleteProduct(id);
      }
    });
    showToast(`Deleted ${selectedIds.size} products`, 'error');
    setBulkDeleteOpen(false);
    clearSelection();
  }

  function showBarcode(p: Product) {
    setBarcodeTarget(p);
    setBarcodeOpen(true);
  }

  /* ── Stock helpers ── */
  function getStockStatus(p: Product) {
    const rtLow = p.retailStock <= LOW_STOCK_RT;
    const wsLow = p.wholesaleStock <= LOW_STOCK_WS;
    const rtOut = p.retailStock === 0;
    const wsOut = p.wholesaleStock === 0;
    if (rtOut && wsOut) return { label: 'Out of Stock', class: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' };
    if (rtLow && wsLow) return { label: 'Low Stock', class: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' };
    if (rtLow || wsLow) return { label: 'Low Stock', class: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };
    return { label: 'In Stock', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };
  }

  function StockBadge({ p }: { p: Product }) {
    const s = getStockStatus(p);
    return <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', s.class)}>{s.label}</span>;
  }

  return (
    <div className="animate-[fadeUp_0.25s_ease] space-y-6 max-w-[1600px] mx-auto">
      {/* ═══ TOP SECTION: Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Inventory Overview</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {products.length} product{products.length !== 1 && 's'} · {stats.totalValue > 0
              ? `₱${Math.round(stats.totalValue).toLocaleString()} total value`
              : 'No stock data'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:shadow-sm transition-all flex items-center gap-2"
          >
            <Download size={13} /> Export
          </button>
          <Button variant="primary" size="sm" onClick={openAddForm}>
            <Plus size={14} /> Add Product
          </Button>
        </div>
      </div>

      {/* ═══ KPI CARDS ROW ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
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
            <div className="text-4xl font-black font-mono tracking-tight">{stats.total}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">
              <TrendingUp size={12} /> All time
            </div>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Stock Value</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <DollarSign size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">₱{Math.round(stats.totalValue).toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">At retail pricing</div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-orange-400 to-orange-600 text-white p-6 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Low Stock Items</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <AlertTriangle size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{stats.lowStock}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">
              RT ≤{LOW_STOCK_RT} · WS ≤{LOW_STOCK_WS}
            </div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-rose-500 to-red-600 text-white p-6 shadow-lg shadow-red-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Out of Stock</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <X size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{stats.outOfStock}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">No retail or wholesale stock</div>
          </div>
        </div>
      </div>

      {/* ═══ BENTO GRID SECTION ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ─── Stock Movement Chart (Large) ─── */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center">
                <Activity size={15} className="text-brand" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Stock Movement</h3>
                <p className="text-[10px] text-slate-400">Weekly inventory overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="w-2 h-2 rounded-full bg-brand" />
              <span className="text-slate-400">In</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-400">Out</span>
            </div>
          </div>
          {/* Bar chart */}
          <div className="relative h-44">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-slate-100 dark:border-slate-800 w-full" />
              ))}
            </div>
            <div className="relative h-full flex items-end justify-between gap-3 pb-1">
              {[
                { label: 'Mon', inVal: 75, outVal: 30 },
                { label: 'Tue', inVal: 60, outVal: 45 },
                { label: 'Wed', inVal: 90, outVal: 25 },
                { label: 'Thu', inVal: 50, outVal: 55 },
                { label: 'Fri', inVal: 85, outVal: 35 },
                { label: 'Sat', inVal: 40, outVal: 20 },
                { label: 'Sun', inVal: 30, outVal: 10 },
              ].map((day) => (
                <div key={day.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="flex items-end gap-[3px] w-full justify-center h-full">
                    <div
                      className="w-[30%] rounded-t-md bg-brand/70 hover:bg-brand transition-all duration-300 min-h-[4px]"
                      style={{ height: `${day.inVal}%` }}
                    />
                    <div
                      className="w-[30%] rounded-t-md bg-amber-400/70 hover:bg-amber-400 transition-all duration-300 min-h-[4px]"
                      style={{ height: `${day.outVal}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400 mt-1">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Top Selling Categories (Medium) ─── */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
                <BarChart3 size={15} className="text-purple-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Category Distribution</h3>
            </div>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Package size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No products yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(catDist).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, count]) => {
                const meta = CATEGORY_META[cat] || CATEGORY_COLORS.Others;
                const pct = Math.round((count / maxCatCount) * 100);
                return (
                  <div key={cat} className="group cursor-default">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{cat}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">{count} items</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 group-hover:opacity-80"
                        style={{ width: `${Math.max(4, pct)}%`, background: meta.color }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(catDist).length > 6 && (
                <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-100 dark:border-slate-800 mt-3">
                  +{Object.keys(catDist).length - 6} more categories
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Low Stock Alerts (Medium) ─── */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
                <AlertTriangle size={15} className="text-red-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Low Stock Alerts</h3>
            </div>
            {stats.lowStock > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                {stats.lowStock} items
              </span>
            )}
          </div>
          {stats.lowStock === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-3">
                <Package size={20} className="text-emerald-400" />
              </div>
              <p className="text-xs font-semibold text-slate-500">All stocked up</p>
              <p className="text-[10px] text-slate-400 mt-0.5">No low stock items to worry about</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {products
                .filter((p) => p.retailStock <= LOW_STOCK_RT || p.wholesaleStock <= LOW_STOCK_WS)
                .sort((a, b) => Math.min(a.retailStock, a.wholesaleStock) - Math.min(b.retailStock, b.wholesaleStock))
                .slice(0, 8)
                .map((p) => {
                  const catColor = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.Others;
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/alert">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: catColor.bg }}>
                        <span className="text-xs font-black" style={{ color: catColor.color }}>{p.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400">
                          <span className={cn(p.retailStock <= LOW_STOCK_RT ? 'font-bold text-red-500' : '')}>RT: {p.retailStock}</span>
                          <span>·</span>
                          <span className={cn(p.wholesaleStock <= LOW_STOCK_WS ? 'font-bold text-orange-500' : '')}>WS: {p.wholesaleStock}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openEditForm(p)}
                        className="opacity-0 group-hover/alert:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex-shrink-0"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ─── Recent Deliveries (Small) ─── */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center">
                <Truck size={15} className="text-sky-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recent Deliveries</h3>
            </div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock size={10} /> Coming soon
            </span>
          </div>
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Truck size={22} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Delivery tracking not yet available</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">This feature will track incoming stock deliveries</p>
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM SECTION: Controls + Table/Grid ═══ */}
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or barcode…"
                className="w-full pl-9 pr-3 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:bg-slate-800 transition-all"
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {activeCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat as ProductCategory | 'All')}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 text-[13px] font-bold rounded-xl transition-all whitespace-nowrap',
                    catFilter === cat
                      ? 'bg-brand text-white shadow-sm shadow-brand/20'
                      : 'text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 hover:border-brand hover:text-brand'
                  )}
                >
                  {cat === 'All' ? 'All' : cat}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as SortField); setSortDir('asc'); }}
                className="text-[12px] font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-brand transition-colors cursor-pointer"
              >
                {sortFields.map((f) => (
                  <option key={f} value={f}>
                    {f === 'retailPrice' ? 'RT Price' :
                     f === 'wholesalePrice' ? 'WS Price' :
                     f === 'retailStock' ? 'RT Stock' :
                     f === 'wholesaleStock' ? 'WS Stock' :
                     f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className={cn(
                  'p-2.5 rounded-xl border transition-colors',
                  'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800',
                  'text-slate-400 hover:text-brand'
                )}
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown size={14} className={cn('transition-transform', sortDir === 'desc' && 'rotate-180')} />
              </button>
            </div>

            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 flex-shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={cn('p-3 transition-colors', viewMode === 'table' ? 'bg-brand text-white' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600')}
                title="Table view"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-3 transition-colors', viewMode === 'grid' ? 'bg-brand text-white' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600')}
                title="Grid view"
              >
                <Grid3X3 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="px-5 py-3 bg-brand/5 border-b border-brand/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-brand">{selectedIds.size} selected</span>
              <button
                onClick={clearSelection}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Clear selection
              </button>
            </div>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              className="text-[11px] font-semibold text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-950/70"
            >
              <Trash2 size={12} className="inline mr-1" />Delete Selected
            </button>
          </div>
        )}

        {/* Product Content */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Package size={36} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-sm">No products found</p>
            <p className="text-xs mt-1">
              {search ? 'Try a different search or category filter' : 'Add products to inventory first'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* ══════ TABLE VIEW ══════ */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="w-10 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-brand focus:ring-brand/30"
                    />
                  </th>
                  <th className="text-left px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="text-right px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <button onClick={() => toggleSort('retailPrice')} className={cn('flex items-center gap-1 ml-auto hover:text-slate-600 transition-colors', sortBy === 'retailPrice' && 'text-brand')}>
                      RT Price <ArrowUpDown size={10} className={cn('transition-transform', sortBy === 'retailPrice' && sortDir === 'desc' && 'rotate-180')} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">WS Price</th>
                  <th className="text-right px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <button onClick={() => toggleSort('retailStock')} className={cn('flex items-center gap-1 ml-auto hover:text-slate-600 transition-colors', sortBy === 'retailStock' && 'text-brand')}>
                      RT Stock <ArrowUpDown size={10} className={cn('transition-transform', sortBy === 'retailStock' && sortDir === 'desc' && 'rotate-180')} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">WS Stock</th>
                  <th className="text-center px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => {
                  const rtLow = p.retailStock <= LOW_STOCK_RT;
                  const wsLow = p.wholesaleStock <= LOW_STOCK_WS;
                  const catColor = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.Others;
                  const isSelected = selectedIds.has(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'group border-b border-slate-50 dark:border-slate-800/50 transition-colors',
                        isSelected ? 'bg-brand/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-slate-300 text-brand focus:ring-brand/30"
                        />
                      </td>
                      {/* Product thumbnail + name + barcodes */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-black/5">
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ring-1 ring-black/5"
                              style={{ background: `linear-gradient(135deg, ${catColor.bg}, ${catColor.bg}88)` }}
                            >
                              <span className="text-sm font-black" style={{ color: catColor.color }}>
                                {p.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                              {p.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-mono text-slate-400 truncate">{p.retailBarcode}</span>
                              <span className="text-[9px] text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-[9px] font-mono text-slate-400 truncate">{p.wholesaleBarcode}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span
                          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: catColor.bg, color: catColor.color }}
                        >
                          {p.category}
                        </span>
                      </td>
                      {/* RT Price */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">₱{fmtCurrency(p.retailPrice)}</span>
                      </td>
                      {/* WS Price */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">₱{fmtCurrency(p.wholesalePrice)}</span>
                      </td>
                      {/* RT Stock */}
                      <td className="px-4 py-3.5 text-right">
                        <span className={cn('font-mono font-semibold text-sm', rtLow ? 'text-red-500' : 'text-slate-600 dark:text-slate-400')}>
                          {p.retailStock}
                        </span>
                      </td>
                      {/* WS Stock */}
                      <td className="px-4 py-3.5 text-right">
                        <span className={cn('font-mono font-semibold text-sm', wsLow ? 'text-orange-500' : 'text-slate-600 dark:text-slate-400')}>
                          {p.wholesaleStock}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5 text-center"><StockBadge p={p} /></td>
                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => showBarcode(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/5 transition-all" title="Barcodes">
                            <ScanLine size={13} />
                          </button>
                          <button onClick={() => openEditForm(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all" title="Edit">
                            <Edit3 size={13} />
                          </button>
                          <button onClick={() => confirmDelete(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ══════ GRID VIEW ══════ */
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {paginated.map((p) => {
                const rtLow = p.retailStock <= LOW_STOCK_RT;
                const wsLow = p.wholesaleStock <= LOW_STOCK_WS;
                const rtOut = p.retailStock === 0;
                const wsOut = p.wholesaleStock === 0;
                const catColor = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.Others;
                const isSelected = selectedIds.has(p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className={cn(
                      'relative bg-white dark:bg-slate-800 rounded-[14px] border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group cursor-pointer',
                      isSelected
                        ? 'border-brand ring-2 ring-brand/20 shadow-brand/10'
                        : 'border-slate-100 dark:border-slate-700/50'
                    )}
                  >
                    {/* Selection checkbox */}
                    <div
                      className={cn(
                        'absolute top-2.5 left-2.5 z-20 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                        isSelected
                          ? 'bg-brand border-brand'
                          : 'border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 opacity-0 group-hover:opacity-100'
                      )}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Image header */}
                    <div
                      className="relative h-0 w-full pt-[42%] overflow-hidden"
                      style={!p.imageUrl ? { background: `linear-gradient(135deg, ${catColor.bg}, ${catColor.bg}88)` } : undefined}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `${catColor.color}22`, color: catColor.color }}>
                            <span className="text-sm font-black">{p.name.charAt(0).toUpperCase()}</span>
                          </div>
                        </div>
                      )}

                      {/* Category tag */}
                      <span
                        className="absolute bottom-2 left-2 z-10 px-2 py-[2px] rounded text-[8px] font-bold shadow-sm"
                        style={{ background: catColor.color, color: '#fff' }}
                      >
                        {p.category}
                      </span>

                      {/* Stock mini-bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-900/5">
                        {(() => {
                          const maxStock = Math.max(p.retailStock, p.wholesaleStock, 1);
                          const rtPct = (p.retailStock / maxStock) * 50;
                          const wsPct = (p.wholesaleStock / maxStock) * 50;
                          return (
                            <>
                              <div className="absolute left-0 bottom-0 h-full bg-emerald-400 transition-all" style={{ width: `${rtPct}%` }} />
                              <div className="absolute right-0 bottom-0 h-full bg-amber-400 transition-all" style={{ width: `${wsPct}%` }} />
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Body - larger text */}
                    <div className="p-3 space-y-2">
                      <h3 className="text-[12px] font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                        {p.name}
                      </h3>

                      <div className="text-[10px] space-y-[3px]">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-1 ring-emerald-200" />
                            <span className="text-slate-400 font-semibold">RT</span>
                          </div>
                          <span className={cn('font-mono font-bold', rtOut ? 'text-red-400' : rtLow ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300')}>
                            ₱{fmtCurrency(p.retailPrice)} · {p.retailStock}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-amber-200" />
                            <span className="text-slate-400 font-semibold">WS</span>
                          </div>
                          <span className={cn('font-mono font-bold', wsOut ? 'text-red-400' : wsLow ? 'text-amber-500' : 'text-amber-600 dark:text-amber-400')}>
                            ₱{fmtCurrency(p.wholesalePrice)} · {p.wholesaleStock}
                          </span>
                        </div>
                      </div>

                      {/* Actions bar */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className={cn(
                          'text-[9px] font-bold px-2.5 py-1 rounded-full',
                          rtOut && wsOut ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300' :
                          rtLow || wsLow ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                        )}>
                          {rtOut && wsOut ? 'Out' : rtLow || wsLow ? 'Low' : 'OK'}
                        </span>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); showBarcode(p); }} className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/5 transition-all" title="Barcodes">
                            <ScanLine size={11} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); openEditForm(p); }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all" title="Edit">
                            <Edit3 size={11} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); confirmDelete(p); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all" title="Delete">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
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

      {/* ─── Modals ─── */}

      {/* Product Form */}
      <ProductFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        products={products}
        onSave={handleSave}
      />

      {/* Delete Single */}
      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteTarget(null); }} title="">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Delete Product?</h3>
          <p className="text-sm text-slate-500">
            Permanently remove <strong>{deleteTarget?.name}</strong> from inventory.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="secondary" onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }}>Cancel</Button>
            <Button variant="danger" onClick={doDelete}>Delete</Button>
          </div>
        </div>
      </Dialog>

      {/* Bulk Delete */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} title="">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Delete {selectedIds.size} Products?</h3>
          <p className="text-sm text-slate-500">This action cannot be undone.</p>
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="secondary" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={doBulkDelete}>Delete All</Button>
          </div>
        </div>
      </Dialog>

      {/* Barcode Details */}
      <Dialog
        open={barcodeOpen}
        onOpenChange={(o) => { setBarcodeOpen(o); if (!o) setBarcodeTarget(null); }}
        title={barcodeTarget?.name || ''}
        subtitle="Retail & Wholesale Barcodes"
        className="w-[400px]"
      >
        {barcodeTarget && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="border-2 border-emerald-500/30 rounded-xl p-4 text-center bg-emerald-50/50 dark:bg-emerald-950/30">
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-3">🛒 RETAIL</div>
              <div className="flex justify-center mb-3"><BarcodeVisual code={barcodeTarget.retailBarcode} /></div>
              <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{barcodeTarget.retailBarcode || '—'}</div>
              <div className="text-xs text-slate-400 mt-1">₱{barcodeTarget.retailPrice}/pc</div>
            </div>
            <div className="border-2 border-amber-500/30 rounded-xl p-4 text-center bg-amber-50/50 dark:bg-amber-950/30">
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-3">📦 WHOLESALE</div>
              <div className="flex justify-center mb-3"><BarcodeVisual code={barcodeTarget.wholesaleBarcode} /></div>
              <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{barcodeTarget.wholesaleBarcode || '—'}</div>
              <div className="text-xs text-slate-400 mt-1">₱{barcodeTarget.wholesalePrice}/case</div>
            </div>
            <div className="col-span-2 flex justify-center mt-2">
              <Button variant="primary" onClick={() => window.print()}>Print Barcodes</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

/* ======================================================================
   PRODUCT FORM MODAL
   ====================================================================== */

interface FormData {
  name: string;
  retailBarcode: string;
  wholesaleBarcode: string;
  retailPrice: number;
  wholesalePrice: number;
  retailStock: number;
  wholesaleStock: number;
  category: string;
}

function ProductFormModal({
  open, onOpenChange, product, products, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: Product | null;
  products: Product[];
  onSave: (data: Omit<Product, 'id'>) => void;
}) {
  const showToast = useUIStore((s) => s.showToast);
  const invSettings = useSettingsStore((s) => s.settings.inventory);
  const uploadProductImage = useDataStore((s) => s.uploadProductImage);
  const deleteProductImage = useDataStore((s) => s.deleteProductImage);
  const liveProduct = useDataStore(s => product ? s.products.find(p => p.id === product.id) : undefined);
  const isEdit = !!product;

  const [form, setForm] = useState<FormData>({
    name: '', retailBarcode: '', wholesaleBarcode: '',
    retailPrice: 0, wholesalePrice: 0,
    retailStock: 0, wholesaleStock: 0,
    category: 'Beverage',
  });
  const [key, setKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (product) {
        setForm({
          name: product.name,
          retailBarcode: product.retailBarcode,
          wholesaleBarcode: product.wholesaleBarcode,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
          retailStock: product.retailStock,
          wholesaleStock: product.wholesaleStock,
          category: product.category || 'Others',
        });
      } else {
        setForm({ name: '', retailBarcode: '', wholesaleBarcode: '', retailPrice: 0, wholesalePrice: 0, retailStock: 0, wholesaleStock: 0, category: 'Beverage' });
      }
      setKey((k) => k + 1);
    }
  }, [open, product]);

  function update(field: keyof FormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.retailBarcode.trim()) {
      showToast('Please fill in Product Name and Retail Barcode', 'error');
      return;
    }

    const barcodeConflict = products.find(
      (p) => p.id !== product?.id && (p.retailBarcode === form.retailBarcode || p.wholesaleBarcode === form.retailBarcode)
    );
    if (barcodeConflict) { showToast('Retail barcode already in use', 'error'); return; }

    if (form.wholesaleBarcode) {
      const wsConflict = products.find(
        (p) => p.id !== product?.id && (p.retailBarcode === form.wholesaleBarcode || p.wholesaleBarcode === form.wholesaleBarcode)
      );
      if (wsConflict) { showToast('Wholesale barcode already in use', 'error'); return; }
    }

    onSave({
      name: form.name.trim(),
      retailBarcode: form.retailBarcode.trim(),
      wholesaleBarcode: form.wholesaleBarcode.trim(),
      retailPrice: form.retailPrice,
      wholesalePrice: form.wholesalePrice,
      retailStock: form.retailStock,
      wholesaleStock: form.wholesaleStock,
      defaultType: 'rt',
      category: form.category as any,
    });
  }

  function simulateBarcode(field: 'retailBarcode' | 'wholesaleBarcode') {
    const code = String(Math.floor(1000000000 + Math.random() * 9000000000));
    setForm((prev) => ({ ...prev, [field]: code }));
    showToast(`Barcode simulated: ${code}`, 'info');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleUploadImage() {
    if (!product || !fileInputRef.current?.files?.[0]) return;
    setUploading(true);
    await uploadProductImage(product.id, fileInputRef.current.files[0]);
    setUploading(false);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Image uploaded', 'success');
  }

  async function handleDeleteImage() {
    if (!product) return;
    setUploading(true);
    await deleteProductImage(product.id);
    setUploading(false);
    handleRemoveImage();
    showToast('Image removed', 'success');
  }

  return (
    <Dialog
      key={key}
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Product' : 'Add New Product'}
      subtitle={isEdit ? 'Update product information.' : 'Fill in product details.'}
      className="w-[520px]"
    >
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Product Name</label>
          <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Product name"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <BarcodeField label="Retail Barcode" color="emerald" value={form.retailBarcode}
            onChange={(v) => update('retailBarcode', v)} onSimulate={() => simulateBarcode('retailBarcode')} />
          <BarcodeField label="Wholesale Barcode" color="amber" value={form.wholesaleBarcode}
            onChange={(v) => update('wholesaleBarcode', v)} onSimulate={() => simulateBarcode('wholesaleBarcode')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">🛒 Retail Price (₱)</label>
            <input type="number" value={form.retailPrice || ''} onChange={(e) => update('retailPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00" step="0.01"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-amber-600 dark:text-amber-400">📦 Wholesale Price (₱)</label>
            <input type="number" value={form.wholesalePrice || ''} onChange={(e) => update('wholesalePrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00" step="0.01"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Retail Stock</label>
            <input type="number" value={form.retailStock} onChange={(e) => update('retailStock', parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
            <p className="text-[10px] text-slate-400">Alert at ≤{invSettings.lowStockThresholdRt}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Wholesale Stock</label>
            <input type="number" value={form.wholesaleStock} onChange={(e) => update('wholesaleStock', parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
            <p className="text-[10px] text-slate-400">Alert at ≤{invSettings.lowStockThresholdWs}</p>
          </div>
        </div>

        {/* ─── Product Image ─── */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Product Image</label>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : liveProduct?.imageUrl ? (
                <img src={liveProduct.imageUrl} alt={liveProduct.name} className="w-full h-full object-cover" />
              ) : (
                <Package size={24} className="text-slate-300 dark:text-slate-600" />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Choose File
              </button>
              {previewUrl && (
                <div className="flex gap-1.5">
                  <button
                    onClick={handleUploadImage}
                    disabled={uploading}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
              {isEdit && liveProduct?.imageUrl && !previewUrl && (
                <button
                  onClick={handleDeleteImage}
                  disabled={uploading}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>
          {isEdit ? 'Save Changes' : 'Add Product'}
        </Button>
      </div>
    </Dialog>
  );
}

/* ─── Barcode Input Field ─── */

function BarcodeField({ label, color, value, onChange, onSimulate }: {
  label: string; color: 'emerald' | 'amber'; value: string; onChange: (v: string) => void; onSimulate: () => void;
}) {
  const cc = color === 'emerald'
    ? 'border-emerald-200 focus:border-emerald-500 text-emerald-600'
    : 'border-amber-200 focus:border-amber-500 text-amber-600';
  return (
    <div className="space-y-1.5">
      <label className={cn('text-xs font-semibold', color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
        {color === 'emerald' ? '🛒' : '📦'} {label}
      </label>
      <div className="flex gap-1.5">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={color === 'emerald' ? 'e.g. 1234567890' : 'e.g. 2234567890'}
          className={cn('flex-1 px-3.5 py-2.5 text-sm rounded-lg border bg-slate-50 outline-none dark:bg-slate-900 dark:text-slate-100', cc)} />
        <button onClick={onSimulate}
          className={cn('px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800', cc)}>
          <ScanLine size={13} />
        </button>
      </div>
      <BarcodeVisual small code={value} />
    </div>
  );
}
