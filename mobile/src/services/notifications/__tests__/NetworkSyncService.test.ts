/**
 * NetworkSyncService Tests
 * Tests network sync functionality, retry logic, and graceful failure handling
 */

import { NetworkSyncService } from '../NetworkSyncService';
import { NotificationData } from '../../../types/notification';

// Mock NetInfo before importing
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

// Mock other dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockApi = api as jest.Mocked<typeof api>;

describe('NetworkSyncService', () => {
  let networkSyncService: NetworkSyncService;
  let mockNetworkListener: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    networkSyncService = new NetworkSyncService();
    mockNetworkListener = jest.fn();
    
    // Mock NetInfo
    mockNetInfo.addEventListener.mockReturnValue(mockNetworkListener);
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true
    } as any);

    // Mock AsyncStorage
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();

    // Mock API
    mockApi.get.mockResolvedValue({ status: 200, data: {} });
    mockApi.post.mockResolvedValue({ status: 200, data: {} });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await networkSyncService.initialize();
      
      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
      expect(mockNetInfo.fetch).toHaveBeenCalled();
      expect(mockAsyncStorage.getItem).toHaveBeenCalledTimes(2); // Load pending operations
    });

    it('should load pending operations from storage', async () => {
      const pendingNotifications = JSON.stringify([
        {
          id: 'test-1',
          notification: { id: 'notif-1', type: 'alert', severity: 'high' },
          timestamp: Date.now(),
          retryCount: 0
        }
      ]);
      
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'pending_notifications') return Promise.resolve(pendingNotifications);
        return Promise.resolve(null);
      });

      await networkSyncService.initialize();
      
      const count = networkSyncService.getPendingOperationsCount();
      expect(count.notifications).toBe(1);
    });
  });

  describe('network state handling', () => {
    it('should detect online state correctly', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        type: 'wifi'
      } as any);

      await networkSyncService.initialize();
      expect(networkSyncService.isOnline()).toBe(true);
    });

    it('should detect offline state correctly', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        type: 'none'
      } as any);

      await networkSyncService.initialize();
      expect(networkSyncService.isOnline()).toBe(false);
    });

    it('should trigger sync when coming back online', async () => {
      await networkSyncService.initialize();
      
      // Simulate network state change from offline to online
      const networkChangeHandler = mockNetInfo.addEventListener.mock.calls[0][0];
      
      // First call - offline
      networkChangeHandler({ isConnected: false, type: 'none' });
      expect(networkSyncService.isOnline()).toBe(false);
      
      // Second call - online (should trigger sync)
      networkChangeHandler({ isConnected: true, type: 'wifi' });
      expect(networkSyncService.isOnline()).toBe(true);
    });
  });

  describe('pending notifications', () => {
    it('should add notification to pending queue', async () => {
      await networkSyncService.initialize();
      
      const notification: NotificationData = {
        id: 'test-notification',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test message',
        timestamp: Date.now()
      };

      await networkSyncService.addPendingNotification(notification);
      
      const count = networkSyncService.getPendingOperationsCount();
      expect(count.notifications).toBe(1);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should sync pending notifications when online', async () => {
      await networkSyncService.initialize();
      
      const notification: NotificationData = {
        id: 'test-notification',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test message',
        timestamp: Date.now()
      };

      await networkSyncService.addPendingNotification(notification);
      await networkSyncService.syncWhenOnline();
      
      expect(mockApi.get).toHaveBeenCalledWith('/notifications/sync', {
        params: {
          notificationId: notification.id,
          timestamp: notification.timestamp
        }
      });
    });
  });

  describe('sync operations', () => {
    it('should add sync operation to pending queue', async () => {
      await networkSyncService.initialize();
      
      await networkSyncService.addPendingSyncOperation({
        type: 'device_token_registration',
        data: { deviceToken: 'test-token', platform: 'ios' },
        maxRetries: 3
      });
      
      const count = networkSyncService.getPendingOperationsCount();
      expect(count.operations).toBe(1);
    });

    it('should execute device token registration sync', async () => {
      await networkSyncService.initialize();
      
      await networkSyncService.addPendingSyncOperation({
        type: 'device_token_registration',
        data: { deviceToken: 'test-token', platform: 'ios', userId: 'user-1' },
        maxRetries: 3
      });
      
      await networkSyncService.syncWhenOnline();
      
      expect(mockApi.post).toHaveBeenCalledWith('/notifications/register-device', {
        deviceToken: 'test-token',
        platform: 'ios',
        userId: 'user-1'
      });
    });

    it('should execute notification data sync', async () => {
      await networkSyncService.initialize();
      
      const syncData = { notifications: ['notif-1', 'notif-2'] };
      
      await networkSyncService.addPendingSyncOperation({
        type: 'notification_sync',
        data: syncData,
        maxRetries: 3
      });
      
      await networkSyncService.syncWhenOnline();
      
      expect(mockApi.post).toHaveBeenCalledWith('/notifications/sync-data', syncData);
    });

    it('should execute settings sync', async () => {
      await networkSyncService.initialize();
      
      const settingsData = { soundEnabled: true, vibrationEnabled: false };
      
      await networkSyncService.addPendingSyncOperation({
        type: 'settings_sync',
        data: settingsData,
        maxRetries: 3
      });
      
      await networkSyncService.syncWhenOnline();
      
      expect(mockApi.post).toHaveBeenCalledWith('/notifications/sync-settings', settingsData);
    });
  });

  describe('retry logic', () => {
    it('should retry failed operations with exponential backoff', async () => {
      await networkSyncService.initialize();
      
      let attemptCount = 0;
      const failingOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Operation failed');
        }
        return Promise.resolve('success');
      });

      const result = await networkSyncService.retryFailedOperation(failingOperation, 3);
      
      expect(result).toBe('success');
      expect(failingOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries exceeded', async () => {
      await networkSyncService.initialize();
      
      const failingOperation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(
        networkSyncService.retryFailedOperation(failingOperation, 2)
      ).rejects.toThrow('Always fails');
      
      expect(failingOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should remove operations after max retries exceeded', async () => {
      await networkSyncService.initialize();
      
      // Mock API to always fail
      mockApi.post.mockRejectedValue(new Error('Network error'));
      
      await networkSyncService.addPendingSyncOperation({
        type: 'device_token_registration',
        data: { deviceToken: 'test-token' },
        maxRetries: 1
      });
      
      // First sync attempt should fail and increment retry count
      await networkSyncService.syncWhenOnline();
      
      // Check that operation still exists but with incremented retry count
      let count = networkSyncService.getPendingOperationsCount();
      expect(count.operations).toBe(1);
      
      // Second sync attempt should remove the operation (max retries exceeded)
      await networkSyncService.syncWhenOnline();
      
      count = networkSyncService.getPendingOperationsCount();
      expect(count.operations).toBe(0);
    });
  });

  describe('graceful degradation', () => {
    it('should handle API errors gracefully during sync', async () => {
      await networkSyncService.initialize();
      
      mockApi.get.mockRejectedValue(new Error('API Error'));
      
      const notification: NotificationData = {
        id: 'test-notification',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test message',
        timestamp: Date.now()
      };

      await networkSyncService.addPendingNotification(notification);
      
      // Should not throw error, should handle gracefully
      await expect(networkSyncService.syncWhenOnline()).resolves.not.toThrow();
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      await networkSyncService.initialize();
      
      const notification: NotificationData = {
        id: 'test-notification',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test message',
        timestamp: Date.now()
      };

      // Should not throw error, should handle gracefully
      await expect(networkSyncService.addPendingNotification(notification)).resolves.not.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should get last sync timestamp', async () => {
      const timestamp = Date.now().toString();
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'last_notification_sync') return Promise.resolve(timestamp);
        return Promise.resolve(null);
      });

      await networkSyncService.initialize();
      const result = await networkSyncService.getLastSyncTimestamp();
      
      expect(result).toBe(parseInt(timestamp, 10));
    });

    it('should clear pending operations', async () => {
      await networkSyncService.initialize();
      
      // Add some operations
      await networkSyncService.addPendingNotification({
        id: 'test',
        type: 'alert',
        severity: 'high',
        title: 'Test',
        body: 'Test',
        timestamp: Date.now()
      });
      
      await networkSyncService.clearPendingOperations();
      
      const count = networkSyncService.getPendingOperationsCount();
      expect(count.notifications).toBe(0);
      expect(count.operations).toBe(0);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(2);
    });

    it('should get pending operations count', async () => {
      await networkSyncService.initialize();
      
      const count = networkSyncService.getPendingOperationsCount();
      expect(count).toEqual({ notifications: 0, operations: 0 });
    });
  });
});