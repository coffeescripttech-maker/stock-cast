import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Trash2, Edit3, Package, AlertTriangle, DollarSign, ScanLine } from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { BarcodeVisual } from '../components/pos/BarcodeVisual';
import { cn } from '../lib/cn';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/constants';
import { fmtCurrency } from '../lib/formatters';
import type { Product } from '../types/product';

export default function InventoryPage() {
  const products = useDataStore((s) => s.products);
  const addProduct = useDataStore((s) => s.addProduct);
  const updateProduct = useDataStore((s) => s.updateProduct);
  const deleteProduct = useDataStore((s) => s.deleteProduct);
  const logAudit = useDataStore((s) => s.logAudit);
  const currentUser = useAuthStore((s) => s.currentUser);
  const showToast = useUIStore((s) => s.showToast);

  // Local state
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [barcodeTarget, setBarcodeTarget] = useState<Product | null>(null);

  // Stats
  const totalValue = products.reduce((s, p) => s + p.retailStock * p.retailPrice + p.wholesaleStock * p.wholesalePrice, 0);
  const rtLowCount = products.filter((p) => p.retailStock <= 10).length;
  const wsLowCount = products.filter((p) => p.wholesaleStock <= 30).length;

  // Category filter bar - only show categories that exist in products
  const activeCategories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category || 'Others'));
    return ['All', ...CATEGORIES.filter((c) => cats.has(c))];
  }, [products]);

  // Filtered products
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchQ = !q || p.name.toLowerCase().includes(q) ||
        p.retailBarcode.toLowerCase().includes(q) ||
        p.wholesaleBarcode.toLowerCase().includes(q);
      const matchCat = catFilter === 'All' || (p.category || 'Others') === catFilter;
      return matchQ && matchCat;
    });
  }, [products, search, catFilter]);

  // Handlers
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
      logAudit('PRODUCT_EDITED', `Edited: "${data.name}" (${data.category})`, currentUser?.name, currentUser?.role);
      showToast(`"${data.name}" updated`, 'success');
    } else {
      addProduct(data);
      logAudit('PRODUCT_ADDED', `Added: "${data.name}" (${data.category})`, currentUser?.name, currentUser?.role);
      showToast(`"${data.name}" added successfully`, 'success');
    }
    setFormOpen(false);
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

  function showBarcode(p: Product) {
    setBarcodeTarget(p);
    setBarcodeOpen(true);
  }

  return (
    <div className="animate-[fadeUp_0.25s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Inventory</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Manage products, stock, and pricing</p>
        </div>
        <Button variant="primary" size="sm" onClick={openAddForm}>
          <Plus size={14} /> Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Products" value={String(products.length)} icon={<Package size={16} />} iconBg="bg-blue-bg" />
        <StatCard label="Retail Low Stock" value={String(rtLowCount)} sub="≤ 10 units" icon={<AlertTriangle size={16} />} iconBg="bg-red-bg" />
        <StatCard label="Wholesale Low Stock" value={String(wsLowCount)} sub="≤ 30 units" icon={<AlertTriangle size={16} />} iconBg="bg-orange-bg" />
        <StatCard label="Total Stock Value" value={`₱${Math.round(totalValue).toLocaleString()}`} icon={<DollarSign size={16} />} iconBg="bg-green-bg" />
      </div>

      {/* Category filter + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {activeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                catFilter === cat
                  ? 'bg-brand text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-brand'
              )}
            >
              {cat === 'All' ? 'All Products' : `${cat} (${products.filter((p) => (p.category || 'Others') === cat).length})`}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Product table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Package size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No products found</p>
          <p className="text-xs mt-1">Try a different search or category filter</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-semibold">
                <th className="text-left px-5 py-3">Barcode</th>
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-right px-5 py-3">RT Price</th>
                <th className="text-right px-5 py-3">WS Price</th>
                <th className="text-right px-5 py-3">RT Stock</th>
                <th className="text-right px-5 py-3">WS Stock</th>
                <th className="text-center px-5 py-3">Status</th>
                <th className="text-center px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const rtLow = p.retailStock <= 10;
                const wsLow = p.wholesaleStock <= 30;
                const bothLow = rtLow && wsLow;
                const catColor = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.Others;
                return (
                  <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Barcode */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">RT</span>
                          <div className="flex-1"><BarcodeVisual small code={p.retailBarcode} /></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">WS</span>
                          <div className="flex-1"><BarcodeVisual small code={p.wholesaleBarcode} /></div>
                        </div>
                      </div>
                    </td>
                    {/* Name + Category */}
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: catColor.bg, color: catColor.color }}
                      >
                        {p.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">₱{fmtCurrency(p.retailPrice)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-amber-600">₱{fmtCurrency(p.wholesalePrice)}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={rtLow ? 'text-red-500 font-bold' : 'text-slate-600 dark:text-slate-400'}>{p.retailStock}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={wsLow ? 'text-orange-500 font-bold' : 'text-slate-600 dark:text-slate-400'}>{p.wholesaleStock}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={cn(
                        'text-[11px] font-semibold px-2.5 py-0.5 rounded-full',
                        bothLow ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300' :
                        rtLow ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300' :
                        wsLow ? 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300' :
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                      )}>
                        {bothLow ? 'Low (RT+WS)' : rtLow ? 'Low Retail' : wsLow ? 'Low Wholesale' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => showBarcode(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          title="Barcodes"
                        >
                          <ScanLine size={14} />
                        </button>
                        <button
                          onClick={() => openEditForm(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => confirmDelete(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        products={products}
        onSave={handleSave}
      />

      {/* Delete Confirm Modal */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteTarget(null); }}
        title=""
      >
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-red-bg flex items-center justify-center mx-auto mb-4">
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

      {/* Barcode Details Modal */}
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

/* --- Product Form Modal --- */

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
  open,
  onOpenChange,
  product,
  products,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: Product | null;
  products: Product[];
  onSave: (data: Omit<Product, 'id'>) => void;
}) {
  const showToast = useUIStore((s) => s.showToast);
  const isEdit = !!product;

  const [form, setForm] = useState<FormData>({
    name: '',
    retailBarcode: '',
    wholesaleBarcode: '',
    retailPrice: 0,
    wholesalePrice: 0,
    retailStock: 0,
    wholesaleStock: 0,
    category: 'Beverage',
  });

  // Initialize from product when editing
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (open) {
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

    // Check barcode uniqueness (exclude current product if editing)
    const barcodeConflict = products.find(
      (p) => p.id !== product?.id && (p.retailBarcode === form.retailBarcode || p.wholesaleBarcode === form.retailBarcode)
    );
    if (barcodeConflict) {
      showToast('Retail barcode already in use', 'error');
      return;
    }
    if (form.wholesaleBarcode) {
      const wsConflict = products.find(
        (p) => p.id !== product?.id && (p.retailBarcode === form.wholesaleBarcode || p.wholesaleBarcode === form.wholesaleBarcode)
      );
      if (wsConflict) {
        showToast('Wholesale barcode already in use', 'error');
        return;
      }
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
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Product Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Product name"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
          <select
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Barcodes */}
        <div className="grid grid-cols-2 gap-4">
          <BarcodeField
            label="Retail Barcode"
            color="emerald"
            value={form.retailBarcode}
            onChange={(v) => update('retailBarcode', v)}
            onSimulate={() => simulateBarcode('retailBarcode')}
          />
          <BarcodeField
            label="Wholesale Barcode"
            color="amber"
            value={form.wholesaleBarcode}
            onChange={(v) => update('wholesaleBarcode', v)}
            onSimulate={() => simulateBarcode('wholesaleBarcode')}
          />
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">🛒 Retail Price (₱)</label>
            <input
              type="number"
              value={form.retailPrice || ''}
              onChange={(e) => update('retailPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-amber-600 dark:text-amber-400">📦 Wholesale Price (₱)</label>
            <input
              type="number"
              value={form.wholesalePrice || ''}
              onChange={(e) => update('wholesalePrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Stocks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Retail Stock</label>
            <input
              type="number"
              value={form.retailStock}
              onChange={(e) => update('retailStock', parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="text-[10px] text-slate-400">Alert at ≤10</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Wholesale Stock</label>
            <input
              type="number"
              value={form.wholesaleStock}
              onChange={(e) => update('wholesaleStock', parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="text-[10px] text-slate-400">Alert at ≤30</p>
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

/* --- Barcode Input Field --- */

function BarcodeField({
  label,
  color,
  value,
  onChange,
  onSimulate,
}: {
  label: string;
  color: 'emerald' | 'amber';
  value: string;
  onChange: (v: string) => void;
  onSimulate: () => void;
}) {
  const colorClasses = color === 'emerald'
    ? 'border-emerald-200 focus:border-emerald-500 text-emerald-600'
    : 'border-amber-200 focus:border-amber-500 text-amber-600';

  return (
    <div className="space-y-1.5">
      <label className={cn('text-xs font-semibold', color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
        {color === 'emerald' ? '🛒' : '📦'} {label}
      </label>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={color === 'emerald' ? 'e.g. 1234567890' : 'e.g. 2234567890'}
          className={cn('flex-1 px-3.5 py-2.5 text-sm rounded-lg border bg-slate-50 outline-none dark:bg-slate-900 dark:text-slate-100', colorClasses)}
        />
        <button
          onClick={onSimulate}
          className={cn('px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800', colorClasses)}
        >
          <ScanLine size={13} />
        </button>
      </div>
      <BarcodeVisual small code={value} />
    </div>
  );
}
