/**
 * LocalNotificationService Tests
 * Tests for offline and local notification scheduling and management
 */

import { LocalNotificationService } from '../LocalNotificationService';
import { NotificationData, AlertSeverity } from '../../../types/notification';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../NetworkSyncService');

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Mock NetworkSyncService
const mockNetworkSyncService = {
  initialize: jest.fn(),
  addPendingNotification: jest.fn(),
  addPendingSyncOperation: jest.fn(),
  syncWhenOnline: jest.fn(),
  isOnline: jest.fn(),
  retryFailedOperation: jest.fn(),
  getLastSyncTimestamp: jest.fn(),
  getPendingOperationsCount: jest.fn()
};

describe('LocalNotificationService', () => {
  let service: LocalNotificationService;
  let mockNotificationData: NotificationData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    service = new LocalNotificationService(mockNetworkSyncService as any);
    
    mockNotificationData = {
      id: 'test-notification-1',
      type: 'alert',
      severity: 'critical',
      title: 'Test Alert',
      body: 'This is a test alert',
      timestamp: Date.now(),
      data: { testData: 'value' }
    };

    // Mock AsyncStorage
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    
    // Mock expo-notifications
    mockNotifications.scheduleNotificationAsync.mockResolvedValue('local-id-123');
    mockNotifications.cancelScheduledNotificationAsync.mockResolvedValue();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        expect.stringContaining('cached_alerts')
      );
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        expect.stringContaining('local')
      );
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        expect.stringContaining('conflicts')
      );
    });

    it('should load cached data from storage', async () => {
      const cachedAlerts = [{
        id: 'cached-1',
        notification: mockNotificationData,
        priority: 100,
        cacheTime: Date.now(),
        lastAccessed: Date.now()
      }];

      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key?.includes('cached_alerts')) {
          return Promise.resolve(JSON.stringify(cachedAlerts));
        }
        return Promise.resolve(null);
      });

      await service.initialize();
      
      const alerts = await service.getCachedAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe('cached-1');
    });
  });

  describe('scheduleLocalNotification', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should schedule immediate local notification', async () => {
      const localId = await service.scheduleLocalNotification(mockNotificationData);
      
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: mockNotificationData.title,
          body: mockNotificationData.body,
          data: expect.objectContaining({
            isLocal: true,
            originalId: mockNotificationData.id,
            severity: mockNotificationData.severity
          }),
          sound: true,
          badge: 1
        },
        trigger: null
      });
      
      expect(localId).toBe('local-id-123');
    });

    it('should schedule delayed local notification', async () => {
      const delayMinutes = 5;
      await service.scheduleLocalNotification(mockNotificationData, delayMinutes);
      
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.any(Object),
        trigger: { seconds: 300 } // 5 minutes in seconds
      });
    });

    it('should store local notification data', async () => {
      await service.scheduleLocalNotification(mockNotificationData);
      
      const localNotifications = await service.getLocalNotifications();
      expect(localNotifications).toHaveLength(1);
      expect(localNotifications[0].id).toBe(mockNotificationData.id);
      expect(localNotifications[0].isLocal).toBe(true);
    });
  });

  describe('cacheAlert', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should cache alert with correct priority', async () => {
      await service.cacheAlert(mockNotificationData);
      
      const cachedAlerts = await service.getCachedAlerts();
      expect(cachedAlerts).toHaveLength(1);
      expect(cachedAlerts[0].priority).toBe(100); // Critical priority
      expect(cachedAlerts[0].notification.severity).toBe('critical');
    });

    it('should schedule local notification for critical alerts', async () => {
      await service.cacheAlert(mockNotificationData);
      
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should not schedule local notification for low priority alerts', async () => {
      const lowPriorityNotification = {
        ...mockNotificationData,
        severity: 'low' as AlertSeverity
      };
      
      await service.cacheAlert(lowPriorityNotification);
      
      expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should calculate correct priority for different severities', async () => {
      const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
      const expectedPriorities = [100, 75, 50, 25];
      
      for (let i = 0; i < severities.length; i++) {
        const notification = {
          ...mockNotificationData,
          id: `test-${i}`,
          severity: severities[i]
        };
        
        await service.cacheAlert(notification);
      }
      
      const cachedAlerts = await service.getCachedAlerts();
      expect(cachedAlerts).toHaveLength(4);
      
      for (let i = 0; i < severities.length; i++) {
        const alert = cachedAlerts.find(a => a.id === `test-${i}`);
        expect(alert?.priority).toBe(expectedPriorities[i]);
      }
    });
  });

  describe('syncWithRemoteNotifications', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should sync new remote notifications', async () => {
      const remoteNotifications = [
        { ...mockNotificationData, id: 'remote-1' },
        { ...mockNotificationData, id: 'remote-2' }
      ];
      
      await service.syncWithRemoteNotifications(remoteNotifications);
      
      const cachedAlerts = await service.getCachedAlerts();
      expect(cachedAlerts).toHaveLength(2);
      expect(cachedAlerts.map(a => a.id)).toEqual(['remote-1', 'remote-2']);
    });

    it('should detect conflicts between local and remote notifications', async () => {
      // First cache a local notification
      await service.cacheAlert(mockNotificationData);
      
      // Then sync with modified remote version
      const modifiedRemote = {
        ...mockNotificationData,
        title: 'Modified Title',
        timestamp: mockNotificationData.timestamp + 1000
      };
      
      await service.syncWithRemoteNotifications([modifiedRemote]);
      
      const conflicts = service.getConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe('modified');
    });

    it('should update existing cached alerts with remote data', async () => {
      // Cache initial alert
      await service.cacheAlert(mockNotificationData);
      
      // Sync with same notification (no conflict)
      await service.syncWithRemoteNotifications([mockNotificationData]);
      
      const cachedAlerts = await service.getCachedAlerts();
      expect(cachedAlerts).toHaveLength(1);
      expect(cachedAlerts[0].notification.syncStatus).toBe('synced');
    });
  });

  describe('cleanupExpiredNotifications', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should remove expired local notifications', async () => {
      // Schedule a notification that expires immediately
      const expiredNotification = {
        ...mockNotificationData,
        id: 'expired-1'
      };
      
      const localId = await service.scheduleLocalNotification(expiredNotification);
      
      // Manually set expiry time to past
      const localNotifications = await service.getLocalNotifications();
      if (localNotifications[0]) {
        (localNotifications[0] as any).expiryTime = Date.now() - 1000;
      }
      
      await service.cleanupExpiredNotifications();
      
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(localId);
    });

    it('should remove old cached alerts for non-critical notifications', async () => {
      const oldNotification = {
        ...mockNotificationData,
        id: 'old-1',
        severity: 'medium' as AlertSeverity
      };
      
      await service.cacheAlert(oldNotification);
      
      // Manually set cache time to 8 days ago
      const cachedAlerts = await service.getCachedAlerts();
      if (cachedAlerts[0]) {
        cachedAlerts[0].cacheTime = Date.now() - (8 * 24 * 60 * 60 * 1000);
      }
      
      await service.cleanupExpiredNotifications();
      
      const remainingAlerts = await service.getCachedAlerts();
      expect(remainingAlerts).toHaveLength(0);
    });

    it('should preserve critical alerts even if old', async () => {
      const oldCriticalNotification = {
        ...mockNotificationData,
        id: 'old-critical',
        severity: 'critical' as AlertSeverity
      };
      
      await service.cacheAlert(oldCriticalNotification);
      
      // Manually set cache time to 8 days ago
      const cachedAlerts = await service.getCachedAlerts();
      if (cachedAlerts[0]) {
        cachedAlerts[0].cacheTime = Date.now() - (8 * 24 * 60 * 60 * 1000);
      }
      
      await service.cleanupExpiredNotifications();
      
      const remainingAlerts = await service.getCachedAlerts();
      expect(remainingAlerts).toHaveLength(1);
      expect(remainingAlerts[0].id).toBe('old-critical');
    });
  });

  describe('prioritizeStorageForCriticalAlerts', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should remove low-priority alerts when at capacity', async () => {
      // Fill cache with low-priority alerts
      for (let i = 0; i < 100; i++) {
        const notification = {
          ...mockNotificationData,
          id: `low-${i}`,
          severity: 'low' as AlertSeverity
        };
        await service.cacheAlert(notification);
      }
      
      // Add one more to trigger prioritization
      const criticalNotification = {
        ...mockNotificationData,
        id: 'critical-1',
        severity: 'critical' as AlertSeverity
      };
      await service.cacheAlert(criticalNotification);
      
      const cachedAlerts = await service.getCachedAlerts();
      expect(cachedAlerts.length).toBeLessThan(101);
      
      // Critical alert should still be there
      const criticalAlert = cachedAlerts.find(a => a.id === 'critical-1');
      expect(criticalAlert).toBeDefined();
    });
  });

  describe('cancelLocalNotification', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should cancel local notification and remove from storage', async () => {
      const localId = await service.scheduleLocalNotification(mockNotificationData);
      
      await service.cancelLocalNotification(localId);
      
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(localId);
      
      const localNotifications = await service.getLocalNotifications();
      expect(localNotifications).toHaveLength(0);
    });
  });

  describe('getStorageUsage', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return correct storage usage statistics', async () => {
      // Add some alerts
      await service.cacheAlert(mockNotificationData);
      await service.cacheAlert({
        ...mockNotificationData,
        id: 'test-2',
        severity: 'medium' as AlertSeverity
      });
      
      const usage = await service.getStorageUsage();
      
      expect(usage.used).toBe(2);
      expect(usage.available).toBe(98); // 100 - 2
      expect(usage.criticalCount).toBe(1);
    });
  });

  describe('conflict resolution', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should resolve conflicts automatically', async () => {
      // Cache local notification
      await service.cacheAlert(mockNotificationData);
      
      // Create conflicting remote notification (newer)
      const newerRemote = {
        ...mockNotificationData,
        title: 'Updated Title',
        timestamp: mockNotificationData.timestamp + 5000
      };
      
      await service.syncWithRemoteNotifications([newerRemote]);
      
      // Should auto-resolve to use remote (newer)
      const conflicts = service.getConflicts();
      expect(conflicts).toHaveLength(0); // Should be auto-resolved
      
      const cachedAlerts = await service.getCachedAlerts();
      expect(cachedAlerts[0].notification.title).toBe('Updated Title');
    });

    it('should allow manual conflict resolution', async () => {
      // Cache local notification
      await service.cacheAlert(mockNotificationData);
      
      // Create conflicting remote notification
      const conflictingRemote = {
        ...mockNotificationData,
        title: 'Conflicting Title',
        timestamp: mockNotificationData.timestamp - 1000 // Older
      };
      
      await service.syncWithRemoteNotifications([conflictingRemote]);
      
      const conflicts = service.getConflicts();
      expect(conflicts).toHaveLength(1);
      
      // Manually resolve to use local
      await service.resolveConflict(0, 'use_local');
      
      const resolvedConflicts = service.getConflicts();
      expect(resolvedConflicts).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle notification scheduling errors gracefully', async () => {
      mockNotifications.scheduleNotificationAsync.mockRejectedValue(
        new Error('Scheduling failed')
      );
      
      await expect(
        service.scheduleLocalNotification(mockNotificationData)
      ).rejects.toThrow('Scheduling failed');
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      // Should not throw, but log error
      await expect(service.cacheAlert(mockNotificationData)).resolves.not.toThrow();
    });

    it('should handle cancellation errors gracefully', async () => {
      mockNotifications.cancelScheduledNotificationAsync.mockRejectedValue(
        new Error('Cancel failed')
      );
      
      // Should not throw
      await expect(service.cancelLocalNotification('invalid-id')).resolves.not.toThrow();
    });
  });
});