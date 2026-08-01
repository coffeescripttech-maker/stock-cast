/**
 * NotificationManager tests
 * Basic tests to verify notification infrastructure setup
 */

import { NotificationManager } from '../NotificationManager';
import { NotificationData } from '../../../types/notification';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'test-token' })),
  setBadgeCountAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('test-id')),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('NotificationManager', () => {
  let notificationManager: NotificationManager;

  beforeEach(() => {
    notificationManager = new NotificationManager();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(notificationManager.initialize()).resolves.not.toThrow();
    });

    it('should not initialize twice', async () => {
      await notificationManager.initialize();
      await notificationManager.initialize(); // Should not throw
    });
  });

  describe('permission handling', () => {
    it('should request permissions successfully', async () => {
      const result = await notificationManager.requestPermissions();
      expect(result).toBe(true);
    });

    it('should register device token successfully', async () => {
      const token = await notificationManager.registerDeviceToken();
      expect(token).toBe('test-token');
    });
  });

  describe('notification handling', () => {
    const mockNotification: NotificationData = {
      id: 'test-1',
      type: 'alert',
      severity: 'high',
      title: 'Test Alert',
      body: 'This is a test alert',
      timestamp: Date.now(),
    };

    it('should handle notification without throwing', async () => {
      await expect(notificationManager.handleNotification(mockNotification)).resolves.not.toThrow();
    });

    it('should update badge count', () => {
      expect(() => notificationManager.updateBadgeCount(5)).not.toThrow();
    });
  });

  describe('local notifications', () => {
    it('should schedule local notification', async () => {
      const id = await notificationManager.scheduleLocalNotification(
        'Test Title',
        'Test Body'
      );
      expect(id).toBe('test-id');
    });

    it('should cancel notification', async () => {
      await expect(notificationManager.cancelNotification('test-id')).resolves.not.toThrow();
    });

    it('should cancel all notifications', async () => {
      await expect(notificationManager.cancelAllNotifications()).resolves.not.toThrow();
    });

    it('should get scheduled notifications', async () => {
      const notifications = await notificationManager.getScheduledNotifications();
      expect(Array.isArray(notifications)).toBe(true);
    });
  });
});