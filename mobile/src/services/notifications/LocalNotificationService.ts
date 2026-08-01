/**
 * LocalNotificationService - Handles offline and local notification scheduling and management
 * Implements local notification scheduling for cached critical alerts, online/offline sync,
 * notification conflict resolution, automatic cleanup, and storage prioritization
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationData, AlertSeverity } from '../../types/notification';
import { NOTIFICATION_TIMING, STORAGE_KEYS, getChannelForSeverity } from './NotificationConfig';
import { networkSyncService, INetworkSyncService } from './NetworkSyncService';

interface LocalNotificationData extends NotificationData {
  localId?: string;
  scheduledTime?: number;
  expiryTime?: number;
  isLocal: boolean;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'expired';
}

interface CachedAlert {
  id: string;
  notification: LocalNotificationData;
  priority: number; // Higher number = higher priority
  cacheTime: number;
  lastAccessed: number;
}

interface NotificationConflict {
  localNotification: LocalNotificationData;
  remoteNotification: NotificationData;
  conflictType: 'duplicate' | 'outdated' | 'modified';
  resolution: 'use_local' | 'use_remote' | 'merge' | 'pending';
}

export interface ILocalNotificationService {
  initialize(): Promise<void>;
  scheduleLocalNotification(notification: NotificationData, delayMinutes?: number): Promise<string>;
  cacheAlert(notification: NotificationData): Promise<void>;
  syncWithRemoteNotifications(remoteNotifications: NotificationData[]): Promise<void>;
  resolveNotificationConflicts(): Promise<void>;
  cleanupExpiredNotifications(): Promise<void>;
  prioritizeStorageForCriticalAlerts(): Promise<void>;
  getCachedAlerts(): Promise<CachedAlert[]>;
  getLocalNotifications(): Promise<LocalNotificationData[]>;
  cancelLocalNotification(localId: string): Promise<void>;
  getStorageUsage(): Promise<{ used: number; available: number; criticalCount: number }>;
}

export class LocalNotificationService implements ILocalNotificationService {
  private networkSyncService: INetworkSyncService;
  private cachedAlerts: Map<string, CachedAlert> = new Map();
  private localNotifications: Map<string, LocalNotificationData> = new Map();
  private conflicts: NotificationConflict[] = [];
  private isInitialized = false;

  // Storage configuration
  private readonly MAX_CACHED_ALERTS = 100;
  private readonly MAX_LOCAL_NOTIFICATIONS = 50;
  private readonly CRITICAL_ALERT_PRIORITY = 100;
  private readonly HIGH_ALERT_PRIORITY = 75;
  private readonly MEDIUM_ALERT_PRIORITY = 50;
  private readonly LOW_ALERT_PRIORITY = 25;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private readonly DEFAULT_EXPIRY_HOURS = 24;

  // Storage keys
  private readonly CACHED_ALERTS_KEY = `${STORAGE_KEYS.NOTIFICATIONS}_cached_alerts`;
  private readonly LOCAL_NOTIFICATIONS_KEY = `${STORAGE_KEYS.NOTIFICATIONS}_local`;
  private readonly CONFLICTS_KEY = `${STORAGE_KEYS.NOTIFICATIONS}_conflicts`;
  private readonly LAST_CLEANUP_KEY = `${STORAGE_KEYS.NOTIFICATIONS}_last_cleanup`;

  constructor(networkSyncService?: INetworkSyncService) {
    this.networkSyncService = networkSyncService || networkSyncService;
  }

  /**
   * Initialize the local notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load cached data from storage
      await this.loadCachedData();

      // Set up periodic cleanup
      this.setupPeriodicCleanup();

      // Set up network state listener for sync
      this.setupNetworkListener();

      this.isInitialized = true;
      console.log('LocalNotificationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LocalNotificationService:', error);
      throw error;
    }
  }

  /**
   * Load cached data from storage
   */
  private async loadCachedData(): Promise<void> {
    try {
      const [cachedAlertsData, localNotificationsData, conflictsData] = await Promise.all([
        AsyncStorage.getItem(this.CACHED_ALERTS_KEY),
        AsyncStorage.getItem(this.LOCAL_NOTIFICATIONS_KEY),
        AsyncStorage.getItem(this.CONFLICTS_KEY)
      ]);

      if (cachedAlertsData) {
        const alerts: CachedAlert[] = JSON.parse(cachedAlertsData);
        alerts.forEach(alert => {
          this.cachedAlerts.set(alert.id, alert);
        });
      }

      if (localNotificationsData) {
        const notifications: LocalNotificationData[] = JSON.parse(localNotificationsData);
        notifications.forEach(notification => {
          if (notification.localId) {
            this.localNotifications.set(notification.localId, notification);
          }
        });
      }

      if (conflictsData) {
        this.conflicts = JSON.parse(conflictsData);
      }

      console.log('Loaded cached data:', {
        alerts: this.cachedAlerts.size,
        notifications: this.localNotifications.size,
        conflicts: this.conflicts.length
      });
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  }

  /**
   * Save cached data to storage
   */
  private async saveCachedData(): Promise<void> {
    try {
      const cachedAlerts = Array.from(this.cachedAlerts.values());
      const localNotifications = Array.from(this.localNotifications.values());

      await Promise.all([
        AsyncStorage.setItem(this.CACHED_ALERTS_KEY, JSON.stringify(cachedAlerts)),
        AsyncStorage.setItem(this.LOCAL_NOTIFICATIONS_KEY, JSON.stringify(localNotifications)),
        AsyncStorage.setItem(this.CONFLICTS_KEY, JSON.stringify(this.conflicts))
      ]);
    } catch (error) {
      console.error('Error saving cached data:', error);
    }
  }

  /**
   * Set up periodic cleanup
   */
  private setupPeriodicCleanup(): void {
    setInterval(async () => {
      try {
        await this.cleanupExpiredNotifications();
        await this.prioritizeStorageForCriticalAlerts();
      } catch (error) {
        console.error('Error during periodic cleanup:', error);
      }
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Set up network listener for sync
   */
  private setupNetworkListener(): void {
    // This would typically listen to network state changes
    // For now, we'll rely on the NetworkSyncService to handle this
  }

  /**
   * Schedule a local notification for cached critical alerts
   */
  async scheduleLocalNotification(notification: NotificationData, delayMinutes: number = 0): Promise<string> {
    try {
      const scheduledTime = Date.now() + (delayMinutes * 60 * 1000);
      const expiryTime = scheduledTime + (this.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);

      // Create local notification data
      const localNotification: LocalNotificationData = {
        ...notification,
        isLocal: true,
        scheduledTime,
        expiryTime,
        syncStatus: 'pending'
      };

      // Schedule with expo-notifications
      const trigger = delayMinutes > 0 ? { seconds: delayMinutes * 60 } : null;
      
      const localId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            ...notification.data,
            isLocal: true,
            originalId: notification.id,
            severity: notification.severity
          },
          sound: true,
          badge: 1,
        },
        trigger,
      });

      // Store local notification data
      localNotification.localId = localId;
      this.localNotifications.set(localId, localNotification);

      // Save to storage
      await this.saveCachedData();

      console.log('Scheduled local notification:', {
        localId,
        originalId: notification.id,
        severity: notification.severity,
        delayMinutes
      });

      return localId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  /**
   * Cache alert for offline access with storage prioritization
   */
  async cacheAlert(notification: NotificationData): Promise<void> {
    try {
      const priority = this.calculateAlertPriority(notification.severity);
      const now = Date.now();

      const cachedAlert: CachedAlert = {
        id: notification.id,
        notification: {
          ...notification,
          isLocal: false,
          syncStatus: 'synced'
        },
        priority,
        cacheTime: now,
        lastAccessed: now
      };

      // Check if we need to make space for critical alerts
      if (this.cachedAlerts.size >= this.MAX_CACHED_ALERTS) {
        await this.prioritizeStorageForCriticalAlerts();
      }

      // Add to cache
      this.cachedAlerts.set(notification.id, cachedAlert);

      // If it's a critical alert, schedule a local notification reminder
      if (notification.severity === 'critical') {
        await this.scheduleLocalNotification(notification, 5); // 5 minute reminder
      }

      // Save to storage
      await this.saveCachedData();

      console.log('Cached alert:', {
        id: notification.id,
        severity: notification.severity,
        priority,
        totalCached: this.cachedAlerts.size
      });
    } catch (error) {
      console.error('Error caching alert:', error);
    }
  }

  /**
   * Calculate priority for alert based on severity
   */
  private calculateAlertPriority(severity: AlertSeverity): number {
    switch (severity) {
      case 'critical':
        return this.CRITICAL_ALERT_PRIORITY;
      case 'high':
        return this.HIGH_ALERT_PRIORITY;
      case 'medium':
        return this.MEDIUM_ALERT_PRIORITY;
      case 'low':
        return this.LOW_ALERT_PRIORITY;
      default:
        return this.LOW_ALERT_PRIORITY;
    }
  }

  /**
   * Sync with remote notifications and resolve conflicts
   */
  async syncWithRemoteNotifications(remoteNotifications: NotificationData[]): Promise<void> {
    try {
      console.log('Syncing with remote notifications:', remoteNotifications.length);

      const newConflicts: NotificationConflict[] = [];

      for (const remoteNotification of remoteNotifications) {
        // Check if we have a local version
        const cachedAlert = this.cachedAlerts.get(remoteNotification.id);
        
        if (cachedAlert) {
          const conflict = this.detectConflict(cachedAlert.notification, remoteNotification);
          if (conflict) {
            newConflicts.push(conflict);
          } else {
            // Update cached version with remote data
            cachedAlert.notification = {
              ...remoteNotification,
              isLocal: false,
              syncStatus: 'synced'
            };
            cachedAlert.lastAccessed = Date.now();
          }
        } else {
          // New remote notification, cache it
          await this.cacheAlert(remoteNotification);
        }
      }

      // Add new conflicts
      this.conflicts.push(...newConflicts);

      // Resolve conflicts automatically where possible
      await this.resolveNotificationConflicts();

      // Save changes
      await this.saveCachedData();

      console.log('Sync completed:', {
        processed: remoteNotifications.length,
        newConflicts: newConflicts.length,
        totalConflicts: this.conflicts.length
      });
    } catch (error) {
      console.error('Error syncing with remote notifications:', error);
    }
  }

  /**
   * Detect conflicts between local and remote notifications
   */
  private detectConflict(localNotification: LocalNotificationData, remoteNotification: NotificationData): NotificationConflict | null {
    // Check for duplicate
    if (localNotification.id === remoteNotification.id) {
      // Check if content differs
      if (
        localNotification.title !== remoteNotification.title ||
        localNotification.body !== remoteNotification.body ||
        localNotification.severity !== remoteNotification.severity
      ) {
        return {
          localNotification,
          remoteNotification,
          conflictType: 'modified',
          resolution: 'pending'
        };
      }

      // Check if local is outdated
      if (localNotification.timestamp < remoteNotification.timestamp) {
        return {
          localNotification,
          remoteNotification,
          conflictType: 'outdated',
          resolution: 'use_remote'
        };
      }
    }

    return null;
  }

  /**
   * Resolve notification conflicts using prioritization rules
   */
  async resolveNotificationConflicts(): Promise<void> {
    try {
      const resolvedConflicts: number[] = [];

      for (let i = 0; i < this.conflicts.length; i++) {
        const conflict = this.conflicts[i];

        if (conflict.resolution === 'pending') {
          // Auto-resolve based on conflict type and severity
          conflict.resolution = this.determineConflictResolution(conflict);
        }

        // Apply resolution
        await this.applyConflictResolution(conflict);
        resolvedConflicts.push(i);
      }

      // Remove resolved conflicts
      this.conflicts = this.conflicts.filter((_, index) => !resolvedConflicts.includes(index));

      if (resolvedConflicts.length > 0) {
        await this.saveCachedData();
        console.log('Resolved conflicts:', resolvedConflicts.length);
      }
    } catch (error) {
      console.error('Error resolving notification conflicts:', error);
    }
  }

  /**
   * Determine conflict resolution strategy
   */
  private determineConflictResolution(conflict: NotificationConflict): 'use_local' | 'use_remote' | 'merge' {
    switch (conflict.conflictType) {
      case 'outdated':
        return 'use_remote'; // Always use newer remote data
      
      case 'modified':
        // For critical alerts, prefer remote (authoritative source)
        if (conflict.remoteNotification.severity === 'critical') {
          return 'use_remote';
        }
        // For others, use timestamp to decide
        return conflict.localNotification.timestamp > conflict.remoteNotification.timestamp 
          ? 'use_local' 
          : 'use_remote';
      
      case 'duplicate':
        return 'use_remote'; // Remote is authoritative
      
      default:
        return 'use_remote';
    }
  }

  /**
   * Apply conflict resolution
   */
  private async applyConflictResolution(conflict: NotificationConflict): Promise<void> {
    const { localNotification, remoteNotification, resolution } = conflict;

    switch (resolution) {
      case 'use_remote':
        // Update cached alert with remote data
        const cachedAlert = this.cachedAlerts.get(remoteNotification.id);
        if (cachedAlert) {
          cachedAlert.notification = {
            ...remoteNotification,
            isLocal: false,
            syncStatus: 'synced'
          };
          cachedAlert.lastAccessed = Date.now();
        }
        
        // Cancel local notification if exists
        if (localNotification.localId) {
          await this.cancelLocalNotification(localNotification.localId);
        }
        break;

      case 'use_local':
        // Keep local version, mark as needing sync
        if (localNotification.localId) {
          const localNotif = this.localNotifications.get(localNotification.localId);
          if (localNotif) {
            localNotif.syncStatus = 'conflict';
          }
        }
        break;

      case 'merge':
        // Merge data (prefer remote for critical fields, local for user preferences)
        const mergedNotification: LocalNotificationData = {
          ...remoteNotification,
          isLocal: localNotification.isLocal,
          localId: localNotification.localId,
          scheduledTime: localNotification.scheduledTime,
          syncStatus: 'synced'
        };

        const cachedMerged = this.cachedAlerts.get(remoteNotification.id);
        if (cachedMerged) {
          cachedMerged.notification = mergedNotification;
          cachedMerged.lastAccessed = Date.now();
        }
        break;
    }
  }

  /**
   * Clean up expired notifications automatically
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = Date.now();
      const expiredLocalIds: string[] = [];
      const expiredCachedIds: string[] = [];

      // Clean up expired local notifications
      for (const [localId, notification] of this.localNotifications) {
        if (notification.expiryTime && notification.expiryTime < now) {
          expiredLocalIds.push(localId);
          
          // Cancel scheduled notification
          try {
            await Notifications.cancelScheduledNotificationAsync(localId);
          } catch (error) {
            console.warn('Failed to cancel expired notification:', localId, error);
          }
        }
      }

      // Clean up expired cached alerts (older than 7 days for non-critical)
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      for (const [id, cachedAlert] of this.cachedAlerts) {
        const isExpired = cachedAlert.notification.severity !== 'critical' && 
                         cachedAlert.cacheTime < sevenDaysAgo;
        
        if (isExpired) {
          expiredCachedIds.push(id);
        }
      }

      // Remove expired items
      expiredLocalIds.forEach(id => this.localNotifications.delete(id));
      expiredCachedIds.forEach(id => this.cachedAlerts.delete(id));

      // Update last cleanup timestamp
      await AsyncStorage.setItem(this.LAST_CLEANUP_KEY, now.toString());

      if (expiredLocalIds.length > 0 || expiredCachedIds.length > 0) {
        await this.saveCachedData();
        console.log('Cleaned up expired notifications:', {
          localNotifications: expiredLocalIds.length,
          cachedAlerts: expiredCachedIds.length
        });
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Prioritize storage for critical alerts by removing low-priority items
   */
  async prioritizeStorageForCriticalAlerts(): Promise<void> {
    try {
      // If we're not at capacity, no need to prioritize
      if (this.cachedAlerts.size < this.MAX_CACHED_ALERTS) {
        return;
      }

      // Sort cached alerts by priority (lowest first) and last accessed time
      const sortedAlerts = Array.from(this.cachedAlerts.values()).sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority; // Lower priority first
        }
        return a.lastAccessed - b.lastAccessed; // Older first
      });

      // Calculate how many to remove (remove 20% to make space)
      const removeCount = Math.floor(this.MAX_CACHED_ALERTS * 0.2);
      const toRemove = sortedAlerts.slice(0, removeCount);

      // Remove low-priority alerts
      for (const alert of toRemove) {
        // Don't remove critical alerts unless they're very old
        if (alert.priority === this.CRITICAL_ALERT_PRIORITY) {
          const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
          if (alert.lastAccessed > threeDaysAgo) {
            continue; // Keep recent critical alerts
          }
        }

        this.cachedAlerts.delete(alert.id);
      }

      await this.saveCachedData();

      console.log('Prioritized storage for critical alerts:', {
        removed: toRemove.length,
        remaining: this.cachedAlerts.size
      });
    } catch (error) {
      console.error('Error prioritizing storage:', error);
    }
  }

  /**
   * Get all cached alerts
   */
  async getCachedAlerts(): Promise<CachedAlert[]> {
    return Array.from(this.cachedAlerts.values());
  }

  /**
   * Get all local notifications
   */
  async getLocalNotifications(): Promise<LocalNotificationData[]> {
    return Array.from(this.localNotifications.values());
  }

  /**
   * Cancel a local notification
   */
  async cancelLocalNotification(localId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(localId);
      this.localNotifications.delete(localId);
      await this.saveCachedData();
      
      console.log('Cancelled local notification:', localId);
    } catch (error) {
      console.error('Error cancelling local notification:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(): Promise<{ used: number; available: number; criticalCount: number }> {
    const criticalCount = Array.from(this.cachedAlerts.values())
      .filter(alert => alert.priority === this.CRITICAL_ALERT_PRIORITY).length;

    return {
      used: this.cachedAlerts.size,
      available: this.MAX_CACHED_ALERTS - this.cachedAlerts.size,
      criticalCount
    };
  }

  /**
   * Force sync with remote when online
   */
  async forceSyncWhenOnline(): Promise<void> {
    if (this.networkSyncService.isOnline()) {
      try {
        // This would typically fetch latest notifications from the server
        console.log('Force syncing with remote notifications...');
        
        // Add sync operation to queue
        await this.networkSyncService.addPendingSyncOperation({
          type: 'notification_sync',
          data: {
            localNotificationIds: Array.from(this.localNotifications.keys()),
            cachedAlertIds: Array.from(this.cachedAlerts.keys()),
            lastSync: Date.now()
          },
          maxRetries: 3
        });

        await this.networkSyncService.syncWhenOnline();
      } catch (error) {
        console.error('Error during force sync:', error);
      }
    }
  }

  /**
   * Get conflicts for manual resolution
   */
  getConflicts(): NotificationConflict[] {
    return [...this.conflicts];
  }

  /**
   * Manually resolve a conflict
   */
  async resolveConflict(conflictIndex: number, resolution: 'use_local' | 'use_remote' | 'merge'): Promise<void> {
    if (conflictIndex >= 0 && conflictIndex < this.conflicts.length) {
      const conflict = this.conflicts[conflictIndex];
      conflict.resolution = resolution;
      
      await this.applyConflictResolution(conflict);
      this.conflicts.splice(conflictIndex, 1);
      
      await this.saveCachedData();
      console.log('Manually resolved conflict:', conflictIndex, resolution);
    }
  }
}

// Export singleton instance
export const localNotificationService = new LocalNotificationService();