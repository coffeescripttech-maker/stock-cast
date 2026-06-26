import { useEffect, useState, useMemo } from 'react';
import { Star, Search, Trash2, Edit3, Award, Settings, PiggyBank, UserPlus, Users, TrendingUp, ChevronLeft, ChevronRight, Printer, Download, Phone, Calendar, Tag, ArrowUpDown, List, Grid3X3 } from 'lucide-react';
import QRCode from 'qrcode';
import { get } from '../api/client';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { cn } from '../lib/cn';
import { fmtCurrency, fmtDate, getCustomerTier } from '../lib/formatters';
import type { Customer } from '../types/customer';

/* ─── Tier color maps for the premium theme ─── */
const TIER_CONFIG = {
  gold: {
    label: 'Gold',
    gradient: 'from-[#D4AF37] to-[#F5D76E]',
    badge: 'bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] text-[#1a1a23] shadow-[0_0_16px_rgba(212,175,55,0.3)]',
    accent: '#D4AF37',
    cardGlow: 'rgba(212,175,55,0.12)',
  },
  silver: {
    label: 'Silver',
    gradient: 'from-[#A0A0B0] to-[#C8C8D0]',
    badge: 'bg-gradient-to-r from-[#A0A0B0] to-[#C8C8D0] text-[#1a1a23] shadow-[0_0_16px_rgba(160,160,176,0.25)]',
    accent: '#A0A0B0',
    cardGlow: 'rgba(160,160,176,0.10)',
  },
  bronze: {
    label: 'Bronze',
    gradient: 'from-[#CD7F32] to-[#E8A85C]',
    badge: 'bg-gradient-to-r from-[#CD7F32] to-[#E8A85C] text-white shadow-[0_0_16px_rgba(205,127,50,0.25)]',
    accent: '#CD7F32',
    cardGlow: 'rgba(205,127,50,0.10)',
  },
};

/* ─── Generate a stable MEM-XXXXXX ID from the customer database PK ─── */
function memberId(id: number): string {
  return `MEM-${String(id).padStart(6, '0')}`;
}

/* ─── QR generation (async, cached per customer) ─── */
function useQRData(customerId: number, text: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(text, {
      width: 140,
      margin: 1,
      color: { dark: '#17171c', light: '#ffffff' },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => { cancelled = true; };
  }, [customerId, text]);
  return dataUrl;
}

/* ═══════════════════════════════════════════════ */
/* ═══════════ PREMIUM LOYALTY CARD ═════════════ */
/* ═══════════════════════════════════════════════ */

function LoyaltyCard({
  customer,
  onEdit,
  onDelete,
  onAdjustPoints,
  onPrint,
}: {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
  onAdjustPoints: () => void;
  onPrint: () => void;
}) {
  const tier = getCustomerTier(customer.points);
  const config = TIER_CONFIG[tier.key as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.bronze;
  const mid = memberId(customer.id);
  const qrText = customer.nfcTag;
  const qrUrl = useQRData(customer.id, qrText);

  return (
    <div className="group relative w-full rounded-[20px] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
      style={{
        boxShadow: `0 8px 32px ${config.cardGlow}, 0 1px 4px rgba(0,0,0,0.2)`,
        printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact',
      } as React.CSSProperties}
    >
      {/* Card face — deep obsidian black with gold accents */}
      <div
        className="relative bg-gradient-to-br from-[#08080c] via-[#0d0d14] to-[#111118] aspect-[1.586/1] w-full"
        style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}
      >
        {/* Gold border ring (inner glow) */}
        <div
          className="absolute inset-[1px] rounded-[19px] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.05) 40%, rgba(251,191,36,0.02) 60%, rgba(251,191,36,0.15))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '1px',
          }}
        />

        {/* Glassmorphism radial glow accents */}
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full opacity-[0.08] blur-3xl"
          style={{ background: `radial-gradient(circle, ${config.accent}, transparent)` }}
        />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full opacity-[0.05] blur-3xl"
          style={{ background: `radial-gradient(circle, ${config.accent}, transparent)` }}
        />

        {/* Subtle gold sheen sweep */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, rgba(251,191,36,0.3) 48%, rgba(251,191,36,0.1) 52%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-5 sm:p-6">

          {/* ─── TOP ROW: Brand + Gold "LOYALTY MEMBER" ─── */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Glassmorphism logo — frosted effect */}
              <div className="w-10 h-10 rounded-[12px] bg-white/[0.07] backdrop-blur-xl flex items-center justify-center border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <span className="text-[13px] font-black tracking-tight text-white/90">R</span>
              </div>
              <div>
                <span className="text-[8px] font-bold tracking-[0.3em] uppercase text-white/25 block leading-relaxed">StockCast</span>
                <span className="text-[7px] font-medium tracking-[0.15em] uppercase text-white/15">rewards</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-right">
                <div className="text-[10px] sm:text-[11px] font-black tracking-[0.25em] uppercase leading-tight"
                  style={{
                    background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Loyalty<br/>Member
                </div>
              </div>
              {/* Action buttons (hover only — admin tools) */}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pt-0.5">
                <button onClick={onAdjustPoints} className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/20 transition-all" title="Adjust Points">
                  <Award size={9} />
                </button>
                <button onClick={onEdit} className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/20 transition-all" title="Edit">
                  <Edit3 size={9} />
                </button>
                <button onClick={onDelete} className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/[0.06] text-white/50 hover:text-red-400 hover:bg-red-500/15 transition-all" title="Delete">
                  <Trash2 size={9} />
                </button>
                <button onClick={onPrint} className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/20 transition-all" title="Print Card">
                  <Printer size={9} />
                </button>
              </div>
            </div>
          </div>

          {/* ─── GOLD DIVIDER ─── */}
          <div className="flex items-center gap-3 my-2 sm:my-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#FBBF24]/30 to-transparent" />
            <div className="w-1 h-1 rounded-full bg-[#FBBF24]/40 shadow-[0_0_6px_rgba(251,191,36,0.3)]" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#FBBF24]/30 to-transparent" />
          </div>

          {/* ─── MIDDLE: Customer name + Member ID ─── */}
          <div className="flex-1 flex flex-col justify-center px-0.5 -mt-1">
            <p className="text-[9px] font-semibold tracking-[0.25em] uppercase text-white/20 mb-1">Member</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">{customer.name}</h3>
            <p className="text-[12px] font-mono font-semibold text-white/30 mt-1 tracking-wide flex items-center gap-2">
              <span className="text-[#FBBF24]/50 text-[9px]">◆</span>
              {mid}
            </p>
          </div>

          {/* ─── BOTTOM: QR scan zone + info ─── */}
          <div className="flex items-end gap-4 mt-1">
            {/* QR — white-on-black contrast for scannability, framed in glass */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="w-[62px] h-[62px] rounded-[12px] bg-white flex items-center justify-center overflow-hidden p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                {qrUrl ? (
                  <img src={qrUrl} alt="QR" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <span className="text-[6.5px] font-bold tracking-[0.15em] uppercase" style={{ color: 'rgba(251,191,36,0.5)' }}>Scan here</span>
            </div>

            {/* Tagline */}
            <div className="flex-1 min-w-0 pb-0.5">
              <p className="text-[10px] font-semibold leading-relaxed" style={{ color: 'rgba(251,191,36,0.55)' }}>
                Earn rewards with every purchase
              </p>
              <p className="text-[12px] font-mono text-white/30 mt-1.5 tracking-wide">{mid}</p>
              <p className="text-[8px] text-white/15 mt-0.5 font-medium">{customer.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Print a single card in a new window ─── */
async function printCard(customer: Customer) {
  const mid = memberId(customer.id);

  // Generate QR data URL BEFORE opening the print window (avoids CDN & timing issues)
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(customer.nfcTag, {
      width: 140, margin: 1,
      color: { dark: '#17171c', light: '#ffffff' },
    });
  } catch {
    // QR generation failed — will fall back to placeholder
  }

  const win = window.open('', '_blank');
  if (!win) return;

  const html = `<!DOCTYPE html>
<html>
<head><title>Loyalty Card - ${customer.name}</title>
<style>
  @page { margin: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  * { margin: 0; padding: 0; box-sizing: border-box; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  body {
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; background: #fff;
    font-family: -apple-system, 'Inter', 'SF Pro Display', 'Segoe UI', sans-serif;
  }
  .card {
    width: 85.6mm; height: 53.98mm;
    background: linear-gradient(135deg, #08080c 0%, #0d0d14 50%, #111118 100%);
    border-radius: 3.5mm;
    padding: 4.5mm 5.5mm;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
    print-color-adjust: exact; -webkit-print-color-adjust: exact;
  }
  .card::before {
    content: '';
    position: absolute; top: -8mm; right: -8mm;
    width: 28mm; height: 28mm;
    background: radial-gradient(circle, rgba(251,191,36,0.08), transparent);
    border-radius: 50%; filter: blur(6mm);
  }
  .card::after {
    content: '';
    position: absolute; bottom: -10mm; left: -10mm;
    width: 32mm; height: 32mm;
    background: radial-gradient(circle, rgba(251,191,36,0.05), transparent);
    border-radius: 50%; filter: blur(6mm);
  }
  /* Gold inner border ring */
  .card-border {
    position: absolute; inset: 0.5mm; border-radius: 3mm;
    border: 0.3mm solid rgba(251,191,36,0.12);
    pointer-events: none;
  }
  .top-row {
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .brand {
    display: flex; align-items: center; gap: 1.5mm;
  }
  .brand-icon {
    width: 7mm; height: 7mm;
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(2mm);
    border-radius: 1.5mm;
    display: flex; align-items: center; justify-content: center;
    border: 0.3mm solid rgba(255,255,255,0.06);
  }
  .brand-icon span { color: rgba(255,255,255,0.85); font-weight: 900; font-size: 3mm; }
  .brand-name {
    color: rgba(255,255,255,0.3); font-size: 1.8mm;
    font-weight: 700; letter-spacing: 0.5mm; text-transform: uppercase;
  }
  .title {
    text-align: right;
    font-size: 1.6mm; font-weight: 900;
    letter-spacing: 0.3em; text-transform: uppercase;
    line-height: 1.6;
    color: #FBBF24;
  }
  .middle {
    flex: 1; display: flex; flex-direction: column; justify-content: center;
    padding: 1mm 0 0.5mm;
  }
  .member-label {
    font-size: 1.5mm; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.2em;
    color: rgba(255,255,255,0.25); margin-bottom: 0.8mm;
  }
  .customer-name {
    color: #fff; font-weight: 700;
    font-size: 4.2mm; letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .member-id {
    font-size: 1.7mm; font-family: monospace;
    font-weight: 600; letter-spacing: 0.05em;
    color: rgba(255,255,255,0.35); margin-top: 0.8mm;
  }
  .bottom-row {
    display: flex; align-items: flex-end; gap: 3mm;
  }
  .qr-section {
    display: flex; flex-direction: column; align-items: center;
    gap: 0.5mm; flex-shrink: 0;
  }
  .qr-box {
    width: 11mm; height: 11mm; flex-shrink: 0;
    background: #fff;
    border-radius: 1.5mm;
    display: flex; align-items: center; justify-content: center;
    padding: 0.8mm;
    box-shadow: 0 0.3mm 0.6mm rgba(0,0,0,0.2);
  }
  .qr-box img { width: 100%; height: 100%; object-fit: contain; }
  .qr-placeholder { color: rgba(0,0,0,0.15); font-size: 1.6mm; }
  .scan-label {
    font-size: 1mm; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.15em;
    color: rgba(255,255,255,0.25);
  }
  .tagline {
    flex: 1; padding-bottom: 0.5mm;
  }
  .tagline .main {
    font-size: 1.8mm; font-weight: 600;
    color: rgba(255,255,255,0.5);
    line-height: 1.5;
  }
  .tagline .mid {
    font-size: 1.6mm; font-family: monospace;
    color: rgba(255,255,255,0.3);
    margin-top: 0.8mm;
    letter-spacing: 0.03em;
  }
  .tagline .phone {
    font-size: 1.2mm;
    color: rgba(255,255,255,0.17);
    margin-top: 0.3mm;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="card-border"></div>

    <div class="top-row">
      <div class="brand">
        <div class="brand-icon"><span>R</span></div>
        <div>
          <div class="brand-name">StockCast</div>
          <div style="font-size:1.1mm;color:rgba(255,255,255,0.12);letter-spacing:0.15em;text-transform:uppercase;margin-top:0.2mm;">rewards</div>
        </div>
      </div>
      <div class="title">Loyalty<br/>Member</div>
    </div>

    <!-- Gold divider -->
    <div style="display:flex;align-items:center;gap:2mm;margin:1.5mm 0;">
      <div style="flex:1;height:0.3mm;background:linear-gradient(90deg,transparent,rgba(251,191,36,0.2),transparent);"></div>
      <div style="width:0.6mm;height:0.6mm;border-radius:50%;background:rgba(251,191,36,0.3);"></div>
      <div style="flex:1;height:0.3mm;background:linear-gradient(90deg,transparent,rgba(251,191,36,0.2),transparent);"></div>
    </div>

    <div class="middle">
      <div class="member-label">Member</div>
      <div class="customer-name">${customer.name}</div>
      <div class="member-id" style="display:flex;align-items:center;gap:1mm;">
        <span style="color:rgba(251,191,36,0.4);font-size:1.5mm;">◆</span>
        ${mid}
      </div>
    </div>

    <div class="bottom-row">
      <div class="qr-section">
        <div class="qr-box" id="qr-container">
          ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" style="width:100%;height:100%;object-fit:contain;" />` : `<div class="qr-placeholder">QR</div>`}
        </div>
        <div class="scan-label">Scan here</div>
      </div>
      <div class="tagline">
        <div class="main">Earn rewards with every purchase</div>
        <div class="mid">${mid}</div>
        <div class="phone">${customer.phone}</div>
      </div>
    </div>
  </div>
  <script>
    setTimeout(function() { window.print(); window.close(); }, 300);
  <\/script>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}

/* ═══════════════════════════════════════════════ */
/* ═══════════════ MAIN PAGE ════════════════════ */
/* ═══════════════════════════════════════════════ */

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

  const [configForm, setConfigForm] = useState(rewardsConfig);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const sortFields = ['name', 'points', 'totalSpent', 'joinDate'] as const;
  type SortField = (typeof sortFields)[number];
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = customers.filter((c) =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.nfcTag.toLowerCase().includes(q)
    );
    list.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'name') return mul * a.name.localeCompare(b.name);
      if (sortBy === 'joinDate') return mul * (new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime());
      return mul * ((a[sortBy] as number) - (b[sortBy] as number));
    });
    return list;
  }, [customers, search, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [search, sortBy, sortDir]);

  const totalPoints = customers.reduce((s, c) => s + c.points, 0);
  const totalSpentAll = customers.reduce((s, c) => s + c.totalSpent, 0);
  const goldCount = customers.filter((c) => getCustomerTier(c.points).key === 'gold').length;
  const silverCount = customers.filter((c) => getCustomerTier(c.points).key === 'silver').length;

  // --- Handlers ---

  function toggleSort(field: SortField) {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortDir('asc'); }
  }

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

  // Print all visible cards (sequential to avoid multiple print dialogs at once)
  async function printAllVisible() {
    for (const c of paginated) {
      await printCard(c);
    }
  }

  return (
    <div className="animate-[fadeUp_0.25s_ease] space-y-6 max-w-[1600px] mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Rewards &amp; Customers</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {customers.length} registered customer{customers.length !== 1 && 's'} · {totalPoints.toLocaleString()} total points
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={printAllVisible} disabled={paginated.length === 0}>
            <Download size={13} /> Print All
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setConfigForm(rewardsConfig); setConfigOpen(true); }}>
            <Settings size={13} /> Configure
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setEditingCustomer(null); setCustomerFormOpen(true); }}>
            <UserPlus size={14} /> Add Customer
          </Button>
        </div>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-brand to-brand-dark text-white p-6 shadow-lg shadow-brand/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Registered Members</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Users size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{customers.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">
              <TrendingUp size={12} /> Loyalty program members
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Total Points Issued</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <PiggyBank size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{totalPoints.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">₱{fmtCurrency(totalSpentAll)} total spend</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-amber-400 to-amber-600 text-white p-6 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Gold Tier</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Award size={18} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono tracking-tight">{goldCount}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">{silverCount} silver members</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Redeem Rate</span>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Star size={18} className="text-white" />
              </div>
            </div>
            <div className="text-lg font-black font-mono tracking-tight">₱{rewardsConfig.redeemValue} = {rewardsConfig.redeemEvery} pts</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/60">₱{rewardsConfig.earnRate} spent = 1 pt</div>
          </div>
        </div>
      </div>

      {/* ═══ LOYALTY CARDS GRID ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, or NFC tag…"
                className="w-full pl-9 pr-3 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-brand focus:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:bg-slate-800 transition-all"
              />
            </div>
            {/* Sort controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as SortField); setSortDir('asc'); }}
                className="text-[12px] font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-brand transition-colors cursor-pointer"
              >
                {sortFields.map((f) => (
                  <option key={f} value={f}>
                    {f === 'totalSpent' ? 'Total Spent' :
                     f === 'joinDate' ? 'Join Date' :
                     f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-400 hover:text-brand transition-colors"
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown size={14} className={cn('transition-transform', sortDir === 'desc' && 'rotate-180')} />
              </button>
            </div>
            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-3 transition-colors', viewMode === 'grid' ? 'bg-brand text-white' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600')}
                title="Grid view"
              >
                <Grid3X3 size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn('p-3 transition-colors', viewMode === 'table' ? 'bg-brand text-white' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600')}
                title="Table view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Card Grid / Table View */}
        {paginated.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Star size={36} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-sm">No customers found</p>
            <p className="text-xs mt-1">
              {search ? 'Try a different search' : 'Add customers to start tracking loyalty'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {paginated.map((c) => (
                <LoyaltyCard
                  key={c.id}
                  customer={c}
                  onEdit={() => { setEditingCustomer(c); setCustomerFormOpen(true); }}
                  onDelete={() => { setDeleteTarget(c); setDeleteOpen(true); }}
                  onAdjustPoints={() => { setPointsTarget(c); setPointsDelta(''); setPointsOpen(true); }}
                  onPrint={() => printCard(c)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* ══════ TABLE VIEW ══════ */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="text-left px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <button onClick={() => toggleSort('name')} className={cn('flex items-center gap-1 hover:text-slate-600 transition-colors', sortBy === 'name' && 'text-brand')}>
                      Name <ArrowUpDown size={10} className={cn('transition-transform', sortBy === 'name' && sortDir === 'desc' && 'rotate-180')} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">NFC Tag</th>
                  <th className="text-right px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <button onClick={() => toggleSort('points')} className={cn('flex items-center gap-1 ml-auto hover:text-slate-600 transition-colors', sortBy === 'points' && 'text-brand')}>
                      Points <ArrowUpDown size={10} className={cn('transition-transform', sortBy === 'points' && sortDir === 'desc' && 'rotate-180')} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <button onClick={() => toggleSort('totalSpent')} className={cn('flex items-center gap-1 ml-auto hover:text-slate-600 transition-colors', sortBy === 'totalSpent' && 'text-brand')}>
                      Total Spent <ArrowUpDown size={10} className={cn('transition-transform', sortBy === 'totalSpent' && sortDir === 'desc' && 'rotate-180')} />
                    </button>
                  </th>
                  <th className="text-center px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tier</th>
                  <th className="text-right px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <button onClick={() => toggleSort('joinDate')} className={cn('flex items-center gap-1 ml-auto hover:text-slate-600 transition-colors', sortBy === 'joinDate' && 'text-brand')}>
                      Join Date <ArrowUpDown size={10} className={cn('transition-transform', sortBy === 'joinDate' && sortDir === 'desc' && 'rotate-180')} />
                    </button>
                  </th>
                  <th className="text-center px-4 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => {
                  const tier = getCustomerTier(c.points);
                  const tierCfg = TIER_CONFIG[tier.key] || TIER_CONFIG.bronze;
                  const initials = c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={c.id}
                      className="group border-b border-slate-50 dark:border-slate-800/50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20"
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ring-1 ring-black/5 text-[11px] font-bold"
                            style={{ background: `linear-gradient(135deg, ${tierCfg.accent}22, ${tierCfg.accent}44)`, color: tierCfg.accent }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                              {c.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{memberId(c.id)}</div>
                          </div>
                        </div>
                      </td>
                      {/* Phone */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Phone size={11} className="flex-shrink-0" />
                          <span className="text-sm">{c.phone}</span>
                        </div>
                      </td>
                      {/* NFC Tag */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Tag size={11} className="flex-shrink-0" />
                          <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{c.nfcTag}</span>
                        </div>
                      </td>
                      {/* Points */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">{c.points.toLocaleString()}</span>
                      </td>
                      {/* Total Spent */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-mono font-semibold text-sm text-emerald-600 dark:text-emerald-400">₱{fmtCurrency(c.totalSpent)}</span>
                      </td>
                      {/* Tier */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: `${tierCfg.accent}18`, color: tierCfg.accent }}
                        >
                          {tierCfg.label}
                        </span>
                      </td>
                      {/* Join Date */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-slate-500 dark:text-slate-400">
                          <Calendar size={11} className="flex-shrink-0" />
                          <span className="text-[12px] font-mono">{fmtDate(c.joinDate)}</span>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setPointsTarget(c); setPointsDelta(''); setPointsOpen(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                            title="Adjust Points"
                          >
                            <Award size={13} />
                          </button>
                          <button
                            onClick={() => { setEditingCustomer(c); setCustomerFormOpen(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => printCard(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/5 dark:hover:bg-brand/10 transition-all"
                            title="Print"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            onClick={() => { setDeleteTarget(c); setDeleteOpen(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                            title="Delete"
                          >
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
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-slate-300 dark:text-slate-600">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-brand cursor-pointer"
                >
                  {(viewMode === 'table' ? [15, 30, 50] : [12, 24, 48]).map((s) => (
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
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-4">
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
  const [generating, setGenerating] = useState(false);
  const [points, setPoints] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  // Auto-generate NFC tag for new customers
  useEffect(() => {
    if (open && !customer) {
      setName(''); setPhone(''); setPoints(0); setTotalSpent(0);
      setGenerating(true);
      setNfcTag('');
      get<{ data: { nfc_tag: string } }>('/customers/generate-nfc')
        .then((res) => setNfcTag(res.data.nfc_tag))
        .catch(() => {
          const rand = Array.from({ length: 8 }, () =>
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36))
          ).join('');
          setNfcTag(`NFC-${rand}`);
        })
        .finally(() => setGenerating(false));
    } else if (open && customer) {
      setGenerating(false);
      setName(customer.name);
      setPhone(customer.phone);
      setNfcTag(customer.nfcTag);
      setPoints(customer.points);
      setTotalSpent(customer.totalSpent);
    }
  }, [open, customer]);

  function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      showToast('Please fill in Name and Phone', 'error');
      return;
    }
    if (!isEdit && generating) {
      showToast('Please wait for NFC tag to generate', 'error');
      return;
    }
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      nfcTag: (nfcTag || '').trim() || `NFC-${String(Math.floor(100000 + Math.random() * 900000))}`,
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
            <div className="relative">
              <input
                type="text"
                value={nfcTag}
                onChange={(e) => setNfcTag(e.target.value)}
                placeholder={generating ? 'Generating...' : 'Auto-generated'}
                readOnly
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-100 dark:bg-slate-800 outline-none dark:border-slate-600 dark:text-slate-400 text-slate-500 cursor-not-allowed pr-9"
              />
              {generating && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-4 w-4 text-brand" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400">System-generated unique ID · auto-assigned</p>
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
