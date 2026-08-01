import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, Toast, ToastType } from '../types/ui';

interface UIState {
  theme: Theme;
  toasts: Toast[];
  activeModal: React.ReactNode | null;
  sidebarCollapsed: boolean;
  /** Mobile drawer open state (below `lg`). Session-only — not persisted. */
  mobileMenuOpen: boolean;
  commandPaletteOpen: boolean;

  toggleTheme: () => void;
  initTheme: () => void;
  showToast: (message: string, type: ToastType) => void;
  dismissToast: (id: string) => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      toasts: [],
      activeModal: null,
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      commandPaletteOpen: false,

      toggleTheme: () => set((s) => {
        const next = s.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        document.documentElement.classList.toggle('dark', next === 'dark');
        return { theme: next };
      }),

      initTheme: () => set((s) => {
        document.documentElement.setAttribute('data-theme', s.theme);
        document.documentElement.classList.toggle('dark', s.theme === 'dark');
        return {};
      }),

      showToast: (message, type) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 3200);
      },

      dismissToast: (id) => set((s) => ({
        toasts: s.toasts.filter((t) => t.id !== id),
      })),

      openModal: (content) => set({ activeModal: content }),

      closeModal: () => set({ activeModal: null }),

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),

      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    }),
    {
      name: 'ruizpos_theme',
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.theme);
          document.documentElement.classList.toggle('dark', state.theme === 'dark');
        }
      },
    }
  )
);
