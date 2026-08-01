import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, LayoutDashboard, ShoppingCart, Package, Receipt, Star, BarChart3, ScrollText, Settings } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  path?: string;
  icon: React.ReactNode;
  action?: () => void;
}

const COMMANDS: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Go to dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'pos', label: 'Point of Sale', description: 'Open POS', path: '/pos', icon: <ShoppingCart size={16} /> },
  { id: 'inventory', label: 'Inventory', description: 'Manage products', path: '/inventory', icon: <Package size={16} /> },
  { id: 'transactions', label: 'Transactions', description: 'View sales history', path: '/transactions', icon: <Receipt size={16} /> },
  { id: 'rewards', label: 'Rewards', description: 'Customer loyalty', path: '/rewards', icon: <Star size={16} /> },
  { id: 'reports', label: 'Reports', description: 'Sales analytics', path: '/reports', icon: <BarChart3 size={16} /> },
  { id: 'audit', label: 'Audit Trail', description: 'System activity log', path: '/audit', icon: <ScrollText size={16} /> },
  { id: 'settings', label: 'Settings', description: 'System configuration', path: '/settings', icon: <Settings size={16} /> },
];

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = query.trim()
    ? COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  const execute = useCallback((item: CommandItem) => {
    setOpen(false);
    if (item.path) navigate(item.path);
    else if (item.action) item.action();
  }, [navigate, setOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      execute(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 h-14 border-b border-slate-100 dark:border-slate-800">
              <Search size={18} className="text-slate-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages and actions…"
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 flex-shrink-0">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[280px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  No results found
                </div>
              ) : (
                filtered.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => execute(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      i === selectedIndex
                        ? 'bg-brand/10 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${i === selectedIndex ? 'text-brand' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{item.label}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.description}</div>
                    </div>
                    {i === selectedIndex && (
                      <ArrowRight size={14} className="text-brand flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 px-5 h-10 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>Esc Close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
