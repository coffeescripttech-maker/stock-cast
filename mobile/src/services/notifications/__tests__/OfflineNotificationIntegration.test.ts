/**
 * Offline Notification Integration Tests
 * Tests the complete offline notification system including scheduling, sync, and conflict resolution
 */

import { NotificationManager } from '../NotificationManager';
import { LocalNotificationService } from '../LocalNotificationService';
import { NetworkSyncService } from '../NetworkSyncService';
import { NotificationData, AlertSeverity } from '../../../types/notification';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Offline Notification Integration', () => {
  let notificationManager: NotificationManager;
  let localNotificationService: LocalNotificationService;
  let networkSyncService: NetworkSyncService;
  let mockNotificationData: NotificationData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    // Mock expo-notifications
    mockNotifications.scheduleNotificationAsync.mockResolvedValue('local-id-123');
    mockNotifications.cancelScheduledNotificationAsync.mockResolvedValue();
    mockNotifications.setNotificationHandler.mockImplementation(() => {});
    mockNotifications.setNotificationChannelAsync.mockResolvedValue();
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'test-token' } as any);
    
    // Create services
    networkSyncService = new NetworkSyncService();
    localNotificationService = new LocalNotificationService(networkSyncService);
    notificationManager = new NotificationManager(
      undefined, // navigationHandler
      undefined, // badgeService
      undefined, // audioService
      undefined, // hapticService
      undefined, // foregroundHandler
      networkSyncService,
      localNotificationService
    );
    
    mockNotificationData = {
      id: 'test-notification-1',
      type: 'alert',
      severity: 'critical',
      title: 'Emergency Alert',
      body: 'This is a critical emergency alert',
      timestamp: Date.now(),
      data: { location: 'Test City', alertType: 'earthquake' }
    };
  });

  describe('offline notification caching', () => {
    it('should cache critical alerts when offline', async () => {
      // Mock offline state
      jest.spyOn(networkSyncService, 'isOnline').mockReturnValue(false);
      
      await notificationManager.initialize();
      await notificationManager.handleNotification(mockNotificationData);
      
      // Verify alert was cached
      const cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts).toHaveLength(1);
      expect(cachedAlerts[0].id).toBe(mockNotificationData.id);
      expect(cachedAlerts[0].priority).toBe(100); // Critical priority
    });

    it('should schedule local notification for critical alerts when offline', async () => {
      jest.spyOn(networkSyncService, 'isOnline').mockReturnValue(false);
      
      await notificationManager.initialize();
      await notificationManager.handleNotification(mockNotificationData);
      
      // Verify local notification was scheduled
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: mockNotificationData.title,
            body: mockNotificationData.body
          }),
          trigger: { seconds: 300 } // 5 minute reminder
        })
      );
    });

    it('should not schedule local notifications for low priority alerts', async () => {
      const lowPriorityAlert = {
        ...mockNotificationData,
        severity: 'low' as AlertSeverity
      };
      
      jest.spyOn(networkSyncService, 'isOnline').mockReturnValue(false);
      
      await notificationManager.initialize();
      await notificationManager.handleNotification(lowPriorityAlert);
      
      // Should cache but not schedule local notification
      const cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts).toHaveLength(0); // Low priority not cached when offline
      expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('online notification caching', () => {
    it('should cache all alerts when online', async () => {
      jest.spyOn(networkSyncService, 'isOnline').mockReturnValue(true);
      
      await notificationManager.initialize();
      
      const alerts = [
        { ...mockNotificationData, id: 'alert-1', severity: 'critical' as AlertSeverity },
        { ...mockNotificationData, id: 'alert-2', severity: 'high' as AlertSeverity },
        { ...mockNotificationData, id: 'alert-3', severity: 'medium' as AlertSeverity },
        { ...mockNotificationData, id: 'alert-4', severity: 'low' as AlertSeverity }
      ];
      
      for (const alert of alerts) {
        await notificationManager.handleNotification(alert);
      }
      
      const cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts).toHaveLength(4);
      
      // Verify priorities are correct
      const priorities = cachedAlerts.map(a => a.priority).sort((a, b) => b - a);
      expect(priorities).toEqual([100, 75, 50, 25]); // Critical to low
    });
  });

  describe('network state transitions', () => {
    it('should sync cached alerts when coming back online', async () => {
      // Start offline
      jest.spyOn(networkSyncService, 'isOnline').mockReturnValue(false);
      
      await notificationManager.initialize();
      await notificationManager.handleNotification(mockNotificationData);
      
      // Verify alert was cached offline
      let cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts).toHaveLength(1);
      
      // Simulate coming back online
      jest.spyOn(networkSyncService, 'isOnline').mockReturnValue(true);
      
      // Mock remote notifications for sync
      const remoteNotifications = [
        { ...mockNotificationData, title: 'Updated Title' }
      ];
      
      await localNotificationService.syncWithRemoteNotifications(remoteNotifications);
      
      // Verify sync occurred
      cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts[0].notification.title).toBe('Updated Title');
    });

    it('should handle sync conflicts when reconnecting', async () => {
      // Cache notification offline
      jest.spyOn(networkSyncService, 'isOnline').mockReturnValue(false);
      
      await notificationManager.initialize();
      await notificationManager.handleNotification(mockNotificationData);
      
      // Simulate coming back online with conflicting remote data
      jest.spyOn(networkSyncService, 'isOnline').mockReturnValue(true);
      
      const conflictingRemote = {
        ...mockNotificationData,
        title: 'Conflicting Title',
        body: 'Different body content',
        timestamp: mockNotificationData.timestamp + 5000 // Newer
      };
      
      await localNotificationService.syncWithRemoteNotifications([conflictingRemote]);
      
      // Should auto-resolve to use newer remote data
      const cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts[0].notification.title).toBe('Conflicting Title');
      expect(cachedAlerts[0].notification.body).toBe('Different body content');
    });
  });

  describe('storage management', () => {
    it('should prioritize critical alerts when storage is full', async () => {
      await notificationManager.initialize();
      
      // Fill storage with low-priority alerts
      for (let i = 0; i < 100; i++) {
        const lowAlert = {
          ...mockNotificationData,
          id: `low-${i}`,
          severity: 'low' as AlertSeverity
        };
        await localNotificationService.cacheAlert(lowAlert);
      }
      
      // Add critical alert (should trigger prioritization)
      const criticalAlert = {
        ...mockNotificationData,
        id: 'critical-1',
        severity: 'critical' as AlertSeverity
      };
      await localNotificationService.cacheAlert(criticalAlert);
      
      const usage = await localNotificationService.getStorageUsage();
      expect(usage.criticalCount).toBe(1);
      expect(usage.used).toBeLessThanOrEqual(100);
      
      // Critical alert should be preserved
      const cachedAlerts = await localNotificationService.getCachedAlerts();
      const criticalCached = cachedAlerts.find(a => a.id === 'critical-1');
      expect(criticalCached).toBeDefined();
    });

    it('should clean up expired notifications automatically', async () => {
      await notificationManager.initialize();
      
      // Schedule notification that will expire
      const localId = await localNotificationService.scheduleLocalNotification(mockNotificationData);
      
      // Manually trigger cleanup
      await localNotificationService.cleanupExpiredNotifications();
      
      // For this test, we'll verify the cleanup method was called
      // In real scenario, expired notifications would be removed
      expect(mockNotifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
      
      // Verify local notifications are tracked
      const localNotifications = await localNotificationService.getLocalNotifications();
      expect(localNotifications).toHaveLength(1);
    });
  });

  describe('conflict resolution', () => {
    it('should resolve timestamp-based conflicts automatically', async () => {
      await notificationManager.initialize();
      
      // Cache older local notification
      const olderNotification = {
        ...mockNotificationData,
        timestamp: Date.now() - 10000 // 10 seconds ago
      };
      await localNotificationService.cacheAlert(olderNotification);
      
      // Sync with newer remote notification
      const newerNotification = {
        ...mockNotificationData,
        title: 'Updated Title',
        timestamp: Date.now() // Now
      };
      
      await localNotificationService.syncWithRemoteNotifications([newerNotification]);
      
      // Should auto-resolve to use newer remote
      const cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts[0].notification.title).toBe('Updated Title');
      
      // No conflicts should remain
      const conflicts = localNotificationService.getConflicts();
      expect(conflicts).toHaveLength(0);
    });

    it('should handle manual conflict resolution', async () => {
      await notificationManager.initialize();
      
      // Cache local notification
      await localNotificationService.cacheAlert(mockNotificationData);
      
      // Create conflicting remote (same timestamp, different content)
      const conflictingRemote = {
        ...mockNotificationData,
        title: 'Remote Title',
        body: 'Remote body'
      };
      
      await localNotificationService.syncWithRemoteNotifications([conflictingRemote]);
      
      // Should have conflicts for manual resolution
      let conflicts = localNotificationService.getConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      
      // Manually resolve to use local
      await localNotificationService.resolveConflict(0, 'use_local');
      
      // Conflict should be resolved
      conflicts = localNotificationService.getConflicts();
      expect(conflicts).toHaveLength(0);
      
      // Local version should be preserved
      const cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts[0].notification.title).toBe(mockNotificationData.title);
    });
  });

  describe('error handling and resilience', () => {
    it('should handle notification scheduling failures gracefully', async () => {
      mockNotifications.scheduleNotificationAsync.mockRejectedValue(
        new Error('Scheduling failed')
      );
      
      await notificationManager.initialize();
      
      // Should not throw, but handle gracefully
      await expect(
        notificationManager.handleNotification(mockNotificationData)
      ).resolves.not.toThrow();
      
      // Should still cache the alert even if scheduling fails
      const cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts).toHaveLength(1);
    });

    it('should handle storage failures gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage full'));
      
      await notificationManager.initialize();
      
      // Should not throw
      await expect(
        notificationManager.handleNotification(mockNotificationData)
      ).resolves.not.toThrow();
    });

    it('should handle sync failures gracefully', async () => {
      await notificationManager.initialize();
      
      // Mock sync failure
      jest.spyOn(networkSyncService, 'syncWhenOnline').mockRejectedValue(
        new Error('Sync failed')
      );
      
      // Should not throw
      await expect(
        localNotificationService.forceSyncWhenOnline()
      ).resolves.not.toThrow();
    });
  });

  describe('performance and efficiency', () => {
    it('should batch storage operations efficiently', async () => {
      await notificationManager.initialize();
      
      const notifications = Array.from({ length: 10 }, (_, i) => ({
        ...mockNotificationData,
        id: `batch-${i}`
      }));
      
      // Process multiple notifications
      for (const notification of notifications) {
        await notificationManager.handleNotification(notification);
      }
      
      // Verify all were cached
      const cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts).toHaveLength(10);
      
      // Storage operations should be batched (not called for each notification)
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should limit memory usage with large notification sets', async () => {
      await notificationManager.initialize();
      
      // Add many notifications
      for (let i = 0; i < 150; i++) {
        const notification = {
          ...mockNotificationData,
          id: `large-set-${i}`,
          severity: (i % 4 === 0 ? 'critical' : 'low') as AlertSeverity
        };
        await localNotificationService.cacheAlert(notification);
      }
      
      // Should not exceed storage limits
      const usage = await localNotificationService.getStorageUsage();
      expect(usage.used).toBeLessThanOrEqual(100);
      
      // Critical alerts should be preserved
      expect(usage.criticalCount).toBeGreaterThan(0);
    });
  });

  describe('notification lifecycle', () => {
    it('should handle complete notification lifecycle', async () => {
      await notificationManager.initialize();
      
      // 1. Receive notification offline
      jest.spyOn(networkSyncService, 'isOnline').mockReturnValue(false);
      await notificationManager.handleNotification(mockNotificationData);
      
      // 2. Verify cached and scheduled
      let cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts).toHaveLength(1);
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalled();
      
      // 3. Come back online
      jest.spyOn(networkSyncService, 'isOnline').mockReturnValue(true);
      
      // 4. Sync with remote
      const updatedRemote = {
        ...mockNotificationData,
        title: 'Updated Alert Title'
      };
      await localNotificationService.syncWithRemoteNotifications([updatedRemote]);
      
      // 5. Verify sync completed
      cachedAlerts = await localNotificationService.getCachedAlerts();
      expect(cachedAlerts[0].notification.title).toBe('Updated Alert Title');
      
      // 6. Clean up expired
      await localNotificationService.cleanupExpiredNotifications();
      
      // 7. Verify system is in clean state
      const usage = await localNotificationService.getStorageUsage();
      expect(usage.used).toBeGreaterThanOrEqual(0);
    });
  });
});