import { useEffect, useState, useMemo } from 'react';
import { Star, Phone, Search, Trash2, Edit3, Award, Settings, PiggyBank, UserPlus } from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { cn } from '../lib/cn';
import { fmtDate, fmtCurrency, getCustomerTier } from '../lib/formatters';
import type { Customer } from '../types/customer';

export default function RewardsPage() {
  const customers = useDataStore((s) => s.customers);
  const rewardsConfig = useDataStore((s) => s.rewardsConfig);
  const addCustomer = useDataStore((s) => s.addCustomer);
  const updateCustomer = useDataStore((s) => s.updateCustomer);
  const deleteCustomer = useDataStore((s) => s.deleteCustomer);
  const adjustCustomerPoints = useDataStore((s) => s.adjustCustomerPoints);
  const updateRewardsConfig = useDataStore((s) => s.updateRewardsConfig);
  const logAudit = useDataStore((s) => s.logAudit);
  const currentUser = useAuthStore((s) => s.currentUser);
  const showToast = useUIStore((s) => s.showToast);

  const [search, setSearch] = useState('');
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [pointsOpen, setPointsOpen] = useState(false);
  const [pointsTarget, setPointsTarget] = useState<Customer | null>(null);
  const [pointsDelta, setPointsDelta] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  // Config form state
  const [configForm, setConfigForm] = useState(rewardsConfig);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.nfcTag.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalPoints = customers.reduce((s, c) => s + c.points, 0);

  // --- Handlers ---

  function handleSaveCustomer(data: Omit<Customer, 'id'>) {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, data);
      logAudit('CUSTOMER_EDITED', `Edited: "${data.name}"`, currentUser?.name, currentUser?.role);
      showToast(`"${data.name}" updated`, 'success');
    } else {
      addCustomer(data);
      logAudit('CUSTOMER_ADDED', `Added: "${data.name}"`, currentUser?.name, currentUser?.role);
      showToast(`"${data.name}" added`, 'success');
    }
    setCustomerFormOpen(false);
  }

  function handleAdjustPoints() {
    if (!pointsTarget || !pointsDelta) return;
    const delta = parseInt(pointsDelta);
    if (isNaN(delta) || delta === 0) return;
    adjustCustomerPoints(pointsTarget.id, delta);
    logAudit('POINTS_ADJUSTED', `Adjusted ${pointsTarget.name}: ${delta > 0 ? '+' : ''}${delta} pts`, currentUser?.name, currentUser?.role);
    showToast(`Points adjusted: ${delta > 0 ? '+' : ''}${delta}`, 'success');
    setPointsOpen(false);
    setPointsDelta('');
    setPointsTarget(null);
  }

  function handleSaveConfig() {
    updateRewardsConfig(configForm);
    logAudit('REWARDS_CONFIG_UPDATED', 'Rewards configuration updated', currentUser?.name, currentUser?.role);
    showToast('Rewards configuration saved', 'success');
    setConfigOpen(false);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    logAudit('CUSTOMER_DELETED', `Deleted: "${deleteTarget.name}"`, currentUser?.name, currentUser?.role);
    deleteCustomer(deleteTarget.id);
    showToast(`"${deleteTarget.name}" deleted`, 'error');
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  return (
    <div className="animate-[fadeUp_0.25s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rewards &amp; Customers</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Manage customer loyalty and points</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setConfigForm(rewardsConfig); setConfigOpen(true); }}>
            <Settings size={13} /> Configure Rewards
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setEditingCustomer(null); setCustomerFormOpen(true); }}>
            <UserPlus size={14} /> Add Customer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Customers" value={String(customers.length)} icon={<Star size={16} />} iconBg="bg-purple-50" />
        <StatCard label="Total Points Issued" value={totalPoints.toLocaleString()} icon={<PiggyBank size={16} />} iconBg="bg-orange-bg" />
        <StatCard label="Points Configuration" value={`₱${rewardsConfig.redeemValue} = ${rewardsConfig.redeemEvery} pts`} icon={<Award size={16} />} iconBg="bg-green-bg" />
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or NFC tag…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Customer list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Star size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No customers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const tier = getCustomerTier(c.points);
            return (
              <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-3 h-3 rounded-full',
                      tier.key === 'gold' ? 'bg-amber-400' : tier.key === 'silver' ? 'bg-slate-400' : 'bg-amber-700'
                    )} />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.name}</div>
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        tier.key === 'gold' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        tier.key === 'silver' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                        'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                      )}>
                        {tier.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setPointsTarget(c); setPointsDelta(''); setPointsOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" title="Adjust Points">
                      <Award size={13} />
                    </button>
                    <button onClick={() => { setEditingCustomer(c); setCustomerFormOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" title="Edit">
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => { setDeleteTarget(c); setDeleteOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Phone size={11} /> {c.phone}
                  <span className="text-slate-300">|</span>
                  <span className="font-mono">{c.nfcTag}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold font-mono text-brand">{c.points.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">pts</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">₱{fmtCurrency(c.totalSpent)}</div>
                    <div className="text-[10px] text-slate-400">total spent</div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400">
                  Joined {fmtDate(c.joinDate)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Form Modal */}
      <CustomerFormModal
        open={customerFormOpen}
        onOpenChange={setCustomerFormOpen}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
      />

      {/* Adjust Points Modal */}
      <Dialog
        open={pointsOpen}
        onOpenChange={(o) => { if (!o) { setPointsOpen(false); setPointsTarget(null); } }}
        title="Adjust Points"
        subtitle={pointsTarget?.name ? `Adjust loyalty points for ${pointsTarget.name}` : ''}
      >
        <div className="py-4 space-y-4">
          {pointsTarget && (
            <div className="text-center">
              <div className="text-3xl font-bold font-mono text-brand">{pointsTarget.points}</div>
              <div className="text-xs text-slate-400">current points</div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Points Adjustment</label>
            <input
              type="number"
              value={pointsDelta}
              onChange={(e) => setPointsDelta(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdjustPoints(); }}
              placeholder="e.g. 100 or -50"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              autoFocus
            />
            <p className="text-[10px] text-slate-400">Use positive to add, negative to subtract</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setPointsOpen(false); setPointsTarget(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleAdjustPoints}>Apply</Button>
          </div>
        </div>
      </Dialog>

      {/* Config Modal */}
      <Dialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        title="Rewards Configuration"
        subtitle="Configure how points are earned and redeemed"
      >
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Earn Rate</label>
              <input
                type="number"
                value={configForm.earnRate}
                onChange={(e) => setConfigForm({ ...configForm, earnRate: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400">₱{configForm.earnRate} spent = 1 pt</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Redeem Every</label>
              <input
                type="number"
                value={configForm.redeemEvery}
                onChange={(e) => setConfigForm({ ...configForm, redeemEvery: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400">pts needed to redeem</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Redeem Value (₱)</label>
              <input
                type="number"
                value={configForm.redeemValue}
                onChange={(e) => setConfigForm({ ...configForm, redeemValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400">₱{configForm.redeemValue} off per redeem</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Silver Min</label>
              <input
                type="number"
                value={configForm.silverMin}
                onChange={(e) => setConfigForm({ ...configForm, silverMin: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gold Min</label>
              <input
                type="number"
                value={configForm.goldMin}
                onChange={(e) => setConfigForm({ ...configForm, goldMin: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfigOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveConfig}>Save Configuration</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => { if (!o) { setDeleteOpen(false); setDeleteTarget(null); } }}
        title=""
      >
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-red-bg flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Delete Customer?</h3>
          <p className="text-sm text-slate-500">Remove <strong>{deleteTarget?.name}</strong> and their points history?</p>
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="secondary" onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

/* --- Customer Form Modal --- */

function CustomerFormModal({
  open,
  onOpenChange,
  customer,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customer: Customer | null;
  onSave: (data: Omit<Customer, 'id'>) => void;
}) {
  const showToast = useUIStore((s) => s.showToast);
  const isEdit = !!customer;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nfcTag, setNfcTag] = useState('');
  const [points, setPoints] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (open) {
      if (customer) {
        setName(customer.name);
        setPhone(customer.phone);
        setNfcTag(customer.nfcTag);
        setPoints(customer.points);
        setTotalSpent(customer.totalSpent);
      } else {
        setName(''); setPhone(''); setNfcTag(''); setPoints(0); setTotalSpent(0);
      }
    }
  }, [open]);

  function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      showToast('Please fill in Name and Phone', 'error');
      return;
    }
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      nfcTag: nfcTag.trim() || `NFC-${String(Math.floor(100000 + Math.random() * 900000))}`,
      points: isEdit ? points : 0,
      totalSpent: isEdit ? totalSpent : 0,
      joinDate: isEdit && customer ? customer.joinDate : new Date().toISOString(),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Customer' : 'Add New Customer'}
      subtitle={isEdit ? 'Update customer information.' : 'Register a new loyalty customer.'}
    >
      <div className="py-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09171234567"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">NFC Tag ID</label>
            <input
              type="text"
              value={nfcTag}
              onChange={(e) => setNfcTag(e.target.value)}
              placeholder="NFC-001234"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        {isEdit && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Points</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Spent (₱)</label>
              <input
                type="number"
                value={totalSpent}
                onChange={(e) => setTotalSpent(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>{isEdit ? 'Save Changes' : 'Add Customer'}</Button>
      </div>
    </Dialog>
  );
}
