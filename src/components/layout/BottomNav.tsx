import { useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/cn';
import { LayoutDashboard, ShoppingCart, Package, Receipt, LayoutGrid, Star } from 'lucide-react';

interface NavTab {
  id: string;
  label: string;
  path?: string;
  icon: React.ReactNode;
}

// Owner sees the full app; staff only POS + Rewards (everything else lives
// behind the hamburger drawer, which is also role-filtered).
const OWNER_TABS: NavTab[] = [
  { id: 'home', label: 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'pos', label: 'POS', path: '/pos', icon: <ShoppingCart size={20} /> },
  { id: 'stock', label: 'Stock', path: '/inventory', icon: <Package size={20} /> },
  { id: 'sales', label: 'Sales', path: '/transactions', icon: <Receipt size={20} /> },
  { id: 'more', label: 'More', icon: <LayoutGrid size={20} /> },
];

const STAFF_TABS: NavTab[] = [
  { id: 'pos', label: 'POS', path: '/pos', icon: <ShoppingCart size={20} /> },
  { id: 'rewards', label: 'Rewards', path: '/rewards', icon: <Star size={20} /> },
];

/**
 * Mobile/tablet bottom navigation — a floating dark pill (matches the sidebar
 * background) that appears below `lg` and replaces the need to open the drawer
 * for the most-used screens. Owners get the full set; staff only see POS and
 * Rewards. Desktop is unaffected.
 */
export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);
  const isOwner = useAuthStore((s) => s.currentUser?.role === 'owner');

  const tabs = isOwner ? OWNER_TABS : STAFF_TABS;
  const tabPaths = tabs.filter((t) => t.path).map((t) => t.path as string);

  const isTabActive = (path: string) => location.pathname.startsWith(path);
  const isMoreActive = !tabPaths.some((p) => location.pathname.startsWith(p));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden pointer-events-none px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="pointer-events-auto rounded-[26px] bg-sidebar/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div className={cn('grid h-[62px] px-1', tabs.length === 2 ? 'grid-cols-2' : 'grid-cols-5')}>
          {tabs.map((tab) => {
            const active = tab.path ? isTabActive(tab.path) : isMoreActive;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.path) navigate(tab.path);
                  else setMobileMenuOpen(true);
                }}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 transition-colors',
                  active ? 'text-brand' : 'text-slate-400 active:text-slate-200'
                )}
              >
                {active && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-brand" />
                )}
                {tab.icon}
                <span className="text-[10px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
