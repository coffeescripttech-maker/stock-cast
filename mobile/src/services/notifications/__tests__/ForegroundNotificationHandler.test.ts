/**
 * ForegroundNotificationHandler Tests
 * Tests for foreground notification handling functionality
 */

import { AppState } from 'react-native';
import { ForegroundNotificationHandler } from '../ForegroundNotificationHandler';
import { NotificationData } from '../../../types/notification';

// Mock AppState
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })), // Return subscription object
  },
}));

describe('ForegroundNotificationHandler', () => {
  let handler: ForegroundNotificationHandler;
  let mockNotificationCallback: jest.Mock;
  let mockDismissCallback: jest.Mock;

  const mockNotification: NotificationData = {
    id: 'test-notification-1',
    type: 'alert',
    severity: 'high',
    title: 'Test Alert',
    body: 'This is a test alert notification',
    timestamp: Date.now(),
  };

  beforeEach(() => {
    handler = new ForegroundNotificationHandler();
    mockNotificationCallback = jest.fn();
    mockDismissCallback = jest.fn();
    
    handler.setNotificationCallback(mockNotificationCallback);
    handler.setDismissCallback(mockDismissCallback);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    handler.cleanup();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(() => handler.initialize()).not.toThrow();
    });

    it('should not initialize twice', () => {
      handler.initialize();
      handler.initialize(); // Should not throw or cause issues
      expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('app state detection', () => {
    it('should detect when app is in foreground', () => {
      (AppState as any).currentState = 'active';
      expect(handler.isAppInForeground()).toBe(true);
    });

    it('should detect when app is not in foreground', () => {
      (AppState as any).currentState = 'background';
      expect(handler.isAppInForeground()).toBe(false);
    });
  });

  describe('notification display', () => {
    beforeEach(() => {
      handler.initialize();
      (AppState as any).currentState = 'active';
    });

    it('should show notification when app is in foreground', () => {
      handler.showNotification(mockNotification);
      
      expect(mockNotificationCallback).toHaveBeenCalledWith(mockNotification);
      expect(handler.getCurrentNotification()).toEqual(mockNotification);
    });

    it('should not show notification when app is in background', () => {
      (AppState as any).currentState = 'background';
      
      handler.showNotification(mockNotification);
      
      expect(mockNotificationCallback).not.toHaveBeenCalled();
      expect(handler.getCurrentNotification()).toBeNull();
    });

    it('should hide notification', () => {
      handler.showNotification(mockNotification);
      handler.hideNotification();
      
      expect(mockDismissCallback).toHaveBeenCalled();
      expect(handler.getCurrentNotification()).toBeNull();
    });
  });

  describe('callback management', () => {
    it('should set notification callback', () => {
      const newCallback = jest.fn();
      handler.setNotificationCallback(newCallback);
      
      handler.initialize();
      (AppState as any).currentState = 'active';
      handler.showNotification(mockNotification);
      
      expect(newCallback).toHaveBeenCalledWith(mockNotification);
    });

    it('should set dismiss callback', () => {
      const newDismissCallback = jest.fn();
      handler.setDismissCallback(newDismissCallback);
      
      handler.initialize();
      (AppState as any).currentState = 'active';
      handler.showNotification(mockNotification);
      handler.hideNotification();
      
      expect(newDismissCallback).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', () => {
      handler.initialize();
      handler.showNotification(mockNotification);
      
      handler.cleanup();
      
      expect(AppState.addEventListener).toHaveBeenCalled();
      expect(handler.getCurrentNotification()).toBeNull();
    });
  });

  describe('current notification management', () => {
    beforeEach(() => {
      handler.initialize();
      (AppState as any).currentState = 'active';
    });

    it('should get current notification', () => {
      handler.showNotification(mockNotification);
      expect(handler.getCurrentNotification()).toEqual(mockNotification);
    });

    it('should clear current notification without callbacks', () => {
      handler.showNotification(mockNotification);
      handler.clearCurrentNotification();
      
      expect(handler.getCurrentNotification()).toBeNull();
      expect(mockDismissCallback).not.toHaveBeenCalled();
    });
  });
});