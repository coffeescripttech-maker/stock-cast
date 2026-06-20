//RUIZ STORE POS — JAVASCRIPT v4
 
const ACCOUNTS = {
  admin: { password: 'admin123', role: 'owner', name: 'Store Owner' },
  staff: { password: 'staff123', role: 'staff', name: 'Store Staff' }
};

const CATEGORIES = ['Beverage', 'Food', 'Snacks', 'Dairy', 'Household', 'Personal Care', 'Frozen', 'Others'];

const CATEGORY_COLORS = {
  'Beverage':      { bg:'#dbeafe', color:'#1d4ed8' },
  'Food':          { bg:'#dcfce7', color:'#15803d' },
  'Snacks':        { bg:'#fef9c3', color:'#a16207' },
  'Dairy':         { bg:'#f0fdf4', color:'#166534' },
  'Household':     { bg:'#f3e8ff', color:'#7e22ce' },
  'Personal Care': { bg:'#ffe4e6', color:'#be123c' },
  'Frozen':        { bg:'#e0f2fe', color:'#0369a1' },
  'Others':        { bg:'#f1f5f9', color:'#475569' }
};

let currentUser         = null;
let cart                = [];
let lastReceipt         = null;
let weeklyChart         = null;
let reportChart         = null;
let searchSelectedIdx   = -1;
let searchResults       = [];
let posLinkedCustomer   = null;
let posRedeemPoints     = 0;
let currentReportTab    = 'transactions';
let currentReportFilter = 'week';
let dashDateInterval    = null;
let receiptIsShowing    = false;
let invCategoryFilter   = 'All';

//  PERSIST 
function loadData() {
  try { const d = localStorage.getItem('ruizpos_data'); return d ? JSON.parse(d) : null; }
  catch (e) { return null; }
}
function saveData() {
  localStorage.setItem('ruizpos_data', JSON.stringify({ products, transactions, customers, auditLog, rewardsConfig }));
}

//  DEFAULTS 
const defaultProducts = [
  { id:1, retailBarcode:'1234567890', wholesaleBarcode:'2234567890', name:'Coca Cola 350ml',        retailPrice:25,   wholesalePrice:240, retailStock:100, wholesaleStock:12, defaultType:'ws', category:'Beverage' },
  { id:2, retailBarcode:'1234567898', wholesaleBarcode:'2234567898', name:'Pringles Original',      retailPrice:85,   wholesalePrice:70,  retailStock:10,  wholesaleStock:30, defaultType:'rt', category:'Snacks'   },
  { id:3, retailBarcode:'1234567892', wholesaleBarcode:'2234567892', name:'Nestle Coffee 3-in-1',   retailPrice:8.50, wholesalePrice:7,   retailStock:163, wholesaleStock:10, defaultType:'rt', category:'Beverage' },
  { id:4, retailBarcode:'1234567893', wholesaleBarcode:'2234567893', name:'Lucky Me Pancit Canton', retailPrice:15,   wholesalePrice:12,  retailStock:150, wholesaleStock:3,  defaultType:'rt', category:'Food'     },
  { id:5, retailBarcode:'33',         wholesaleBarcode:'2200000033', name:'Sky Flakes Crackers',    retailPrice:30,   wholesalePrice:25,  retailStock:5,   wholesaleStock:33, defaultType:'rt', category:'Snacks'   }
];

const defaultTransactions = [
  { id:'20260318-0001', date:new Date(Date.now()-13*60000).toISOString(), cashier:'Store Owner', items:[{name:'Coca Cola 350ml',qty:12,type:'ws',price:240}], total:2880, rawTotal:2880, discount:0, type:'ws', status:'completed', amountTendered:3000, change:120 },
  { id:'20260318-0002', date:new Date(Date.now()-13*60000).toISOString(), cashier:'Store Owner', items:[{name:'Lucky Me Pancit Canton',qty:25,type:'ws',price:12}], total:6000, rawTotal:6000, discount:0, type:'ws', status:'completed', amountTendered:6000, change:0 },
  { id:'20260318-0003', date:new Date(Date.now()-7*60000).toISOString(),  cashier:'Store Owner', items:[{name:'Pringles Original',qty:2,type:'rt',price:85},{name:'Coca Cola 350ml',qty:97,type:'ws',price:42}], total:4162, rawTotal:4162, discount:0, type:'mixed', status:'completed', amountTendered:4200, change:38 },
  { id:'20260318-0004', date:new Date(Date.now()-6*60000).toISOString(),  cashier:'Store Owner', items:[{name:'Nestle Coffee 3-in-1',qty:1,type:'rt',price:8.5}], total:8.5, rawTotal:8.5, discount:0, type:'rt', status:'completed', amountTendered:10, change:1.5 },
  { id:'20260318-0005', date:new Date(Date.now()-1*60000).toISOString(),  cashier:'Store Staff', items:[{name:'Coca Cola 350ml',qty:1,type:'ws',price:240}], total:240, rawTotal:240, discount:0, type:'ws', status:'completed', amountTendered:250, change:10 }
];

const defaultCustomers = [
  { id:1, name:'Maria Santos',   phone:'09171234567', nfcTag:'NFC-001234', points:580,  totalSpent:5800,  joinDate:new Date(Date.now()-30*86400000).toISOString() },
  { id:2, name:'Juan dela Cruz', phone:'09281234567', nfcTag:'NFC-002345', points:2100, totalSpent:21000, joinDate:new Date(Date.now()-60*86400000).toISOString() },
  { id:3, name:'Ana Reyes',      phone:'09391234567', nfcTag:'NFC-003456', points:250,  totalSpent:2500,  joinDate:new Date(Date.now()-15*86400000).toISOString() }
];

const defaultRewardsConfig = { earnRate:10, redeemEvery:100, redeemValue:10, bronzeMin:0, silverMin:500, goldMin:2000 };

let { products, transactions, customers, auditLog, rewardsConfig } = (() => {
  const d = loadData();
  let prods = d?.products || defaultProducts;
  prods = prods.map(p => {
    if (p.barcode && !p.retailBarcode) p = { ...p, retailBarcode:p.barcode, wholesaleBarcode:'22'+p.barcode.slice(2), barcode:undefined };
    if (!p.category) p = { ...p, category:'Others' };
    return p;
  });
  return {
    products:      prods,
    transactions:  d?.transactions  || defaultTransactions,
    customers:     d?.customers     || defaultCustomers,
    auditLog:      d?.auditLog      || [],
    rewardsConfig: d?.rewardsConfig || { ...defaultRewardsConfig }
  };
})();

//  TX ID 
function generateTxId() {
  const now = new Date();
  const dateKey = now.toISOString().slice(0,10).replace(/-/g,'');
  const todayCount = transactions.filter(t => String(t.id).startsWith(dateKey)).length;
  return `${dateKey}-${String(todayCount+1).padStart(4,'0')}`;
}


//  DARK MODE

function initTheme() {
  const saved = localStorage.getItem('ruizpos_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ruizpos_theme', next);
  updateThemeIcon(next);
  if (weeklyChart) renderDashboard();
  if (reportChart) renderReports();
}
function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggle'); if (!btn) return;
  btn.innerHTML = theme === 'dark'
    ? `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
  btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}


//  AUDIT

function logAudit(action, details) {
  auditLog.unshift({ id:Date.now()+Math.random(), timestamp:new Date().toISOString(), user:currentUser?.name||'System', role:currentUser?.role||'system', action, details });
  if (auditLog.length > 500) auditLog = auditLog.slice(0,500);
  saveData();
}


//  AUTH

function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const acc = ACCOUNTS[u];
  if (acc && acc.password === p) {
    currentUser = { username:u, ...acc };
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('app').style.flexDirection = 'column';
    logAudit('LOGIN', `${currentUser.name} (${currentUser.role}) signed in`);
    initApp();
    document.getElementById('loginError').style.display = 'none';
  } else { document.getElementById('loginError').style.display = 'block'; }
}
function doLogout() {
  logAudit('LOGOUT', `${currentUser?.name} signed out`);
  currentUser = null; cart = []; posLinkedCustomer = null; posRedeemPoints = 0; receiptIsShowing = false;
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  if (weeklyChart) { weeklyChart.destroy(); weeklyChart = null; }
  if (reportChart) { reportChart.destroy(); reportChart = null; }
  if (dashDateInterval) { clearInterval(dashDateInterval); dashDateInterval = null; }
}
document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key==='Enter') doLogin(); });
document.getElementById('loginUser').addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('loginPass').focus(); });


//  APP INIT

function initApp() {
  const isOwner = currentUser.role === 'owner';
  document.getElementById('navUser').textContent = currentUser.name;
  const rb = document.getElementById('navRole');
  rb.textContent = isOwner ? 'Owner' : 'Staff';
  rb.className = 'role-badge ' + (isOwner ? 'owner' : 'staff');
  document.getElementById('cashierName').textContent = currentUser.name;
  updateThemeIcon(document.documentElement.getAttribute('data-theme') || 'light');

  const tabs = isOwner ? [
    { id:'Dashboard',    label:'Dashboard',    icon:'<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
    { id:'POS',          label:'Point of Sale', icon:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-8.43H6"/>' },
    { id:'Inventory',    label:'Inventory',     icon:'<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>' },
    { id:'Transactions', label:'Transactions',  icon:'<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' },
    { id:'Rewards',      label:'Rewards',       icon:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
    { id:'Reports',      label:'Reports',       icon:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
    { id:'Audit',        label:'Audit Trail',   icon:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' }
  ] : [
    { id:'POS',     label:'Point of Sale', icon:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-8.43H6"/>' },
    { id:'Rewards', label:'Rewards',       icon:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' }
  ];
  document.getElementById('navTabs').innerHTML = tabs.map(t => `
    <button class="nav-tab" data-page="${t.id}" onclick="showPage('${t.id}')">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">${t.icon}</svg>
      ${t.label}
    </button>`).join('');
  showPage(isOwner ? 'Dashboard' : 'POS');
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.page === name));
  document.getElementById('page'+name).classList.add('active');
  if      (name==='Dashboard')    renderDashboard();
  else if (name==='Inventory')    renderInventory();
  else if (name==='Transactions') renderTransactions();
  else if (name==='POS')          renderCart();
  else if (name==='Rewards')      renderRewards();
  else if (name==='Reports')      renderReports();
  else if (name==='Audit')        renderAuditTrail();
}


//  DASHBOARD

function fmtNow() { return new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }); }

function renderDashboard() {
  const today      = transactions.filter(t => new Date(t.date).toDateString()===new Date().toDateString());
  const todaySales = today.reduce((s,t)=>s+t.total,0);
  const rtLow      = products.filter(p=>p.retailStock<=10);
  const wsLow      = products.filter(p=>p.wholesaleStock<=30);

  document.getElementById('dashStats').innerHTML = `
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Today's Sales</span><div class="stat-icon" style="background:#d1fae5"><svg width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div></div><div class="stat-value">₱${todaySales.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div class="stat-sub" id="dashLiveDate">${fmtNow()}</div></div>
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Retail Low Stock</span><div class="stat-icon" style="background:#fee2e2"><svg width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div></div><div class="stat-value" style="color:#ef4444">${rtLow.length}</div><div class="stat-sub">≤ 10 units</div></div>
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Wholesale Low Stock</span><div class="stat-icon" style="background:#fef3c7"><svg width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div></div><div class="stat-value" style="color:#f59e0b">${wsLow.length}</div><div class="stat-sub">≤ 30 units</div></div>
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Transactions Today</span><div class="stat-icon" style="background:#dbeafe"><svg width="16" height="16" fill="none" stroke="#3b82f6" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-8.43H6"/></svg></div></div><div class="stat-value">${today.length}</div><div class="stat-sub">Completed sales</div></div>
  `;
  if (dashDateInterval) clearInterval(dashDateInterval);
  dashDateInterval = setInterval(() => { const el=document.getElementById('dashLiveDate'); if(el) el.textContent=fmtNow(); }, 60000);

  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const gridColor=isDark?'#334155':'#e2e8f0', tickColor=isDark?'#64748b':'#94a3b8';
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const now=new Date();
  const weekData=days.map((d,i)=>{ const dt=new Date(now); dt.setDate(dt.getDate()-now.getDay()+1+i); const dayTx=transactions.filter(t=>new Date(t.date).toDateString()===dt.toDateString()); return dayTx.reduce((s,t)=>s+t.total,0)||(i<now.getDay()?Math.floor(Math.random()*8000)+3000:0); });
  if (weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(document.getElementById('weeklyChart').getContext('2d'), {
    type:'bar', data:{ labels:days, datasets:[{ data:weekData, backgroundColor:'#4f46e5', borderRadius:8, borderSkipped:false }] },
    options:{ plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, border:{ dash:[4,4], display:false }, grid:{ color:gridColor }, ticks:{ color:tickColor, font:{ size:12, family:"'DM Sans',sans-serif" }, callback:v=>v.toLocaleString() } }, x:{ grid:{ display:false }, border:{ display:false }, ticks:{ color:tickColor, font:{ size:12, family:"'DM Sans',sans-serif" } } } }, responsive:true, maintainAspectRatio:false, layout:{ padding:{ top:8 } } }
  });
  renderAlertCard('retailAlerts', rtLow, 'rt');
  renderAlertCard('wholesaleAlerts', wsLow, 'ws');
  const sortedTx = [...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  document.getElementById('recentTx').innerHTML = `<h3>Recent Transactions</h3><p>Latest sales with sale type breakdown</p>
    ${sortedTx.map(t=>`<div class="tx-list-item"><div><div class="tx-amount">₱${t.total.toLocaleString('en-PH',{minimumFractionDigits:2})}</div><div class="tx-info">${fmtDate(t.date)} · ${t.cashier}</div></div><div class="tx-right">${typeBadge(t.type)}<span class="status-badge">${t.status}</span></div></div>`).join('')}
    <button class="view-all-btn" onclick="showPage('Transactions')">View All Transactions</button>`;
}

function renderAlertCard(id, lowItems, type) {
  const isWS=type==='ws', el=document.getElementById(id);
  el.innerHTML = `
    <div class="alert-card-header"><div class="alert-card-title"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM20.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>${isWS?'📦 Wholesale Stock Alerts':'🛒 Retail Stock Alerts'}</div><span class="alert-count-badge ${isWS?'orange':'red'}">${lowItems.length} items</span></div>
    <div class="alert-subtitle"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${isWS?'AI bulk order guidance · ≤30 units':'AI-powered reorder recommendations · ≤10 units'}</div>
    ${lowItems.map(p=>{
      const stock=isWS?p.wholesaleStock:p.retailStock, threshold=isWS?30:10;
      const isCritical=stock<=(isWS?5:3), reorderQty=Math.ceil((threshold*5)-stock+(isWS?50:30));
      const aiMsg=isWS?(stock<5?'Critically insufficient. Emergency bulk restock required.':stock<12?'Cannot fulfill standard wholesale orders. Consider supplier negotiation.':'Stock below wholesale buffer. Reorder to fulfil bulk customer demand.'):(stock<3?'Critically low for retail. Schedule reorder within 24–48 hrs.':'Approaching retail minimum. Reorder to maintain shelf availability.');
      const days=stock>0?`~${Math.max(1,Math.round(stock/3))} day${Math.round(stock/3)>1?'s':''}` :'No sales data';
      return `<div class="alert-item ${isCritical?'critical':'warning'}">
        <div class="alert-item-header"><span class="alert-item-name">${p.name}</span><span class="alert-item-stock ${isCritical?'critical':'warning'}">${stock} ${isWS?'WS':'RT'} left</span></div>
        <div class="alert-meta">₱${isWS?p.wholesalePrice:p.retailPrice} ${isWS?'WS':'retail'} · Category: ${p.category||'Others'}</div>
        <div class="alert-stats">
          <div class="alert-stat-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><div><div class="alert-stat-label">Est. Days Left</div><div class="alert-stat-value">${days}</div></div></div>
          <div class="alert-stat-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg><div><div class="alert-stat-label">Reorder Qty</div><div class="alert-stat-value">${reorderQty} units</div></div></div>
        </div>
        <div class="alert-ai-msg ${isCritical?'red':'yellow'}"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 16v-4M12 8h.01"/></svg><span>AI: ${aiMsg}</span></div>
      </div>`;
    }).join('')}
    <button class="alert-manage-btn" onclick="showPage('Inventory')">Manage Inventory</button>`;
}

//  POINT OF SALE

function handlePOSSearchInput() {
  const q=document.getElementById('posSearch').value.trim().toLowerCase();
  const resEl=document.getElementById('posSearchResults');
  if (!q) { resEl.style.display='none'; searchResults=[]; searchSelectedIdx=-1; return; }
  searchResults=[];
  products.forEach(p=>{
    const nm=p.name.toLowerCase().includes(q), rm=p.retailBarcode&&p.retailBarcode.toLowerCase().includes(q), wm=p.wholesaleBarcode&&p.wholesaleBarcode.toLowerCase().includes(q);
    if      (rm) searchResults.push({...p,_matchType:'rt'});
    else if (wm) searchResults.push({...p,_matchType:'ws'});
    else if (nm) searchResults.push({...p,_matchType:p.defaultType});
  });
  if (!searchResults.length) { resEl.style.display='none'; return; }
  resEl.style.display='block'; searchSelectedIdx=-1;
  resEl.innerHTML=searchResults.map((p,i)=>{
    const isWS=p._matchType==='ws', bc=isWS?p.wholesaleBarcode:p.retailBarcode;
    return `<div class="search-result-item" data-idx="${i}" onclick="addToCartTyped(${p.id},'${p._matchType}')">
      <div><div class="sri-name">${p.name} <span class="default-badge ${p._matchType}">${p._matchType.toUpperCase()}</span></div><div class="sri-bc">${bc}</div></div>
      <div class="sri-right"><div class="sri-price">${isWS?`₱${p.wholesalePrice}`:`₱${p.retailPrice}`}</div><div class="sri-stock">RT:${p.retailStock} WS:${p.wholesaleStock}</div></div>
    </div>`;
  }).join('');
}

function handlePOSSearch(e) {
  const resEl=document.getElementById('posSearchResults'); const items=resEl.querySelectorAll('.search-result-item');
  if (e.key==='ArrowDown') { searchSelectedIdx=Math.min(searchSelectedIdx+1,items.length-1); highlightSearch(items); e.preventDefault(); }
  else if (e.key==='ArrowUp') { searchSelectedIdx=Math.max(searchSelectedIdx-1,0); highlightSearch(items); e.preventDefault(); }
  else if (e.key==='Enter') {
    if (searchSelectedIdx>=0&&searchResults[searchSelectedIdx]) { const sr=searchResults[searchSelectedIdx]; addToCartTyped(sr.id,sr._matchType); }
    else if (searchResults.length===1) { const sr=searchResults[0]; addToCartTyped(sr.id,sr._matchType); }
    else { const q=document.getElementById('posSearch').value.trim(); const rm=products.find(p=>p.retailBarcode===q); const wm=products.find(p=>p.wholesaleBarcode===q); if(rm)addToCartTyped(rm.id,'rt'); else if(wm)addToCartTyped(wm.id,'ws'); }
  }
}
function highlightSearch(items) { items.forEach((el,i)=>el.style.background=i===searchSelectedIdx?'var(--surface2)':''); }

function addToCartTyped(productId, type) {
  const p=products.find(x=>x.id===productId); if(!p) return;
  document.getElementById('posSearch').value=''; document.getElementById('posSearchResults').style.display='none';
  searchResults=[]; searchSelectedIdx=-1;
  const existing=cart.find(c=>c.productId===productId&&c.type===type);
  if (existing) existing.qty++;
  else cart.push({ productId, name:p.name, type, qty:1, price:type==='ws'?p.wholesalePrice:p.retailPrice });
  renderCart(); document.getElementById('posSearch').focus();
  showToast(`Added ${p.name} (${type.toUpperCase()})`, 'success');
}
function addToCart(productId) { addToCartTyped(productId, products.find(x=>x.id===productId)?.defaultType||'rt'); }

function renderCart() {
  const el=document.getElementById('cartItems');
  const totalUnits=cart.reduce((s,c)=>s+c.qty,0);
  const rawTotal=cart.reduce((s,c)=>s+c.qty*c.price,0);
  const discount=posRedeemPoints>0?Math.floor(posRedeemPoints/rewardsConfig.redeemEvery)*rewardsConfig.redeemValue:0;
  const grandTotal=Math.max(0,rawTotal-discount);

  document.getElementById('cartCount').textContent=`${cart.length} line${cart.length!==1?'s':''} · ${totalUnits} unit${totalUnits!==1?'s':''}`;
  document.getElementById('summaryUnits').textContent=totalUnits;

  const hasWS=cart.some(c=>c.type==='ws');
  const btnLabel=cart.length===0?'Complete Retail Sale':(hasWS?(cart.every(c=>c.type==='ws')?'Complete Wholesale Sale':'Complete Mixed Sale'):'Complete Retail Sale');
  const checkoutBtn=document.getElementById('checkoutBtn');
  checkoutBtn.innerHTML=`<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>${btnLabel} <kbd style="font-family:'Space Mono',monospace;font-size:11px;background:rgba(255,255,255,.2);padding:1px 6px;border-radius:4px">F8</kbd>`;
  checkoutBtn.disabled=cart.length===0;

  const summTotalEl=document.getElementById('summaryTotal');
  if (discount>0) summTotalEl.innerHTML=`<span style="text-decoration:line-through;color:var(--text3);font-size:14px">₱${rawTotal.toFixed(2)}</span> <span style="color:var(--green)">₱${grandTotal.toFixed(2)}</span>`;
  else summTotalEl.textContent=`₱${grandTotal.toFixed(2)}`;

  const tier=posLinkedCustomer?getCustomerTier(posLinkedCustomer.points):null;
  const earned=Math.floor(grandTotal/rewardsConfig.earnRate);
  document.getElementById('posCustomerSection').innerHTML=posLinkedCustomer?`
    <div class="pos-customer-linked">
      <div class="pos-customer-linked-header">
        <div><div class="pos-customer-name"><span class="tier-dot tier-${tier.key}"></span>${posLinkedCustomer.name}</div>
        <div class="pos-customer-meta">${posLinkedCustomer.phone} · ${posLinkedCustomer.points} pts · <span class="tier-badge-sm tier-${tier.key}">${tier.label}</span></div></div>
        <button class="pos-customer-unlink" onclick="unlinkCustomer()">✕</button>
      </div>
      <div class="pos-customer-points-row">
        <div class="pos-points-box green"><div class="pos-points-label">Will earn</div><div class="pos-points-val">+${earned} pts</div></div>
        ${posLinkedCustomer.points>=rewardsConfig.redeemEvery?`
        <div class="pos-points-box ${posRedeemPoints>0?'brand active':'muted'}" onclick="toggleRedeem()" style="cursor:pointer">
          <div class="pos-points-label">${posRedeemPoints>0?'Redeeming':'Redeem pts'}</div>
          <div class="pos-points-val">${posRedeemPoints>0?`-₱${discount}`:`${posLinkedCustomer.points} pts`}</div>
        </div>`:`<div class="pos-points-box muted"><div class="pos-points-label">Need ${rewardsConfig.redeemEvery}+ pts</div><div class="pos-points-val">to redeem</div></div>`}
      </div>
    </div>
  `:`<button class="pos-nfc-btn" onclick="openNFCLink()">
    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
    Tap NFC / Link Customer <kbd style="font-family:'Space Mono',monospace;font-size:10px;background:var(--bg);padding:1px 5px;border-radius:4px">F11</kbd>
  </button>`;

  if (!cart.length) { el.innerHTML=`<div class="cart-empty"><svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-8.43H6"/></svg><p>Cart is empty</p><span>Search a product or scan a barcode above</span></div>`; return; }
  el.innerHTML=cart.map((item,i)=>`
    <div class="cart-item">
      <div class="cart-item-info"><div class="cart-item-name">${item.name}</div><div class="cart-item-price">₱${item.price.toFixed(2)} / ${item.type==='ws'?'case':'pc'}</div></div>
      <div class="type-toggle"><button class="type-btn ${item.type==='rt'?'active-rt':''}" onclick="toggleCartType(${i},'rt')">RT</button><button class="type-btn ${item.type==='ws'?'active-ws':''}" onclick="toggleCartType(${i},'ws')">WS</button></div>
      <div class="cart-item-controls"><button class="qty-btn" onclick="changeQty(${i},-1)">−</button><span class="qty-val">${item.qty}</span><button class="qty-btn" onclick="changeQty(${i},1)">+</button></div>
      <div class="cart-item-total">₱${(item.qty*item.price).toFixed(2)}</div>
      <button class="remove-btn" onclick="removeCartItem(${i})"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>`).join('');
}
function toggleCartType(idx,type) { const item=cart[idx],p=products.find(x=>x.id===item.productId); item.type=type; item.price=type==='ws'?p.wholesalePrice:p.retailPrice; renderCart(); }
function changeQty(idx,delta) { cart[idx].qty=Math.max(1,cart[idx].qty+delta); renderCart(); }
function removeCartItem(idx) { cart.splice(idx,1); renderCart(); }
function clearCart() { cart=[]; posLinkedCustomer=null; posRedeemPoints=0; renderCart(); }

//  NFC 
function openNFCLink() {
  openModal(`
    <div class="modal-title">Link Customer via NFC</div>
    <div class="modal-subtitle">Tap NFC tag or enter phone / NFC tag ID <kbd style="font-family:'Space Mono',monospace;background:var(--surface2);padding:2px 6px;border-radius:4px;font-size:11px;border:1px solid var(--border)">F11</kbd></div>
    <div class="nfc-scan-area"><div class="nfc-rings"><div class="nfc-ring r1"></div><div class="nfc-ring r2"></div><div class="nfc-ring r3"></div></div>
      <svg width="36" height="36" fill="none" stroke="var(--brand)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      <p style="font-size:13px;color:var(--text2);margin-top:10px">Waiting for NFC tap…</p>
    </div>
    <div class="form-group" style="margin-top:16px"><label>Or enter Phone / NFC Tag ID manually</label><input type="text" id="nfcInput" placeholder="e.g. 09171234567 or NFC-001234" autofocus></div>
    <div class="modal-footer"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="processNFCLink()">Link Customer</button></div>
  `,null,true);
  setTimeout(()=>document.getElementById('nfcInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')processNFCLink();}),100);
}
function processNFCLink() {
  const input=document.getElementById('nfcInput').value.trim();
  const found=customers.find(c=>c.nfcTag===input||c.phone===input||c.name.toLowerCase()===input.toLowerCase());
  if (!found) { showToast('Customer not found. Check NFC tag or phone number.','error'); return; }
  posLinkedCustomer=found; posRedeemPoints=0; closeModal(); renderCart();
  showToast(`Linked: ${found.name} (${found.points} pts)`,'success');
}
function unlinkCustomer() { posLinkedCustomer=null; posRedeemPoints=0; renderCart(); }
function toggleRedeem() {
  if (!posLinkedCustomer||posLinkedCustomer.points<rewardsConfig.redeemEvery) return;
  posRedeemPoints=posRedeemPoints>0?0:Math.floor(posLinkedCustomer.points/rewardsConfig.redeemEvery)*rewardsConfig.redeemEvery;
  renderCart();
}

//  CHECKOUT & PAYMENT FLOW 
function processCheckout() {
  if (!cart.length) return;
  const rawTotal = cart.reduce((s,c) => s+c.qty*c.price, 0);
  const discount = posRedeemPoints>0 ? Math.floor(posRedeemPoints/rewardsConfig.redeemEvery)*rewardsConfig.redeemValue : 0;
  const total    = Math.max(0, rawTotal-discount);
  openPaymentModal(total);
}

function openPaymentModal(total) {
  openModal(`
    <div class="modal-title">💳 Collect Payment</div>
    <div class="payment-due-box">
      <div class="payment-due-label">Total Amount Due</div>
      <div class="payment-due-amount">₱${total.toLocaleString('en-PH',{minimumFractionDigits:2})}</div>
    </div>
    <div class="form-group" style="margin-top:20px">
      <label>Cash Received from Customer (₱)</label>
      <input type="number" id="paymentInput" placeholder="0.00" step="0.01" min="0" autofocus
        style="font-size:22px;font-family:'Space Mono',monospace;font-weight:700;text-align:right;padding:14px;letter-spacing:.04em">
    </div>
    <div class="payment-change-row" id="paymentChangeRow" style="display:none">
      <div class="payment-change-section">
        <span class="payment-change-label">Change</span>
        <span class="payment-change-amount" id="paymentChangeAmt">₱0.00</span>
      </div>
    </div>
    <div class="payment-error" id="paymentError" style="display:none">⚠ Amount is less than the total due</div>
    <div class="payment-hint" id="paymentHint">Enter amount · Press <kbd>Enter</kbd> to confirm</div>
    <div class="modal-footer">
      <button class="btn-cancel" onclick="closeModal()">Cancel</button>
      <button class="btn-save" id="paymentConfirmBtn" onclick="confirmPayment(${total})" disabled style="background:var(--green);min-width:160px">
        ✓ Complete Sale
      </button>
    </div>
  `,null,true);

  setTimeout(() => {
    const inp = document.getElementById('paymentInput');
    if (!inp) return;
    inp.focus();

    const update = () => {
      const amt = parseFloat(inp.value) || 0;
      const changeRow = document.getElementById('paymentChangeRow');
      const changeEl  = document.getElementById('paymentChangeAmt');
      const errEl     = document.getElementById('paymentError');
      const hintEl    = document.getElementById('paymentHint');
      const btn       = document.getElementById('paymentConfirmBtn');

      if (!inp.value || amt === 0) {
        changeRow.style.display = 'none';
        errEl.style.display     = 'none';
        hintEl.textContent      = 'Enter amount · Press Enter to confirm';
        btn.disabled = true;
      } else if (amt < total) {
        changeRow.style.display = 'none';
        errEl.style.display     = 'flex';
        hintEl.textContent      = `Short by ₱${(total-amt).toFixed(2)}`;
        btn.disabled = true;
      } else {
        const change = amt - total;
        changeEl.textContent    = `₱${change.toLocaleString('en-PH',{minimumFractionDigits:2})}`;
        changeRow.style.display = 'flex';
        errEl.style.display     = 'none';
        hintEl.textContent      = 'Press Enter to complete sale';
        btn.disabled = false;
      }
    };

    inp.addEventListener('input', update);
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const amt = parseFloat(inp.value) || 0;
        if (amt >= total) confirmPayment(total);
      }
    });
  }, 60);
}

function confirmPayment(total) {
  const inp = document.getElementById('paymentInput');
  const amountTendered = parseFloat(inp?.value) || 0;
  if (amountTendered < total) { showToast('Amount received is less than total due','error'); return; }
  const change = amountTendered - total;
  finalizeSale(amountTendered, change);
}

function finalizeSale(amountTendered, change) {
  const rawTotal = cart.reduce((s,c)=>s+c.qty*c.price,0);
  const discount = posRedeemPoints>0?Math.floor(posRedeemPoints/rewardsConfig.redeemEvery)*rewardsConfig.redeemValue:0;
  const total    = Math.max(0, rawTotal-discount);
  const types    = [...new Set(cart.map(c=>c.type))];
  const txType   = types.length>1?'mixed':types[0];
  const earned   = Math.floor(total/rewardsConfig.earnRate);

  const tx = {
    id:generateTxId(), date:new Date().toISOString(), cashier:currentUser.name,
    items:cart.map(c=>({name:c.name,qty:c.qty,type:c.type,price:c.price})),
    total, rawTotal, discount, type:txType, status:'completed',
    customerId:posLinkedCustomer?.id||null, customerName:posLinkedCustomer?.name||null,
    pointsEarned:earned, pointsRedeemed:posRedeemPoints,
    amountTendered, change
  };

  cart.forEach(c=>{ const p=products.find(x=>x.id===c.productId); if(p){ if(c.type==='ws')p.wholesaleStock=Math.max(0,p.wholesaleStock-c.qty); else p.retailStock=Math.max(0,p.retailStock-c.qty); } });
  if (posLinkedCustomer) { const cust=customers.find(c=>c.id===posLinkedCustomer.id); if(cust){ cust.points=cust.points-posRedeemPoints+earned; cust.totalSpent=(cust.totalSpent||0)+total; } }

  transactions.unshift(tx); lastReceipt=tx;
  logAudit('SALE_COMPLETED',`Tx ${tx.id} · ₱${total.toFixed(2)} · ${txType.toUpperCase()} · ${currentUser.name}${posLinkedCustomer?' · Customer: '+posLinkedCustomer.name:''}`);
  saveData();
  cart=[]; posLinkedCustomer=null; posRedeemPoints=0;
  closeModal();
  showReceiptModal(tx, true); // true = print-mode (Enter to print)
  renderCart();
  showToast('Sale completed! Press Enter to print receipt.','success');
}

function printLastReceipt() { if(!lastReceipt){showToast('No receipt to print','info');return;} showReceiptModal(lastReceipt, false); }

function showReceiptModal(tx, printMode=false) {
  receiptIsShowing = printMode;
  const rtItems=tx.items.filter(i=>i.type==='rt'), wsItems=tx.items.filter(i=>i.type==='ws');
  const rtSubtotal=rtItems.reduce((s,i)=>s+i.qty*i.price,0), wsSubtotal=wsItems.reduce((s,i)=>s+i.qty*i.price,0);
  const totalItems=tx.items.reduce((s,i)=>s+i.qty,0);
  const typeLabelMap={rt:'RETAIL',ws:'WHOLESALE',mixed:'MIXED (Retail + Wholesale)'};
  const typeBgMap={rt:'#4f46e5',ws:'#f59e0b',mixed:'#4f46e5'};
  const dash='------------------------------------------------';

  openModal(`
    <div class="receipt">
      <div class="receipt-header"><h3 style="font-size:18px;letter-spacing:.15em;font-weight:700">RUIZ STORE</h3><p style="margin-top:4px;color:var(--text2)">Point of Sale Receipt</p></div>
      <div class="receipt-dash">${dash}</div>
      <div class="receipt-meta">
        <div class="receipt-meta-row"><span>Date:</span><span>${fmtDate(tx.date)}</span></div>
        <div class="receipt-meta-row"><span>Cashier:</span><span>${tx.cashier}</span></div>
        <div class="receipt-meta-row"><span>Txn #:</span><span style="font-family:'Space Mono',monospace">${tx.id}</span></div>
        ${tx.customerName?`<div class="receipt-meta-row"><span>Customer:</span><span>${tx.customerName}</span></div>`:''}
        <div class="receipt-meta-row" style="align-items:center"><span>Type:</span><span style="background:${typeBgMap[tx.type]||'#4f46e5'};color:white;padding:2px 10px;border-radius:5px;font-size:11px;font-weight:700">${typeLabelMap[tx.type]||tx.type.toUpperCase()}</span></div>
      </div>
      <div class="receipt-dash">${dash}</div>
      <div class="receipt-items-header"><span style="flex:1">Item</span><span style="width:30px;text-align:center">Qty</span><span style="width:70px;text-align:right">Price</span><span style="width:70px;text-align:right">Total</span></div>
      <div class="receipt-dash" style="margin-bottom:6px">${dash}</div>
      ${tx.items.map(i=>{
        const badge=i.type==='ws'?`<span style="background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:4px;font-size:9px;font-weight:700;vertical-align:middle">WS</span>`:`<span style="background:#d1fae5;color:#065f46;padding:1px 5px;border-radius:4px;font-size:9px;font-weight:700;vertical-align:middle">RT</span>`;
        return `<div class="receipt-item-row"><span style="flex:1">${i.name} ${badge}</span><span style="width:30px;text-align:center">${i.qty}</span><span style="width:70px;text-align:right">₱${i.price.toFixed(2)}</span><span style="width:70px;text-align:right">₱${(i.qty*i.price).toFixed(2)}</span></div>`;
      }).join('')}
      <div class="receipt-dash" style="margin-top:8px">${dash}</div>
      ${rtItems.length?`<div class="receipt-subtotal-row"><span>🛒 Retail subtotal:</span><span>₱${rtSubtotal.toFixed(2)}</span></div>`:''}
      ${wsItems.length?`<div class="receipt-subtotal-row"><span>📦 Wholesale subtotal:</span><span>₱${wsSubtotal.toFixed(2)}</span></div>`:''}
      ${tx.discount>0?`<div class="receipt-subtotal-row" style="color:var(--green)"><span>🎁 Points redemption (${tx.pointsRedeemed} pts):</span><span>-₱${tx.discount.toFixed(2)}</span></div>`:''}
      <div class="receipt-dash">${dash}</div>
      <div class="receipt-subtotal-row" style="margin-bottom:6px"><span>Total items:</span><span>${totalItems}</span></div>
      <div class="receipt-grand-total"><span>GRAND TOTAL</span><span>₱${tx.total.toFixed(2)}</span></div>
      ${tx.amountTendered!=null?`
      <div class="receipt-dash" style="border-top:1px dashed var(--border)">${dash}</div>
      <div class="receipt-payment-row"><span>Cash Tendered:</span><span>₱${(tx.amountTendered||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div>
      <div class="receipt-payment-row receipt-change-row"><span>Change:</span><span>₱${(tx.change||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</span></div>
      `:''}
      ${tx.pointsEarned>0?`<div style="text-align:center;font-size:11px;color:var(--brand);margin-top:6px;font-family:'Space Mono',monospace">★ +${tx.pointsEarned} points earned for ${tx.customerName}</div>`:''}
      <div class="receipt-dash">${dash}</div>
      <div class="receipt-footer"><p>Thank you for shopping at</p><p style="font-weight:700">Ruiz Store!</p><p style="margin-top:6px">Please come again 🙂</p></div>
    </div>
    ${printMode?`<div class="receipt-print-hint">Press <kbd>Enter</kbd> to print &amp; clear for next customer</div>`:''}
    <button class="btn-print-receipt" id="receiptPrintBtn" onclick="doPrintAndClose()">🖨️ Print Receipt</button>
  `,'Receipt');
}

function doPrintAndClose() {
  receiptIsShowing = false;
  window.print();
  closeModal();
}

//  SCANNER 
function showScannerModal() {
  openModal(`
    <div class="modal-title">Barcode Scanner</div>
    <div class="modal-subtitle">Use a physical scanner or enter barcode manually</div>
    <div class="scanner-area"><div class="scanner-line"></div>
      <svg width="48" height="48" fill="none" stroke="var(--brand)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3M15 5h3a1 1 0 011 1v3M15 19h3a1 1 0 001-1v-3"/><line x1="7" y1="8" x2="7" y2="16"/><line x1="10" y1="8" x2="10" y2="16"/><line x1="13" y1="8" x2="13" y2="12"/><line x1="16" y1="8" x2="16" y2="12"/></svg>
      <p style="font-size:12.5px;color:var(--text2);margin-top:10px">Ready to scan</p>
    </div>
    <div class="form-group" style="margin-top:16px"><label>Barcode</label>
      <input type="text" id="scannerInput" placeholder="Scan barcode or type manually…" autofocus style="font-family:'Space Mono',monospace;font-size:15px;letter-spacing:.08em">
    </div>
    <div class="modal-footer"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="processScannerInput()">Add to Cart</button></div>
  `,null,true);
  setTimeout(()=>{ const inp=document.getElementById('scannerInput'); if(inp)inp.addEventListener('keydown',e=>{if(e.key==='Enter')processScannerInput();}); },100);
}
function processScannerInput() {
  const bc=document.getElementById('scannerInput').value.trim();
  const rm=products.find(p=>p.retailBarcode===bc), wm=products.find(p=>p.wholesaleBarcode===bc);
  if      (rm) { closeModal(); addToCartTyped(rm.id,'rt'); }
  else if (wm) { closeModal(); addToCartTyped(wm.id,'ws'); }
  else showToast('Product not found: '+bc,'error');
}


//  INVENTORY

function renderInventory() {
  const rtLow=products.filter(p=>p.retailStock<=10).length, wsLow=products.filter(p=>p.wholesaleStock<=30).length;
  const totalVal=products.reduce((s,p)=>s+p.retailStock*p.retailPrice+p.wholesaleStock*p.wholesalePrice,0);
  document.getElementById('invStats').innerHTML=`
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Total Products</span><div class="stat-icon" style="background:#dbeafe"><svg width="16" height="16" fill="none" stroke="#3b82f6" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg></div></div><div class="stat-value">${products.length}</div></div>
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Retail Low Stock</span><div class="stat-icon" style="background:#fee2e2"><svg width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div></div><div class="stat-value" style="color:#ef4444">${rtLow}</div><div class="stat-sub">≤ 10 units</div></div>
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Wholesale Low Stock</span><div class="stat-icon" style="background:#fef3c7"><svg width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div></div><div class="stat-value" style="color:#f59e0b">${wsLow}</div><div class="stat-sub">≤ 30 units</div></div>
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Total Stock Value</span><div class="stat-icon" style="background:#d1fae5"><svg width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v6l4 2"/></svg></div></div><div class="stat-value" style="font-size:20px">₱${Math.round(totalVal).toLocaleString()}</div></div>
  `;

  // Category filter bar
  const allCategories = ['All', ...CATEGORIES.filter(cat => products.some(p => (p.category||'Others')===cat))];
  document.getElementById('invCategoryFilter').innerHTML = allCategories.map(cat => `
    <button class="cat-filter-btn ${invCategoryFilter===cat?'active':''}" onclick="setInvCategory('${cat}')">
      ${cat==='All'?'All Products':`${cat} (${products.filter(p=>(p.category||'Others')===cat).length})`}
    </button>`).join('');

  const q = document.getElementById('invSearch')?.value.toLowerCase()||'';
  const filtered = products.filter(p => {
    const matchQ = p.name.toLowerCase().includes(q)||(p.retailBarcode&&p.retailBarcode.toLowerCase().includes(q))||(p.wholesaleBarcode&&p.wholesaleBarcode.toLowerCase().includes(q));
    const matchCat = invCategoryFilter==='All'||(p.category||'Others')===invCategoryFilter;
    return matchQ && matchCat;
  });

  document.getElementById('invBody').innerHTML=filtered.map(p=>{
    const rf=p.retailStock<=10, wf=p.wholesaleStock<=30;
    let sc,sp; if(rf&&wf){sc='low-both';sp='Low (RT+WS)';}else if(rf){sc='low-retail';sp='Low Retail';}else if(wf){sc='low-ws';sp='Low Wholesale';}else{sc='ok';sp='In Stock';}
    const cat = p.category||'Others', catC = CATEGORY_COLORS[cat]||CATEGORY_COLORS['Others'];
    return `<tr>
      <td>
        <div style="margin-bottom:6px"><div style="font-size:10px;font-weight:700;color:var(--green);margin-bottom:2px">RT</div><div class="barcode-visual">${generateBarcodeHTML()}</div><div class="barcode-img">${p.retailBarcode||'—'}</div></div>
        <div><div style="font-size:10px;font-weight:700;color:#d97706;margin-bottom:2px">WS</div><div class="barcode-visual">${generateBarcodeHTML()}</div><div class="barcode-img">${p.wholesaleBarcode||'—'}</div></div>
      </td>
      <td><strong>${p.name}</strong><br><span class="cat-badge" style="background:${catC.bg};color:${catC.color}">${cat}</span></td>
      <td>₱${p.retailPrice.toFixed(2)}</td><td class="price-ws">₱${p.wholesalePrice.toFixed(2)}</td>
      <td class="${rf?'stock-low':'stock-ok'}">${p.retailStock}</td><td class="${wf?'stock-low':'stock-ok'}">${p.wholesaleStock}</td>
      <td><span class="status-pill ${sc}">${sp}</span></td>
      <td><div class="action-btns">
        <button class="action-btn bar"  onclick="showBarcode(${p.id})"     title="Barcode"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3M15 5h3a1 1 0 011 1v3M15 19h3a1 1 0 001-1v-3"/><line x1="7" y1="8" x2="7" y2="16"/><line x1="10" y1="8" x2="10" y2="16"/><line x1="13" y1="8" x2="13" y2="12"/><line x1="16" y1="8" x2="16" y2="12"/></svg></button>
        <button class="action-btn edit" onclick="openEditProduct(${p.id})" title="Edit"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="action-btn del"  onclick="deleteProduct(${p.id})"  title="Delete"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
}

function setInvCategory(cat) { invCategoryFilter=cat; renderInventory(); }

function generateBarcodeHTML() {
  const pattern=[3,1,2,1,3,2,1,3,1,2,1,1,2,3,1,2,3,1,1,2];
  return `<div class="barcode-lines">${pattern.map((w,i)=>i%2===0?`<span style="width:${w*1.5}px"></span>`:`<span style="background:transparent;width:${w*1.5}px"></span>`).join('')}</div>`;
}

function categorySelect(selectedVal='') {
  return `<select id="fCategory" style="width:100%;padding:10px 13px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:13.5px;font-family:inherit;outline:none;background:var(--surface2)">
    ${CATEGORIES.map(c=>`<option value="${c}" ${c===selectedVal?'selected':''}>${c}</option>`).join('')}
  </select>`;
}

function openAddProduct() {
  openModal(`
    <div class="modal-title">Add New Product</div><div class="modal-subtitle">Fill in product details.</div>
    <div class="modal-form-row">
      <div class="form-group" style="grid-column:1/-1"><label>Product Name</label><input type="text" id="fName" placeholder="Product name"></div>
    </div>
    <div class="form-group"><label>Category</label>${categorySelect('Beverage')}</div>
    <div class="modal-form-row">
      <div class="form-group"><label style="color:var(--green)">🛒 Retail Barcode</label><div class="scan-btn-row"><input type="text" id="fRtBarcode" placeholder="e.g. 1234567890" oninput="updateBarcodePreview('fRtBarcode','fRtBP')"><button class="btn-scan" style="border-color:var(--green);color:var(--green)" onclick="simulateScan('fRtBarcode','fRtBP')"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="14" y1="3" x2="14" y2="21"/></svg>Scan</button></div><div class="modal-barcode-preview" id="fRtBP" style="border-color:var(--green)">${generateBarcodeHTML()}</div></div>
      <div class="form-group"><label style="color:#d97706">📦 Wholesale Barcode</label><div class="scan-btn-row"><input type="text" id="fWsBarcode" placeholder="e.g. 2234567890" oninput="updateBarcodePreview('fWsBarcode','fWsBP')"><button class="btn-scan" style="border-color:#f59e0b;color:#d97706" onclick="simulateScan('fWsBarcode','fWsBP')"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="14" y1="3" x2="14" y2="21"/></svg>Scan</button></div><div class="modal-barcode-preview" id="fWsBP" style="border-color:#f59e0b">${generateBarcodeHTML()}</div></div>
    </div>
    <div class="modal-form-row">
      <div class="form-group"><label>🛒 Retail Price (₱)</label><input type="number" id="fRtPrice" placeholder="0.00" step="0.01"></div>
      <div class="form-group"><label>📦 Wholesale Price (₱)</label><input type="number" id="fWsPrice" placeholder="0.00" step="0.01"></div>
    </div>
    <div class="modal-form-row">
      <div class="form-group"><label>Retail Stock</label><input type="number" id="fRtStock" placeholder="0"><div class="modal-hint">Alert at ≤10</div></div>
      <div class="form-group"><label>Wholesale Stock</label><input type="number" id="fWsStock" placeholder="0"><div class="modal-hint">Alert at ≤30</div></div>
    </div>
    <div class="modal-footer"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveAddProduct()">Add Product</button></div>
  `,null,true);
}
function updateBarcodePreview(fId,pId) { const v=document.getElementById(fId)?.value,el=document.getElementById(pId); if(el)el.innerHTML=`${generateBarcodeHTML()}<div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);margin-top:4px">${v||''}</div>`; }
function simulateScan(fId,pId) { const code=String(Math.floor(1000000000+Math.random()*9000000000)); document.getElementById(fId).value=code; if(pId)updateBarcodePreview(fId,pId); showToast('Barcode simulated: '+code,'info'); }
function saveAddProduct() {
  const rtB=document.getElementById('fRtBarcode').value.trim(), wsB=document.getElementById('fWsBarcode').value.trim(), name=document.getElementById('fName').value.trim();
  const rtP=parseFloat(document.getElementById('fRtPrice').value)||0, wsP=parseFloat(document.getElementById('fWsPrice').value)||0;
  const rtS=parseInt(document.getElementById('fRtStock').value)||0, wsS=parseInt(document.getElementById('fWsStock').value)||0;
  const cat=document.getElementById('fCategory')?.value||'Others';
  if (!rtB||!name||!rtP) { showToast('Please fill in Retail Barcode, Name, and Retail Price','error'); return; }
  if (products.find(p=>p.retailBarcode===rtB||p.wholesaleBarcode===rtB)) { showToast('Retail barcode already in use','error'); return; }
  if (wsB&&products.find(p=>p.retailBarcode===wsB||p.wholesaleBarcode===wsB)) { showToast('Wholesale barcode already in use','error'); return; }
  products.push({id:Date.now(),retailBarcode:rtB,wholesaleBarcode:wsB,name,retailPrice:rtP,wholesalePrice:wsP,retailStock:rtS,wholesaleStock:wsS,defaultType:'rt',category:cat});
  logAudit('PRODUCT_ADDED',`Added: "${name}" (${cat}, RT: ${rtB})`);
  saveData(); closeModal(); renderInventory(); showToast(`"${name}" added successfully`,'success');
}
function openEditProduct(id) {
  const p=products.find(x=>x.id===id); if(!p) return;
  openModal(`
    <div class="modal-title">Edit Product</div><div class="modal-subtitle">Update product information.</div>
    <div class="form-group"><label>Product Name</label><input type="text" id="eName" value="${p.name}"></div>
    <div class="form-group"><label>Category</label>${categorySelect(p.category||'Others').replace('id="fCategory"','id="eCategory"')}</div>
    <div class="modal-form-row">
      <div class="form-group"><label style="color:var(--green)">🛒 Retail Barcode</label><div class="scan-btn-row"><input type="text" id="eRtBarcode" value="${p.retailBarcode||''}" oninput="updateBarcodePreview('eRtBarcode','eRtBP')"><button class="btn-scan" style="border-color:var(--green);color:var(--green)" onclick="simulateScan('eRtBarcode','eRtBP')"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="14" y1="3" x2="14" y2="21"/></svg>Scan</button></div><div class="modal-barcode-preview" id="eRtBP" style="border-color:var(--green)">${generateBarcodeHTML()}<div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);margin-top:4px">${p.retailBarcode||''}</div></div></div>
      <div class="form-group"><label style="color:#d97706">📦 Wholesale Barcode</label><div class="scan-btn-row"><input type="text" id="eWsBarcode" value="${p.wholesaleBarcode||''}" oninput="updateBarcodePreview('eWsBarcode','eWsBP')"><button class="btn-scan" style="border-color:#f59e0b;color:#d97706" onclick="simulateScan('eWsBarcode','eWsBP')"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="14" y1="3" x2="14" y2="21"/></svg>Scan</button></div><div class="modal-barcode-preview" id="eWsBP" style="border-color:#f59e0b">${generateBarcodeHTML()}<div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);margin-top:4px">${p.wholesaleBarcode||''}</div></div></div>
    </div>
    <div class="modal-form-row">
      <div class="form-group"><label>Retail Price (₱)</label><input type="number" id="eRtPrice" value="${p.retailPrice}" step="0.01"></div>
      <div class="form-group"><label>Wholesale Price (₱)</label><input type="number" id="eWsPrice" value="${p.wholesalePrice}" step="0.01"></div>
    </div>
    <div class="modal-form-row">
      <div class="form-group"><label>Retail Stock</label><input type="number" id="eRtStock" value="${p.retailStock}"><div class="modal-hint">Alert at ≤10</div></div>
      <div class="form-group"><label>Wholesale Stock</label><input type="number" id="eWsStock" value="${p.wholesaleStock}"><div class="modal-hint">Alert at ≤30</div></div>
    </div>
    <div class="modal-footer"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveEditProduct(${id})">Save Changes</button></div>
  `,null,true);
}
function saveEditProduct(id) {
  const p=products.find(x=>x.id===id);
  p.retailBarcode=document.getElementById('eRtBarcode').value.trim(); p.wholesaleBarcode=document.getElementById('eWsBarcode').value.trim();
  p.name=document.getElementById('eName').value.trim(); p.retailPrice=parseFloat(document.getElementById('eRtPrice').value)||0;
  p.wholesalePrice=parseFloat(document.getElementById('eWsPrice').value)||0; p.retailStock=parseInt(document.getElementById('eRtStock').value)||0;
  p.wholesaleStock=parseInt(document.getElementById('eWsStock').value)||0; p.defaultType=p.retailBarcode?'rt':'ws';
  p.category=document.getElementById('eCategory')?.value||p.category||'Others';
  logAudit('PRODUCT_EDITED',`Edited: "${p.name}" (${p.category})`); saveData(); closeModal(); renderInventory(); showToast(`"${p.name}" updated`,'success');
}
function deleteProduct(id) {
  const p=products.find(x=>x.id===id);
  openModal(`<div style="text-align:center;padding:20px 10px"><div style="width:56px;height:56px;background:var(--red-bg);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px"><svg width="26" height="26" fill="none" stroke="#ef4444" stroke-width="2.2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></div><div class="modal-title">Delete Product?</div><div class="modal-subtitle">Permanently remove <strong>${p.name}</strong> from inventory.</div><div class="modal-footer" style="justify-content:center;margin-top:20px"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" style="background:var(--red)" onclick="confirmDelete(${id})">Delete</button></div></div>`,null,true);
}
function confirmDelete(id) { const p=products.find(x=>x.id===id); logAudit('PRODUCT_DELETED',`Deleted: "${p.name}"`); products=products.filter(x=>x.id!==id); saveData(); closeModal(); renderInventory(); showToast(`"${p.name}" deleted`,'error'); }
function showBarcode(id) {
  const p=products.find(x=>x.id===id);
  openModal(`<div class="modal-title" style="text-align:center">${p.name}</div><div class="modal-subtitle" style="text-align:center">Retail &amp; Wholesale Barcodes</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0">
      <div style="border:1.5px solid var(--green);border-radius:10px;padding:16px;text-align:center;background:#f0fdf4"><div style="font-size:11px;font-weight:700;color:var(--green);margin-bottom:10px">🛒 RETAIL</div><div style="transform:scale(1.2);transform-origin:center;margin:14px 0 20px">${generateBarcodeHTML()}</div><div style="font-family:'Space Mono',monospace;font-size:12px;font-weight:700">${p.retailBarcode||'—'}</div><div style="font-size:11.5px;color:var(--text2);margin-top:4px">₱${p.retailPrice}/pc</div></div>
      <div style="border:1.5px solid #f59e0b;border-radius:10px;padding:16px;text-align:center;background:#fffbeb"><div style="font-size:11px;font-weight:700;color:#d97706;margin-bottom:10px">📦 WHOLESALE</div><div style="transform:scale(1.2);transform-origin:center;margin:14px 0 20px">${generateBarcodeHTML()}</div><div style="font-family:'Space Mono',monospace;font-size:12px;font-weight:700">${p.wholesaleBarcode||'—'}</div><div style="font-size:11.5px;color:var(--text2);margin-top:4px">₱${p.wholesalePrice}/case</div></div>
    </div>
    <div class="modal-footer"><button class="btn-cancel" onclick="closeModal()">Close</button><button class="btn-save" onclick="window.print()">Print Barcodes</button></div>`,null,true);
}

//  TRANSACTIONS

function renderTransactions() {
  const today=transactions.filter(t=>new Date(t.date).toDateString()===new Date().toDateString());
  const todaySales=today.reduce((s,t)=>s+t.total,0);
  document.getElementById('txStats').innerHTML=`
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Today's Sales</span></div><div class="stat-value" style="font-size:22px">₱${todaySales.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Today's Transactions</span></div><div class="stat-value">${today.length}</div></div>
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Total Transactions</span></div><div class="stat-value">${transactions.length}</div></div>
  `;
  document.getElementById('txBody').innerHTML=transactions.map(t=>`
    <tr class="tx-row">
      <td class="tx-id">${t.id}</td>
      <td><div>${new Date(t.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div><div style="font-size:12px;color:var(--text2)">${new Date(t.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div></td>
      <td>${t.cashier}</td>
      <td>${t.items.reduce((s,i)=>s+i.qty,0)}</td>
      <td><strong>₱${t.total.toLocaleString('en-PH',{minimumFractionDigits:2})}</strong></td>
      <td>${typeBadge(t.type)}<span class="status-badge" style="margin-left:6px">${t.status}</span></td>
      <td><div style="display:flex;gap:6px">
        <button class="action-btn" onclick="viewTxDetail('${t.id}')" title="View" style="color:var(--brand)"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button class="action-btn del" onclick="voidTx('${t.id}')" title="Void"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></button>
      </div></td>
    </tr>`).join('');
}
function viewTxDetail(id) {
  const t=transactions.find(x=>x.id===id);
  openModal(`<div class="modal-title">Transaction ${t.id}</div><div class="modal-subtitle">${fmtDate(t.date)} · ${t.cashier} · ${typeBadge(t.type)}</div>
    ${t.items.map(i=>`<div class="tx-detail-item"><span>${i.name} <span class="default-badge ${i.type}" style="font-size:11px">${i.type.toUpperCase()}</span> × ${i.qty}</span><span>₱${(i.qty*i.price).toFixed(2)}</span></div>`).join('')}
    ${t.discount>0?`<div class="tx-detail-item" style="color:var(--green)"><span>🎁 Points Discount (${t.pointsRedeemed} pts)</span><span>-₱${t.discount.toFixed(2)}</span></div>`:''}
    <div style="display:flex;justify-content:space-between;padding:14px 0;font-size:16px;font-weight:800;border-top:2px solid var(--text);margin-top:8px"><span>Total</span><span>₱${t.total.toFixed(2)}</span></div>
    ${t.amountTendered!=null?`<div class="tx-detail-item" style="color:var(--text2)"><span>Cash Tendered</span><span>₱${(t.amountTendered||0).toFixed(2)}</span></div><div class="tx-detail-item" style="font-weight:700"><span>Change</span><span>₱${(t.change||0).toFixed(2)}</span></div>`:''}
    ${t.customerName?`<div style="font-size:12.5px;color:var(--text2);text-align:center;padding:8px;background:var(--surface2);border-radius:8px;margin-top:8px">👤 ${t.customerName} · +${t.pointsEarned} pts earned</div>`:''}
    <div class="modal-footer"><button class="btn-cancel" onclick="closeModal()">Close</button><button class="btn-save" onclick="showReceiptModal(transactions.find(x=>x.id==='${t.id}'),false);closeModal()">View Receipt</button></div>`,null,true);
}
function voidTx(id) {
  openModal(`<div style="text-align:center;padding:16px 10px"><div style="width:52px;height:52px;background:var(--red-bg);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px"><svg width="24" height="24" fill="none" stroke="#ef4444" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><div class="modal-title">Void Transaction?</div><div class="modal-subtitle">Transaction ${id} will be removed from records.</div><div class="modal-footer" style="justify-content:center;margin-top:16px"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" style="background:var(--red)" onclick="confirmVoid('${id}')">Void</button></div></div>`,null,true);
}
function confirmVoid(id) { logAudit('TRANSACTION_VOID',`Voided Tx ${id}`); transactions=transactions.filter(t=>t.id!==id); saveData(); closeModal(); renderTransactions(); showToast('Transaction voided','info'); }


//  REWARDS

function getCustomerTier(points) {
  if (points>=rewardsConfig.goldMin)   return {key:'gold',   label:'🥇 Gold',   color:'#f59e0b', bg:'#fef3c7'};
  if (points>=rewardsConfig.silverMin) return {key:'silver', label:'🥈 Silver', color:'#64748b', bg:'#f1f5f9'};
  return                                      {key:'bronze', label:'🥉 Bronze', color:'#b45309', bg:'#fef9ec'};
}

function renderRewards() {
  const totalPoints=customers.reduce((s,c)=>s+c.points,0);
  const gold=customers.filter(c=>c.points>=rewardsConfig.goldMin).length;
  const silver=customers.filter(c=>c.points>=rewardsConfig.silverMin&&c.points<rewardsConfig.goldMin).length;
  const isOwner = currentUser.role === 'owner';

  // Show/hide Points Logic button only (Register Customer always visible)
  const plBtn = document.getElementById('pointsLogicBtn');
  if (plBtn) plBtn.style.display = isOwner ? 'flex' : 'none';

  document.getElementById('rewardStats').innerHTML=`
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Total Customers</span></div><div class="stat-value">${customers.length}</div></div>
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Total Points Issued</span></div><div class="stat-value">${totalPoints.toLocaleString()}</div><div class="stat-sub">pts outstanding</div></div>
    <div class="stat-card"><div class="stat-header"><span class="stat-label">Gold Members</span></div><div class="stat-value" style="color:#ca8a04">${gold}</div><div class="stat-sub">≥ ${rewardsConfig.goldMin} pts</div></div>
    ${isOwner
      ? `<div class="stat-card"><div class="stat-header"><span class="stat-label">Points Logic</span></div><div class="stat-value" style="font-size:13px;line-height:1.6">₱${rewardsConfig.earnRate} = 1pt<br>${rewardsConfig.redeemEvery}pt = ₱${rewardsConfig.redeemValue}</div><div class="stat-sub"><button onclick="openPointsLogicEditor()" style="background:none;border:none;color:var(--brand);font-size:11px;cursor:pointer;font-weight:700;font-family:inherit;padding:0">⚙ Edit Logic</button></div></div>`
      : `<div class="stat-card"><div class="stat-header"><span class="stat-label">Silver Members</span></div><div class="stat-value" style="color:#64748b">${silver}</div><div class="stat-sub">${rewardsConfig.silverMin}–${rewardsConfig.goldMin-1} pts</div></div>`}
  `;
  const q=document.getElementById('rewardSearch')?.value.toLowerCase()||'';
  const filtered=customers.filter(c=>c.name.toLowerCase().includes(q)||c.phone.includes(q)||c.nfcTag.toLowerCase().includes(q));
  document.getElementById('rewardBody').innerHTML=filtered.map(c=>{
    const tier=getCustomerTier(c.points);
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div style="width:34px;height:34px;background:${tier.bg};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${tier.label.split(' ')[0]}</div><div><div style="font-weight:700;font-size:13.5px">${c.name}</div><div style="font-size:12px;color:var(--text2)">${c.phone}</div></div></div></td>
      <td><code style="font-size:12px;background:var(--surface2);padding:3px 8px;border-radius:5px;font-family:'Space Mono',monospace">${c.nfcTag}</code></td>
      <td><span style="font-weight:700;font-size:15px;color:var(--brand)">${c.points.toLocaleString()}</span> <span style="font-size:12px;color:var(--text2)">pts</span></td>
      <td><span style="background:${tier.bg};color:${tier.color};padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700">${tier.label}</span></td>
      <td>₱${(c.totalSpent||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
      <td>${new Date(c.joinDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
      <td><div class="action-btns">
        ${isOwner?`
        <button class="action-btn edit" onclick="openEditCustomer(${c.id})" title="Edit"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="action-btn" onclick="openAdjustPoints(${c.id})" title="Adjust Points" style="color:var(--brand)"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>
        <button class="action-btn del" onclick="deleteCustomer(${c.id})" title="Delete"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>
        `:`<span style="font-size:12px;color:var(--text3);font-style:italic">View only</span>`}
      </div></td>
    </tr>`;
  }).join('');
}

function openPointsLogicEditor() {
  if (currentUser.role!=='owner') { showToast('Only the owner can edit the points logic.','error'); return; }
  openModal(`
    <div class="modal-title">⚙️ Points Logic Settings</div>
    <div class="modal-subtitle">Configure how points are earned and redeemed</div>
    <div class="points-logic-grid">
      <div class="points-logic-section"><div class="points-logic-label">💰 EARNING POINTS</div><div class="form-group"><label>Pesos per 1 Point</label><input type="number" id="plEarnRate" value="${rewardsConfig.earnRate}" min="1" step="1"><div class="modal-hint">Customer earns 1 point for every ₱X spent</div></div></div>
      <div class="points-logic-section"><div class="points-logic-label">🎁 REDEEMING POINTS</div><div class="form-group"><label>Points per Redemption Block</label><input type="number" id="plRedeemEvery" value="${rewardsConfig.redeemEvery}" min="1" step="1"><div class="modal-hint">Minimum points needed to redeem</div></div><div class="form-group"><label>₱ Discount per Block</label><input type="number" id="plRedeemValue" value="${rewardsConfig.redeemValue}" min="1" step="1"><div class="modal-hint">Peso discount per redemption block</div></div></div>
      <div class="points-logic-section"><div class="points-logic-label">🏅 TIER THRESHOLDS</div><div class="form-group"><label>🥈 Silver starts at (pts)</label><input type="number" id="plSilverMin" value="${rewardsConfig.silverMin}" min="1" step="1"></div><div class="form-group"><label>🥇 Gold starts at (pts)</label><input type="number" id="plGoldMin" value="${rewardsConfig.goldMin}" min="1" step="1"></div></div>
    </div>
    <div class="points-logic-preview" id="plPreview"></div>
    <div class="modal-footer"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="savePointsLogic()">Save Settings</button></div>
  `,null,true);
  updatePointsPreview();
  ['plEarnRate','plRedeemEvery','plRedeemValue','plSilverMin','plGoldMin'].forEach(id=>{ document.getElementById(id)?.addEventListener('input',updatePointsPreview); });
}
function updatePointsPreview() {
  const er=parseInt(document.getElementById('plEarnRate')?.value)||10, re=parseInt(document.getElementById('plRedeemEvery')?.value)||100, rv=parseInt(document.getElementById('plRedeemValue')?.value)||10, sm=parseInt(document.getElementById('plSilverMin')?.value)||500, gm=parseInt(document.getElementById('plGoldMin')?.value)||2000;
  const el=document.getElementById('plPreview');
  if(el) el.innerHTML=`<div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Live Preview</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px"><div style="background:var(--surface2);border-radius:8px;padding:10px"><div style="color:var(--text2);font-size:11px;margin-bottom:4px">Spend ₱1,000 → earn</div><div style="font-weight:700;color:var(--brand)">${Math.floor(1000/er)} points</div></div><div style="background:var(--surface2);border-radius:8px;padding:10px"><div style="color:var(--text2);font-size:11px;margin-bottom:4px">${re} points → save</div><div style="font-weight:700;color:var(--green)">₱${rv} discount</div></div><div style="background:#f0fdf4;border-radius:8px;padding:10px;border:1px solid #86efac"><div style="color:var(--text2);font-size:11px;margin-bottom:4px">🥈 Silver tier</div><div style="font-weight:700">${sm.toLocaleString()}+ pts</div></div><div style="background:#fef9c3;border-radius:8px;padding:10px;border:1px solid #fde047"><div style="color:var(--text2);font-size:11px;margin-bottom:4px">🥇 Gold tier</div><div style="font-weight:700">${gm.toLocaleString()}+ pts</div></div></div>`;
}
function savePointsLogic() {
  rewardsConfig.earnRate=parseInt(document.getElementById('plEarnRate').value)||10; rewardsConfig.redeemEvery=parseInt(document.getElementById('plRedeemEvery').value)||100; rewardsConfig.redeemValue=parseInt(document.getElementById('plRedeemValue').value)||10; rewardsConfig.silverMin=parseInt(document.getElementById('plSilverMin').value)||500; rewardsConfig.goldMin=parseInt(document.getElementById('plGoldMin').value)||2000;
  logAudit('REWARDS_CONFIG_UPDATED',`Earn: ₱${rewardsConfig.earnRate}=1pt · Redeem: ${rewardsConfig.redeemEvery}pt=₱${rewardsConfig.redeemValue} · Tiers: ${rewardsConfig.silverMin}/${rewardsConfig.goldMin}`);
  saveData(); closeModal(); renderRewards(); showToast('Points logic updated successfully','success');
}
function openAddCustomer() {
  const nfcTag='NFC-'+String(Math.floor(100000+Math.random()*900000));
  openModal(`
    <div class="modal-title">Register New Customer</div><div class="modal-subtitle">Set up NFC-based loyalty account</div>
    <div class="nfc-register-area"><div class="nfc-rings"><div class="nfc-ring r1"></div><div class="nfc-ring r2"></div><div class="nfc-ring r3"></div></div>
      <svg width="32" height="32" fill="none" stroke="var(--brand)" stroke-width="1.8" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      <p style="font-size:12px;color:var(--text2);margin-top:8px">NFC Tag: <strong style="font-family:'Space Mono',monospace">${nfcTag}</strong></p>
    </div>
    <div class="form-group"><label>Full Name</label><input type="text" id="cName" placeholder="Customer full name"></div>
    <div class="form-group"><label>Phone Number</label><input type="text" id="cPhone" placeholder="e.g. 09171234567"></div>
    <div class="form-group"><label>NFC Tag ID</label><input type="text" id="cNfc" value="${nfcTag}"></div>
    <div class="form-group"><label>Starting Points</label><input type="number" id="cPoints" value="0" min="0"></div>
    <div class="modal-footer"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveAddCustomer()">Register Customer</button></div>
  `,null,true);
}
function saveAddCustomer() {
  const name=document.getElementById('cName').value.trim(), phone=document.getElementById('cPhone').value.trim(), nfcTag=document.getElementById('cNfc').value.trim(), points=parseInt(document.getElementById('cPoints').value)||0;
  if (!name||!phone) { showToast('Please fill in name and phone','error'); return; }
  if (customers.find(c=>c.phone===phone)) { showToast('Phone number already registered','error'); return; }
  customers.push({id:Date.now(),name,phone,nfcTag,points,totalSpent:0,joinDate:new Date().toISOString()});
  logAudit('CUSTOMER_REGISTERED',`Registered: "${name}" (${phone}, ${nfcTag})`);
  saveData(); closeModal(); renderRewards(); showToast(`${name} registered successfully`,'success');
}
function openEditCustomer(id) {
  if (currentUser.role!=='owner') { showToast('Only the owner can edit customer information.','error'); return; }
  const c=customers.find(x=>x.id===id); if(!c) return;
  openModal(`<div class="modal-title">Edit Customer</div><div class="modal-subtitle">Update customer information</div>
    <div class="form-group"><label>Full Name</label><input type="text" id="ecName" value="${c.name}"></div>
    <div class="form-group"><label>Phone Number</label><input type="text" id="ecPhone" value="${c.phone}"></div>
    <div class="form-group"><label>NFC Tag ID</label><input type="text" id="ecNfc" value="${c.nfcTag}"></div>
    <div class="modal-footer"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveEditCustomer(${id})">Save Changes</button></div>`,null,true);
}
function saveEditCustomer(id) { const c=customers.find(x=>x.id===id); c.name=document.getElementById('ecName').value.trim(); c.phone=document.getElementById('ecPhone').value.trim(); c.nfcTag=document.getElementById('ecNfc').value.trim(); logAudit('CUSTOMER_EDITED',`Edited: "${c.name}"`); saveData(); closeModal(); renderRewards(); showToast(`${c.name} updated`,'success'); }
function deleteCustomer(id) {
  if (currentUser.role!=='owner') { showToast('Only the owner can remove customers.','error'); return; }
  const c=customers.find(x=>x.id===id);
  openModal(`<div style="text-align:center;padding:16px 10px"><div style="width:52px;height:52px;background:var(--red-bg);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px"><svg width="24" height="24" fill="none" stroke="#ef4444" stroke-width="2.2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div class="modal-title">Remove Customer?</div><div class="modal-subtitle">Permanently remove <strong>${c.name}</strong> and their loyalty data.</div><div class="modal-footer" style="justify-content:center;margin-top:16px"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" style="background:var(--red)" onclick="confirmDeleteCustomer(${id})">Remove</button></div></div>`,null,true);
}
function confirmDeleteCustomer(id) { const c=customers.find(x=>x.id===id); logAudit('CUSTOMER_DELETED',`Deleted: "${c.name}"`); customers=customers.filter(x=>x.id!==id); saveData(); closeModal(); renderRewards(); showToast(`${c.name} removed`,'error'); }
function openAdjustPoints(id) {
  if (currentUser.role!=='owner') { showToast('Only the owner can adjust customer points.','error'); return; }
  const c=customers.find(x=>x.id===id);
  openModal(`<div class="modal-title">Adjust Points</div><div class="modal-subtitle">${c.name} · Current: <strong>${c.points} pts</strong></div>
    <div class="form-group"><label>Adjustment (negative to deduct)</label><input type="number" id="adjPoints" placeholder="e.g. +50 or -100"></div>
    <div class="form-group"><label>Reason</label><input type="text" id="adjReason" placeholder="e.g. Promo bonus, Manual correction"></div>
    <div class="modal-footer"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="savePointsAdjust(${id})">Apply</button></div>`,null,true);
}
function savePointsAdjust(id) { const c=customers.find(x=>x.id===id),adj=parseInt(document.getElementById('adjPoints').value)||0,rsn=document.getElementById('adjReason').value.trim()||'Manual adjustment'; c.points=Math.max(0,c.points+adj); logAudit('POINTS_ADJUSTED',`${c.name}: ${adj>0?'+':''}${adj} pts — ${rsn}`); saveData(); closeModal(); renderRewards(); showToast(`Points adjusted: ${adj>0?'+':''}${adj} pts`,'success'); }


//  REPORTS

function renderReports() {
  if (currentReportTab==='transactions') renderTransactionReport();
  else                                   renderInventoryReport();
  document.querySelectorAll('.report-tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===currentReportTab));
  document.querySelectorAll('.report-filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.filter===currentReportFilter));
  const fg=document.getElementById('reportFilterGroup'); if(fg) fg.style.display=currentReportTab==='transactions'?'flex':'none';
}
function switchReportTab(tab) { currentReportTab=tab; renderReports(); }
function setReportFilter(f)   { currentReportFilter=f; renderReports(); }
function getFilteredTransactions() {
  const now=new Date();
  if (currentReportFilter==='week')  { const s=new Date(now); s.setDate(s.getDate()-6); s.setHours(0,0,0,0); return transactions.filter(t=>new Date(t.date)>=s); }
  if (currentReportFilter==='month') return transactions.filter(t=>new Date(t.date)>=new Date(now.getFullYear(),now.getMonth(),1));
  return transactions;
}
function exportTransactionsExcel() {
  const filtered=getFilteredTransactions();
  const header=['Txn ID','Date','Time','Cashier','Type','Items','Raw Total','Discount','Total','Cash Tendered','Change','Customer','Points Earned','Points Redeemed'];
  const rows=filtered.map(t=>[t.id,new Date(t.date).toLocaleDateString('en-US'),new Date(t.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),t.cashier,t.type.toUpperCase(),t.items.reduce((s,i)=>s+i.qty,0),t.rawTotal||t.total,t.discount||0,t.total,t.amountTendered||0,t.change||0,t.customerName||'—',t.pointsEarned||0,t.pointsRedeemed||0]);
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Transactions');
  const label=currentReportFilter==='week'?'Week':currentReportFilter==='month'?'Month':'All';
  XLSX.writeFile(wb,`RuizStore_Transactions_${label}_${new Date().toISOString().slice(0,10)}.xlsx`);
  logAudit('REPORT_EXPORT',`Exported Transaction Report (${label}) to Excel`); showToast('Excel file downloaded','success');
}
function exportInventoryExcel() {
  const header=['Product','Category','RT Barcode','WS Barcode','RT Price','WS Price','RT Stock','WS Stock','RT Value','WS Value','Status'];
  const rows=products.map(p=>{ const rf=p.retailStock<=10,wf=p.wholesaleStock<=30; const status=rf&&wf?'Low (RT+WS)':rf?'Low Retail':wf?'Low Wholesale':'In Stock'; return [p.name,p.category||'Others',p.retailBarcode||'',p.wholesaleBarcode||'',p.retailPrice,p.wholesalePrice,p.retailStock,p.wholesaleStock,p.retailStock*p.retailPrice,p.wholesaleStock*p.wholesalePrice,status]; });
  const totalsRow=['TOTAL','','','','','','','',(products.reduce((s,p)=>s+p.retailStock*p.retailPrice,0)).toFixed(2),(products.reduce((s,p)=>s+p.wholesaleStock*p.wholesalePrice,0)).toFixed(2),''];
  const ws=XLSX.utils.aoa_to_sheet([header,...rows,totalsRow]); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Inventory');
  XLSX.writeFile(wb,`RuizStore_Inventory_${new Date().toISOString().slice(0,10)}.xlsx`);
  logAudit('REPORT_EXPORT','Exported Inventory Report to Excel'); showToast('Excel file downloaded','success');
}
function renderTransactionReport() {
  const filtered=getFilteredTransactions();
  const total=filtered.reduce((s,t)=>s+t.total,0), rtTotal=filtered.filter(t=>t.type==='rt').reduce((s,t)=>s+t.total,0), wsTotal=filtered.filter(t=>t.type==='ws').reduce((s,t)=>s+t.total,0), avgSale=filtered.length?total/filtered.length:0;
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const gridColor=isDark?'#334155':'#e2e8f0', tickColor=isDark?'#64748b':'#94a3b8';
  document.getElementById('reportContent').innerHTML=`
    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px">
      <div class="stat-card"><div class="stat-header"><span class="stat-label">Total Revenue</span></div><div class="stat-value" style="font-size:20px">₱${total.toLocaleString('en-PH',{minimumFractionDigits:2})}</div><div class="stat-sub">${filtered.length} transactions</div></div>
      <div class="stat-card"><div class="stat-header"><span class="stat-label">Retail Sales</span></div><div class="stat-value" style="font-size:20px;color:#10b981">₱${rtTotal.toLocaleString('en-PH',{minimumFractionDigits:2})}</div><div class="stat-sub">${filtered.filter(t=>t.type==='rt').length} txns</div></div>
      <div class="stat-card"><div class="stat-header"><span class="stat-label">Wholesale Sales</span></div><div class="stat-value" style="font-size:20px;color:#f59e0b">₱${wsTotal.toLocaleString('en-PH',{minimumFractionDigits:2})}</div><div class="stat-sub">${filtered.filter(t=>t.type==='ws').length} txns</div></div>
      <div class="stat-card"><div class="stat-header"><span class="stat-label">Avg Sale Value</span></div><div class="stat-value" style="font-size:20px">₱${avgSale.toLocaleString('en-PH',{minimumFractionDigits:2})}</div></div>
    </div>
    <div class="chart-card" style="margin-bottom:24px"><h3>Sales by Day</h3><p>${currentReportFilter==='week'?'Last 7 days':'This month'}</p><div style="position:relative;height:220px;width:100%"><canvas id="reportChartCanvas"></canvas></div></div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-size:15px;font-weight:700">Transaction List</div>
      <div style="display:flex;gap:8px"><button class="btn-add" style="font-size:12px;padding:7px 14px;background:#217346" onclick="exportTransactionsExcel()">📊 Export Excel</button><button class="btn-add" style="font-size:12px;padding:7px 14px" onclick="window.print()">🖨️ Print</button></div>
    </div>
    <table style="border:none;box-shadow:none">
      <thead><tr><th>Txn ID</th><th>Date & Time</th><th>Cashier</th><th>Type</th><th>Total</th><th>Tendered</th><th>Change</th></tr></thead>
      <tbody>${filtered.slice(0,100).map(t=>`<tr><td class="tx-id">${t.id}</td><td style="font-size:12.5px">${fmtDate(t.date)}</td><td>${t.cashier}</td><td>${typeBadge(t.type)}</td><td><strong>₱${t.total.toLocaleString('en-PH',{minimumFractionDigits:2})}</strong></td><td style="color:var(--text2)">₱${(t.amountTendered||0).toFixed(2)}</td><td style="color:var(--green);font-weight:600">₱${(t.change||0).toFixed(2)}</td></tr>`).join('')}</tbody>
    </table>
    ${filtered.length>100?`<div style="text-align:center;padding:14px;font-size:13px;color:var(--text2)">Showing 100 of ${filtered.length} · Export Excel to see all</div>`:''}
    </div>`;
  const now=new Date(); let labels=[],data=[];
  if (currentReportFilter==='week') { for(let i=6;i>=0;i--){ const d=new Date(now); d.setDate(d.getDate()-i); d.setHours(0,0,0,0); labels.push(d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})); data.push(filtered.filter(t=>new Date(t.date).toDateString()===d.toDateString()).reduce((s,t)=>s+t.total,0)); } }
  else { const dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(); for(let i=1;i<=dim;i++){ const d=new Date(now.getFullYear(),now.getMonth(),i); labels.push(i.toString()); data.push(filtered.filter(t=>new Date(t.date).toDateString()===d.toDateString()).reduce((s,t)=>s+t.total,0)); } }
  setTimeout(()=>{ const el=document.getElementById('reportChartCanvas'); if(!el)return; if(reportChart){reportChart.destroy();reportChart=null;} reportChart=new Chart(el.getContext('2d'),{type:'bar',data:{labels,datasets:[{data,backgroundColor:'#4f46e5',borderRadius:6,borderSkipped:false}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,border:{dash:[4,4],display:false},grid:{color:gridColor},ticks:{color:tickColor,callback:v=>'₱'+v.toLocaleString(),font:{size:11}}},x:{grid:{display:false},border:{display:false},ticks:{color:tickColor,font:{size:11}}}},responsive:true,maintainAspectRatio:false}}); },50);
}
function renderInventoryReport() {
  const totalVal=products.reduce((s,p)=>s+p.retailStock*p.retailPrice+p.wholesaleStock*p.wholesalePrice,0);
  document.getElementById('reportContent').innerHTML=`
    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px">
      <div class="stat-card"><div class="stat-header"><span class="stat-label">Total Products</span></div><div class="stat-value">${products.length}</div></div>
      <div class="stat-card"><div class="stat-header"><span class="stat-label">Total Stock Value</span></div><div class="stat-value" style="font-size:20px">₱${Math.round(totalVal).toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-header"><span class="stat-label">RT Low Stock</span></div><div class="stat-value" style="color:var(--red)">${products.filter(p=>p.retailStock<=10).length}</div><div class="stat-sub">≤ 10 units</div></div>
      <div class="stat-card"><div class="stat-header"><span class="stat-label">WS Low Stock</span></div><div class="stat-value" style="color:var(--orange)">${products.filter(p=>p.wholesaleStock<=30).length}</div><div class="stat-sub">≤ 30 units</div></div>
    </div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-size:15px;font-weight:700">Stock Levels by Product</div>
      <div style="display:flex;gap:8px"><button class="btn-add" style="font-size:12px;padding:7px 14px;background:#217346" onclick="exportInventoryExcel()">📊 Export Excel</button><button class="btn-add" style="font-size:12px;padding:7px 14px" onclick="window.print()">🖨️ Print</button></div>
    </div>
    <table style="border:none;box-shadow:none">
      <thead><tr><th>Product</th><th>Category</th><th>RT Price</th><th>WS Price</th><th>RT Stock</th><th>WS Stock</th><th>RT Value</th><th>WS Value</th><th>Status</th></tr></thead>
      <tbody>${products.map(p=>{ const rf=p.retailStock<=10,wf=p.wholesaleStock<=30; let s,sc; if(rf&&wf){s='Low (RT+WS)';sc='low-both';}else if(rf){s='Low Retail';sc='low-retail';}else if(wf){s='Low Wholesale';sc='low-ws';}else{s='In Stock';sc='ok';} const cat=p.category||'Others', catC=CATEGORY_COLORS[cat]||CATEGORY_COLORS['Others'];
        return `<tr><td><strong>${p.name}</strong></td><td><span class="cat-badge" style="background:${catC.bg};color:${catC.color}">${cat}</span></td><td>₱${p.retailPrice.toFixed(2)}</td><td class="price-ws">₱${p.wholesalePrice.toFixed(2)}</td><td class="${rf?'stock-low':'stock-ok'}">${p.retailStock}</td><td class="${wf?'stock-low':'stock-ok'}">${p.wholesaleStock}</td><td>₱${(p.retailStock*p.retailPrice).toFixed(2)}</td><td>₱${(p.wholesaleStock*p.wholesalePrice).toFixed(2)}</td><td><span class="status-pill ${sc}">${s}</span></td></tr>`;
      }).join('')}</tbody>
      <tfoot><tr style="background:var(--surface2);font-weight:700"><td colspan="6">TOTAL</td><td>₱${products.reduce((s,p)=>s+p.retailStock*p.retailPrice,0).toFixed(2)}</td><td>₱${products.reduce((s,p)=>s+p.wholesaleStock*p.wholesalePrice,0).toFixed(2)}</td><td></td></tr></tfoot>
    </table></div>`;
}

//  AUDIT TRAIL

function renderAuditTrail() {
  const fu=document.getElementById('auditFilterUser')?.value||'all', fa=document.getElementById('auditFilterAction')?.value||'all', fd=document.getElementById('auditFilterDate')?.value||'all';
  const now=new Date(); let filtered=[...auditLog];
  if(fu!=='all') filtered=filtered.filter(a=>fu==='owner'?a.role==='owner':a.role==='staff');
  if(fa!=='all') filtered=filtered.filter(a=>a.action.startsWith(fa));
  if(fd==='today') filtered=filtered.filter(a=>new Date(a.timestamp).toDateString()===now.toDateString());
  if(fd==='week') { const s=new Date(now); s.setDate(s.getDate()-6); filtered=filtered.filter(a=>new Date(a.timestamp)>=s); }
  const actionColors={'LOGIN':'#4f46e5','LOGOUT':'#64748b','SALE':'#10b981','TRANSACTION':'#f59e0b','PRODUCT':'#3b82f6','CUSTOMER':'#7c3aed','POINTS':'#ec4899','REWARDS':'#0ea5e9'};
  const getColor=a=>{ for(const k of Object.keys(actionColors)) if(a.startsWith(k)) return actionColors[k]; return '#64748b'; };
  document.getElementById('auditStats').innerHTML=`<div class="stat-card"><div class="stat-header"><span class="stat-label">Total Entries</span></div><div class="stat-value">${auditLog.length}</div></div><div class="stat-card"><div class="stat-header"><span class="stat-label">Showing</span></div><div class="stat-value">${filtered.length}</div><div class="stat-sub">filtered results</div></div><div class="stat-card"><div class="stat-header"><span class="stat-label">Sales Logged</span></div><div class="stat-value">${auditLog.filter(a=>a.action==='SALE_COMPLETED').length}</div></div>`;
  document.getElementById('auditBody').innerHTML=filtered.length?filtered.map(a=>{ const color=getColor(a.action); return `<tr><td style="font-size:12px;color:var(--text2);font-family:'Space Mono',monospace;white-space:nowrap">${new Date(a.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}<br>${new Date(a.timestamp).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</td><td><div style="font-weight:600;font-size:13px">${a.user}</div><span style="font-size:11px;background:${a.role==='owner'?'#e0e7ff':'#d1fae5'};color:${a.role==='owner'?'#4f46e5':'#059669'};padding:1px 7px;border-radius:99px;font-weight:700">${a.role}</span></td><td><span style="background:${color}20;color:${color};padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap">${a.action.replace(/_/g,' ')}</span></td><td style="font-size:13px;color:var(--text2);max-width:300px">${a.details}</td></tr>`; }).join(''):`<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text3)">No audit entries match the selected filters</td></tr>`;
}
function clearAuditLog() {
  openModal(`<div style="text-align:center;padding:16px 10px"><div style="width:52px;height:52px;background:var(--red-bg);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px"><svg width="24" height="24" fill="none" stroke="#ef4444" stroke-width="2.2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></div><div class="modal-title">Clear Audit Log?</div><div class="modal-subtitle">All audit entries will be permanently deleted.</div><div class="modal-footer" style="justify-content:center;margin-top:16px"><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" style="background:var(--red)" onclick="confirmClearAudit()">Clear All</button></div></div>`,null,true);
}
function confirmClearAudit() { auditLog=[]; saveData(); closeModal(); renderAuditTrail(); showToast('Audit log cleared','info'); }

//  MODAL

function openModal(content,title,hasClose=true) {
  receiptIsShowing = false; // reset on any new modal
  const overlay=document.createElement('div'); overlay.className='modal-overlay'; overlay.id='activeModal';
  overlay.onclick=e=>{ if(e.target===overlay){ receiptIsShowing=false; closeModal(); } };
  overlay.innerHTML=`<div class="modal">${hasClose?'<button class="modal-close" onclick="receiptIsShowing=false;closeModal()">×</button>':''}${content}</div>`;
  document.getElementById('modalContainer').appendChild(overlay);
}
function closeModal() { const m=document.getElementById('activeModal'); if(m)m.remove(); }


//  HELPERS

function fmtDate(iso) { const d=new Date(iso); return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+', '+d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}); }
function typeBadge(type) { if(type==='ws')return`<span class="type-badge ws">📦 WS</span>`; if(type==='rt')return`<span class="type-badge rt">🛒 RT</span>`; return`<span class="type-badge mixed">⊞ Mixed</span>`; }
function showToast(msg,type='info') {
  const tc=document.getElementById('toastContainer'),t=document.createElement('div'); t.className=`toast ${type}`;
  const icons={success:'<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',error:'<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',info:'<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'};
  t.innerHTML=`${icons[type]||''} ${msg}`; tc.appendChild(t); setTimeout(()=>t.remove(),3200);
}
function showHelp() {
  openModal(`<div class="modal-title">Keyboard Shortcuts</div><div class="modal-subtitle">Quick access shortcuts for the POS system</div>
    <table style="border:none;box-shadow:none;width:100%">
      <tr><td style="border:none;padding:8px 0;font-weight:700;font-family:'Space Mono',monospace;color:var(--brand)">F4</td><td style="border:none;padding:8px 0">Print last receipt</td></tr>
      <tr><td style="border:none;padding:8px 0;font-weight:700;font-family:'Space Mono',monospace;color:var(--brand)">F8</td><td style="border:none;padding:8px 0">Complete checkout (open payment)</td></tr>
      <tr><td style="border:none;padding:8px 0;font-weight:700;font-family:'Space Mono',monospace;color:var(--brand)">F9</td><td style="border:none;padding:8px 0">Clear cart</td></tr>
      <tr><td style="border:none;padding:8px 0;font-weight:700;font-family:'Space Mono',monospace;color:var(--brand)">F11</td><td style="border:none;padding:8px 0">Link NFC customer</td></tr>
      <tr><td style="border:none;padding:8px 0;font-weight:700;font-family:'Space Mono',monospace;color:var(--brand)">F12</td><td style="border:none;padding:8px 0">Open barcode scanner</td></tr>
      <tr><td style="border:none;padding:8px 0;font-weight:700;font-family:'Space Mono',monospace;color:var(--brand)">Enter</td><td style="border:none;padding:8px 0">Confirm payment / Print &amp; close receipt</td></tr>
      <tr><td style="border:none;padding:8px 0;font-weight:700;font-family:'Space Mono',monospace;color:var(--brand)">↑↓</td><td style="border:none;padding:8px 0">Navigate search results</td></tr>
    </table>
    <div class="modal-footer"><button class="btn-save" onclick="closeModal()">Got it</button></div>`,null,true);
}

//  KEYBOARD SHORTCUTS

document.addEventListener('keydown', e => {
  if (!currentUser) return;
  // Enter to print receipt when receipt is showing in print-mode
  if (e.key === 'Enter' && receiptIsShowing) {
    e.preventDefault();
    doPrintAndClose();
    return;
  }
  if (e.key==='F4')     { e.preventDefault(); printLastReceipt(); }
  if (e.key==='F8')     { e.preventDefault(); if(!document.getElementById('checkoutBtn')?.disabled)processCheckout(); }
  if (e.key==='F9')     { e.preventDefault(); clearCart(); }
  if (e.key==='F11')    { e.preventDefault(); openNFCLink(); }
  if (e.key==='F12')    { e.preventDefault(); showScannerModal(); }
  if (e.key==='Escape') { receiptIsShowing=false; closeModal(); }
});

initTheme();