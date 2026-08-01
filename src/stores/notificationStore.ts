import { create } from 'zustand';
import * as api from '../api/client';
import { getApiBase } from '../lib/apiBase';
import { useAuthStore } from './authStore';
import type { AppNotification } from '../types/notification';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  error: string | null;
  _source: EventSource | null;
  _fallbackId: ReturnType<typeof setInterval> | null;

  fetchNotifications: () => Promise<void>;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  markAllRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  error: null,
  _source: null,
  _fallbackId: null,

  fetchNotifications: async () => {
    try {
      const res = await api.get<{ data: AppNotification[] }>('/notifications');
      const notifications = res.data || [];
      set({
        notifications,
        unreadCount: notifications.length,
        error: null,
      });
    } catch (err: any) {
      if (err?.status !== 401) {
        set({ error: err?.message || 'Failed to fetch notifications' });
      }
    }
  },

  startPolling: (intervalMs = 30000) => {
    const { _source } = get();
    if (_source) return; // SSE already connected

    // ── 1. Open SSE connection (real-time) ──
    const token = useAuthStore.getState().token;
    if (token) {
      const url = `${getApiBase()}/api/notifications/stream?token=${encodeURIComponent(token)}`;
      const source = new EventSource(url);

      source.addEventListener('notification', (e) => {
        try {
          const notif = JSON.parse(e.data) as AppNotification;
          set((s) => ({
            notifications: [notif, ...s.notifications],
            unreadCount: s.unreadCount + 1,
          }));
        } catch { /* ignore malformed */ }
      });

      source.addEventListener('cleared', () => {
        set({ notifications: [], unreadCount: 0 });
      });

      source.addEventListener('connected', () => {
        // SSE established — do an initial fetch to catch up
        get().fetchNotifications();
      });

      source.onerror = () => {
        // SSE failed — fall back to polling
        source.close();
        set({ _source: null });
        get().startPolling();
      };

      set({ _source: source });
      return; // SSE will handle updates
    }

    // ── 2. Fallback: polling (no token or SSE failed) ──
    const { _fallbackId } = get();
    if (_fallbackId) return;
    get().fetchNotifications();
    const id = setInterval(() => get().fetchNotifications(), intervalMs);
    set({ _fallbackId: id });
  },

  stopPolling: () => {
    const { _source, _fallbackId } = get();
    if (_source) {
      _source.close();
      set({ _source: null });
    }
    if (_fallbackId) {
      clearInterval(_fallbackId);
      set({ _fallbackId: null });
    }
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/read', {});
    } catch { /* best-effort */ }
    set({ unreadCount: 0, notifications: [] });
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
    } catch { /* best-effort */ }
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },
}));
