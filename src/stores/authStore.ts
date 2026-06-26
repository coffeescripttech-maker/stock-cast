import { create } from 'zustand';
import type { UserSession } from '../types/auth';
import * as api from '../api/client';

const TOKEN_KEY = 'ruizpos_token';

interface AuthState {
  currentUser: UserSession | null;
  isAuthenticated: boolean;
  token: string | null;
  authLoading: boolean;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  currentUser: null,
  isAuthenticated: false,
  token: null,
  authLoading: true,

  login: async (username, password) => {
    try {
      const res = await api.post<{ data: { user: UserSession; token: string } }>(
        '/auth/login',
        { username, password }
      );

      const { user, token } = res.data;

      set({
        currentUser: user,
        isAuthenticated: true,
        token,
      });

      localStorage.setItem(TOKEN_KEY, token);
      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    // Fire-and-forget logout API call
    api.post('/auth/logout').catch(() => {});

    localStorage.removeItem(TOKEN_KEY);
    set({
      currentUser: null,
      isAuthenticated: false,
      token: null,
    });
  },

  initAuth: async () => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      set({ authLoading: false });
      return;
    }

    // Temporarily set token so the API client can use it
    set({ token: savedToken });

    try {
      const res = await api.get<{ data: UserSession }>('/auth/me');
      set({
        currentUser: res.data,
        isAuthenticated: true,
        authLoading: false,
      });
      // Hydrate fresh data from the API after session restore
      const { useDataStore } = await import('./dataStore');
      useDataStore.getState().hydrate().catch(() => {});
      // Load system settings (CMS)
      const { useSettingsStore } = await import('./settingsStore');
      useSettingsStore.getState().fetchSettings().catch(() => {});
    } catch {
      // Token invalid or expired
      localStorage.removeItem(TOKEN_KEY);
      set({
        token: null,
        currentUser: null,
        isAuthenticated: false,
        authLoading: false,
      });
    }
  },
}));
