import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SystemSettings, SettingsSection } from '../types/settings';
import { defaultSettings } from '../types/settings';
import * as api from '../api/client';

interface SettingsState {
  settings: SystemSettings;
  _loaded: boolean;

  fetchSettings: () => Promise<void>;
  updateSettings: (section: SettingsSection, values: Record<string, unknown>) => Promise<void>;
  uploadBranding: (type: 'logo' | 'favicon', file: File) => Promise<string | null>;
  applyAppearance: () => void;
  applyBrandColors: () => void;
}

function applySettingsToDOM(settings: SystemSettings) {
  const root = document.documentElement;

  // Brand colors
  root.style.setProperty('--color-brand', settings.branding.primaryBrandColor);
  root.style.setProperty('--color-brand-light', settings.branding.secondaryBrandColor);

  // Appearance
  root.setAttribute('data-theme', settings.appearance.defaultTheme);
  root.classList.toggle('dark', settings.appearance.defaultTheme === 'dark');

  root.classList.toggle('dense-mode', settings.appearance.denseMode);
  root.setAttribute('data-font-size', settings.appearance.fontSize);
  root.classList.toggle('animations-off', !settings.appearance.animationsEnabled);

  // Document title
  document.title = settings.general.storeName
    ? `${settings.general.storeName} POS`
    : 'POS System';

  // Favicon
  if (settings.branding.favicon) {
    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = settings.branding.favicon;
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: { ...defaultSettings },
      _loaded: false,

      fetchSettings: async () => {
        try {
          const res = await api.get<{ data: Record<string, any> }>('/settings');
          // Merge with defaults to ensure all keys exist
          const merged = deepMerge({ ...defaultSettings }, res.data) as SystemSettings;
          set({ settings: merged, _loaded: true });
          applySettingsToDOM(merged);
        } catch {
          // Use defaults if API is unavailable (offline first)
          set({ _loaded: true });
          applySettingsToDOM(get().settings);
        }
      },

      updateSettings: async (section, values) => {
        try {
          await api.put('/settings', { [section]: values });
          set((s) => {
            const updated = {
              ...s.settings,
              [section]: { ...(s.settings[section] as unknown as Record<string, unknown>), ...values },
            };
            // Re-apply runtime effects for relevant sections
            if (section === 'branding' || section === 'appearance') {
              applySettingsToDOM(updated);
            }
            return { settings: updated };
          });
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore.getState().showToast(err.message || 'Failed to update settings', 'error');
        }
      },

      uploadBranding: async (type, file) => {
        try {
          const formData = new FormData();
          formData.append(type, file);
          const res = await api.upload<{ data: { storeLogo?: string; favicon?: string } }>(
            '/settings/branding',
            formData
          );
          const url = res.data.storeLogo || res.data.favicon || '';
          set((s) => ({
            settings: {
              ...s.settings,
              branding: {
                ...s.settings.branding,
                [type === 'logo' ? 'storeLogo' : 'favicon']: url,
              },
            },
          }));
          return url;
        } catch (err: any) {
          const { useUIStore } = await import('./uiStore');
          useUIStore.getState().showToast(err.message || 'Failed to upload branding', 'error');
          return null;
        }
      },

      applyAppearance: () => {
        applySettingsToDOM(get().settings);
      },

      applyBrandColors: () => {
        const { branding } = get().settings;
        const root = document.documentElement;
        root.style.setProperty('--color-brand', branding.primaryBrandColor);
        root.style.setProperty('--color-brand-light', branding.secondaryBrandColor);
      },
    }),
    {
      name: 'ruizpos_settings',
      partialize: (state) => ({ settings: state.settings }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply settings immediately from persisted cache
          applySettingsToDOM(state.settings);
        }
      },
    }
  )
);

/** Recursively merge source into target, keeping target keys that source lacks. */
function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}
