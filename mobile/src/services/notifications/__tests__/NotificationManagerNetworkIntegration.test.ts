/**
 * NotificationManager Network Integration Tests
 * Tests the integration between NotificationManager and NetworkSyncService
 */

// Mock dependencies before importing
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

import { NotificationManager } from '../NotificationManager';
import { NetworkSyncService } from '../NetworkSyncService';
import { NotificationData } from '../../../types/notification';
import * as Notifications from 'expo-notifications';

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

describe('NotificationManager Network Integration', () => {
  let notificationManager: NotificationManager;
  let mockNetworkSyncService: jest.Mocked<NetworkSyncService>;
  let mockBadgeService: any;
  let mockAudioService: any;
  let mockHapticService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock services
    mockBadgeService = {
      updateBadgeCount: jest.fn(),
      incrementBadgeCount: jest.fn(),
      getBadgeCount: jest.fn().mockReturnValue(0),
      clearBadge: jest.fn(),
      clearAllBadges: jest.fn(),
      subscribeToBadgeUpdates: jest.fn()
    };

    mockAudioService = {
      playAlert: jest.fn().mockResolvedValue(undefined),
      preloadSounds: jest.fn().mockResolvedValue(undefined),
      setEnabled: jest.fn(),
      isEnabled: jest.fn().mockReturnValue(true)
    };

    mockHapticService = {
      triggerFeedback: jest.fn().mockResolvedValue(undefined),
      setEnabled: jest.fn(),
      isEnabled: jest.fn().mockReturnValue(true),
      isSupported: jest.fn().mockReturnValue(true)
    };

    mockNetworkSyncService = {
      initialize: jest.fn().mockResolvedValue(undefined),
      addPendingNotification: jest.fn().mockResolvedValue(undefined),
      addPendingSyncOperation: jest.fn().mockResolvedValue(undefined),
      syncWhenOnline: jest.fn().mockResolvedValue(undefined),
      isOnline: jest.fn().mockReturnValue(true),
      retryFailedOperation: jest.fn(),
      getPendingOperationsCount: jest.fn().mockReturnValue({ notifications: 0, operations: 0 }),
      getLastSyncTimestamp: jest.fn().mockResolvedValue(Date.now()),
      clearPendingOperations: jest.fn().mockResolvedValue(undefined)
    } as any;

    // Mock expo-notifications
    mockNotifications.setNotificationHandler.mockImplementation(() => {});
    mockNotifications.setNotificationChannelAsync.mockResolvedValue();
    mockNotifications.addNotificationReceivedListener.mockReturnValue({ remove: jest.fn() });
    mockNotifications.addNotificationResponseReceivedListener.mockReturnValue({ remove: jest.fn() });
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'test-token' } as any);

    notificationManager = new NotificationManager(
      undefined, // navigationHandler
      mockBadgeService,
      mockAudioService,
      mockHapticService,
      undefined, // foregroundHandler
      mockNetworkSyncService
    );
  });

  describe('initialization with network sync', () => {
    it('should initialize network sync service during initialization', async () => {
      await notificationManager.initialize();
      
      expect(mockNetworkSyncService.initialize).toHaveBeenCalled();
    });
  });

  describe('notification handling with network awareness', () => {
    beforeEach(async () => {
      await notificationManager.initialize();
    });

    it('should add notification to pending queue when offline', async () => {
      mockNetworkSyncService.isOnline.mockReturnValue(false);
      
      const notification: NotificationData = {
        id: 'test-notification',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test message',
        timestamp: Date.now()
      };

      await notificationManager.handleNotification(notification);
      
      expect(mockNetworkSyncService.addPendingNotification).toHaveBeenCalledWith(notification);
      expect(mockBadgeService.incrementBadgeCount).toHaveBeenCalled();
    });

    it('should process notification normally when online', async () => {
      mockNetworkSyncService.isOnline.mockReturnValue(true);
      mockNetworkSyncService.retryFailedOperation.mockImplementation((fn) => fn());
      
      const notification: NotificationData = {
        id: 'test-notification',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test message',
        timestamp: Date.now()
      };

      await notificationManager.handleNotification(notification);
      
      expect(mockNetworkSyncService.addPendingNotification).not.toHaveBeenCalled();
      expect(mockBadgeService.incrementBadgeCount).toHaveBeenCalled();
      expect(mockNetworkSyncService.retryFailedOperation).toHaveBeenCalledTimes(2); // Audio and haptic
    });

    it('should handle audio service failures gracefully', async () => {
      mockNetworkSyncService.isOnline.mockReturnValue(true);
      mockNetworkSyncService.retryFailedOperation.mockImplementation((fn) => {
        if (fn === mockAudioService.playAlert) {
          return Promise.reject(new Error('Audio failed'));
        }
        return fn();
      });
      
      const notification: NotificationData = {
        id: 'test-notification',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test message',
        timestamp: Date.now()
      };

      // Should not throw error despite audio failure
      await expect(notificationManager.handleNotification(notification)).resolves.not.toThrow();
      
      expect(mockBadgeService.incrementBadgeCount).toHaveBeenCalled();
    });

    it('should handle haptic service failures gracefully', async () => {
      mockNetworkSyncService.isOnline.mockReturnValue(true);
      mockNetworkSyncService.retryFailedOperation.mockImplementation((fn) => {
        if (fn === mockHapticService.triggerFeedback) {
          return Promise.reject(new Error('Haptic failed'));
        }
        return fn();
      });
      
      const notification: NotificationData = {
        id: 'test-notification',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test message',
        timestamp: Date.now()
      };

      // Should not throw error despite haptic failure
      await expect(notificationManager.handleNotification(notification)).resolves.not.toThrow();
      
      expect(mockBadgeService.incrementBadgeCount).toHaveBeenCalled();
    });

    it('should update badges even when all services fail', async () => {
      mockNetworkSyncService.isOnline.mockReturnValue(true);
      mockNetworkSyncService.retryFailedOperation.mockRejectedValue(new Error('All services failed'));
      
      const notification: NotificationData = {
        id: 'test-notification',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test message',
        timestamp: Date.now()
      };

      await notificationManager.handleNotification(notification);
      
      expect(mockBadgeService.incrementBadgeCount).toHaveBeenCalled();
    });
  });

  describe('device token registration with network sync', () => {
    beforeEach(async () => {
      await notificationManager.initialize();
    });

    it('should register token with retry logic when online', async () => {
      mockNetworkSyncService.isOnline.mockReturnValue(true);
      mockNetworkSyncService.retryFailedOperation.mockResolvedValue(undefined);
      
      const token = await notificationManager.registerDeviceToken();
      
      expect(token).toBe('test-token');
      expect(mockNetworkSyncService.retryFailedOperation).toHaveBeenCalled();
    });

    it('should add token registration to sync queue when online but registration fails', async () => {
      mockNetworkSyncService.isOnline.mockReturnValue(true);
      mockNetworkSyncService.retryFailedOperation.mockRejectedValue(new Error('Registration failed'));
      
      const token = await notificationManager.registerDeviceToken();
      
      expect(token).toBe('test-token');
      expect(mockNetworkSyncService.addPendingSyncOperation).toHaveBeenCalledWith({
        type: 'device_token_registration',
        data: {
          deviceToken: 'test-token',
          platform: expect.any(String),
          userId: 'current_user_id'
        },
        maxRetries: 5
      });
    });

    it('should add token registration to sync queue when offline', async () => {
      mockNetworkSyncService.isOnline.mockReturnValue(false);
      
      const token = await notificationManager.registerDeviceToken();
      
      expect(token).toBe('test-token');
      expect(mockNetworkSyncService.addPendingSyncOperation).toHaveBeenCalledWith({
        type: 'device_token_registration',
        data: {
          deviceToken: 'test-token',
          platform: expect.any(String),
          userId: 'current_user_id'
        },
        maxRetries: 5
      });
    });
  });

  describe('network-aware utility methods', () => {
    beforeEach(async () => {
      await notificationManager.initialize();
    });

    it('should sync notifications', async () => {
      await notificationManager.syncNotifications();
      
      expect(mockNetworkSyncService.syncWhenOnline).toHaveBeenCalled();
    });

    it('should check online status', () => {
      mockNetworkSyncService.isOnline.mockReturnValue(true);
      
      expect(notificationManager.isOnline()).toBe(true);
      expect(mockNetworkSyncService.isOnline).toHaveBeenCalled();
    });

    it('should get pending operations count', () => {
      const mockCount = { notifications: 5, operations: 3 };
      mockNetworkSyncService.getPendingOperationsCount.mockReturnValue(mockCount);
      
      const count = notificationManager.getPendingOperationsCount();
      
      expect(count).toEqual(mockCount);
      expect(mockNetworkSyncService.getPendingOperationsCount).toHaveBeenCalled();
    });

    it('should handle network failure', async () => {
      const error = new Error('Network error');
      
      await notificationManager.handleNetworkFailure('test-operation', error);
      
      expect(mockNetworkSyncService.addPendingSyncOperation).toHaveBeenCalledWith({
        type: 'notification_sync',
        data: {
          operation: 'test-operation',
          error: 'Network error',
          timestamp: expect.any(Number)
        },
        maxRetries: 3
      });
    });

    it('should get last sync timestamp', async () => {
      const timestamp = Date.now();
      mockNetworkSyncService.getLastSyncTimestamp.mockResolvedValue(timestamp);
      
      const result = await notificationManager.getLastSyncTimestamp();
      
      expect(result).toBe(timestamp);
      expect(mockNetworkSyncService.getLastSyncTimestamp).toHaveBeenCalled();
    });
  });

  describe('error handling and graceful degradation', () => {
    beforeEach(async () => {
      await notificationManager.initialize();
    });

    it('should handle network sync service errors gracefully', async () => {
      mockNetworkSyncService.addPendingNotification.mockRejectedValue(new Error('Sync service error'));
      
      const notification: NotificationData = {
        id: 'test-notification',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test message',
        timestamp: Date.now()
      };

      // Should not throw error
      await expect(notificationManager.handleNotification(notification)).resolves.not.toThrow();
      
      // Should still update badges
      expect(mockBadgeService.incrementBadgeCount).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      mockNetworkSyncService.syncWhenOnline.mockRejectedValue(new Error('Sync error'));
      
      // Should not throw error
      await expect(notificationManager.syncNotifications()).resolves.not.toThrow();
    });

    it('should handle network failure logging errors gracefully', async () => {
      mockNetworkSyncService.addPendingSyncOperation.mockRejectedValue(new Error('Logging error'));
      
      const error = new Error('Network error');
      
      // Should not throw error
      await expect(notificationManager.handleNetworkFailure('test-operation', error)).resolves.not.toThrow();
    });
  });
});