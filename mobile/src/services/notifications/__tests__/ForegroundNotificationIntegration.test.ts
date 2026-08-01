/**
 * ForegroundNotificationIntegration Tests
 * Tests for the complete foreground notification integration
 */

import { ForegroundNotificationIntegration } from '../ForegroundNotificationIntegration';
import { NotificationData } from '../../../types/notification';

// Mock dependencies
jest.mock('../NotificationManager');
jest.mock('../NavigationHandler');
jest.mock('../BadgeCounterService');
jest.mock('../ForegroundNotificationHandler');

// Mock navigation ref
const mockNavigationRef = {
  isReady: jest.fn(() => true),
  navigate: jest.fn(),
} as any;

describe('ForegroundNotificationIntegration', () => {
  let integration: ForegroundNotificationIntegration;

  const mockNotification: NotificationData = {
    id: 'test-notification-1',
    type: 'alert',
    severity: 'critical',
    title: 'Emergency Alert',
    body: 'This is an emergency alert notification',
    timestamp: Date.now(),
  };

  beforeEach(() => {
    integration = new ForegroundNotificationIntegration();
    jest.clearAllMocks();
  });

  afterEach(() => {
    integration.cleanup();
  });

  describe('initialization', () => {
    it('should initialize successfully with navigation ref', async () => {
      await expect(integration.initialize(mockNavigationRef)).resolves.not.toThrow();
      expect(integration.isReady()).toBe(true);
    });

    it('should not initialize twice', async () => {
      await integration.initialize(mockNavigationRef);
      await integration.initialize(mockNavigationRef); // Should not throw
      expect(integration.isReady()).toBe(true);
    });
  });

  describe('notification handling', () => {
    beforeEach(async () => {
      await integration.initialize(mockNavigationRef);
    });

    it('should handle notification press', () => {
      expect(() => integration.handleNotificationPress(mockNotification)).not.toThrow();
    });

    it('should handle different notification types', () => {
      const alertNotification = { ...mockNotification, type: 'alert' as const };
      const sosNotification = { ...mockNotification, type: 'sos' as const };
      const incidentNotification = { ...mockNotification, type: 'incident' as const };

      expect(() => integration.handleNotificationPress(alertNotification)).not.toThrow();
      expect(() => integration.handleNotificationPress(sosNotification)).not.toThrow();
      expect(() => integration.handleNotificationPress(incidentNotification)).not.toThrow();
    });
  });

  describe('service access', () => {
    beforeEach(async () => {
      await integration.initialize(mockNavigationRef);
    });

    it('should provide access to notification manager', () => {
      const notificationManager = integration.getNotificationManager();
      expect(notificationManager).toBeDefined();
    });

    it('should provide access to navigation handler', () => {
      const navigationHandler = integration.getNavigationHandler();
      expect(navigationHandler).toBeDefined();
    });
  });

  describe('readiness check', () => {
    it('should not be ready before initialization', () => {
      expect(integration.isReady()).toBe(false);
    });

    it('should be ready after initialization', async () => {
      await integration.initialize(mockNavigationRef);
      expect(integration.isReady()).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', async () => {
      await integration.initialize(mockNavigationRef);
      expect(integration.isReady()).toBe(true);
      
      integration.cleanup();
      expect(integration.isReady()).toBe(false);
    });
  });
});