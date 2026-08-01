/**
 * NavigationHandler Tests
 * Tests navigation functionality, deep linking, and badge counter integration
 */

import { NavigationHandler } from '../NavigationHandler';
import { NotificationData } from '../../../types/notification';
import { badgeCounterService } from '../BadgeCounterService';

// Mock React Navigation
const mockNavigate = jest.fn();
const mockIsReady = jest.fn();
const mockNavigationRef = {
  navigate: mockNavigate,
  isReady: mockIsReady,
} as any;

// Mock Linking
jest.mock('react-native', () => ({
  Linking: {
    addEventListener: jest.fn(),
    getInitialURL: jest.fn(),
  },
}));

// Mock BadgeCounterService
jest.mock('../BadgeCounterService', () => ({
  badgeCounterService: {
    decrementBadgeCount: jest.fn(),
  },
}));

describe('NavigationHandler', () => {
  let navigationHandler: NavigationHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsReady.mockReturnValue(true);
    navigationHandler = new NavigationHandler(mockNavigationRef);
  });

  describe('handleNotificationPress', () => {
    it('should navigate to alerts screen for alert notification without alertId', () => {
      const notification: NotificationData = {
        id: '1',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test alert body',
        timestamp: Date.now(),
      };

      navigationHandler.handleNotificationPress(notification);

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Alerts',
        params: {
          screen: 'AlertsList',
        },
      });
      expect(badgeCounterService.decrementBadgeCount).toHaveBeenCalledWith('alerts_tab', 1);
      expect(badgeCounterService.decrementBadgeCount).toHaveBeenCalledWith('header', 1);
      expect(badgeCounterService.decrementBadgeCount).toHaveBeenCalledWith('home_cards', 1);
    });

    it('should navigate to alert details for alert notification with alertId', () => {
      const notification: NotificationData = {
        id: '1',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test alert body',
        timestamp: Date.now(),
        data: { alertId: '123' },
      };

      navigationHandler.handleNotificationPress(notification);

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Alerts',
        params: {
          screen: 'AlertDetails',
          params: { alertId: 123 },
        },
      });
    });

    it('should navigate to SOS screen for SOS notification with incidentId', () => {
      const notification: NotificationData = {
        id: '2',
        type: 'sos',
        severity: 'critical',
        title: 'SOS Alert',
        body: 'Emergency SOS',
        timestamp: Date.now(),
        data: { incidentId: '456' },
      };

      navigationHandler.handleNotificationPress(notification);

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'SOS',
      });
      expect(badgeCounterService.decrementBadgeCount).toHaveBeenCalledWith('header', 1);
    });

    it('should navigate to incident details for incident notification', () => {
      const notification: NotificationData = {
        id: '3',
        type: 'incident',
        severity: 'medium',
        title: 'Incident Report',
        body: 'New incident reported',
        timestamp: Date.now(),
        data: { incidentId: '789' },
      };

      navigationHandler.handleNotificationPress(notification);

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Incidents',
        params: {
          screen: 'IncidentDetails',
          params: { incidentId: 789 },
        },
      });
    });

    it('should navigate to home for unknown notification type', () => {
      const notification: NotificationData = {
        id: '4',
        type: 'unknown' as any,
        severity: 'low',
        title: 'Unknown',
        body: 'Unknown notification',
        timestamp: Date.now(),
      };

      navigationHandler.handleNotificationPress(notification);

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Home',
      });
    });

    it('should fallback to home when navigation is not ready', () => {
      mockIsReady.mockReturnValue(false);
      
      const notification: NotificationData = {
        id: '1',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test alert body',
        timestamp: Date.now(),
      };

      navigationHandler.handleNotificationPress(notification);

      // When navigation is not ready, it should warn and not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle navigation errors gracefully', () => {
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation error');
      });

      const notification: NotificationData = {
        id: '1',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test alert body',
        timestamp: Date.now(),
      };

      expect(() => navigationHandler.handleNotificationPress(notification)).not.toThrow();
      
      // Reset the mock for other tests
      mockNavigate.mockReset();
    });
  });

  describe('deep linking', () => {
    it('should handle deep link to alerts', () => {
      const url = 'safehaven://alerts';
      navigationHandler.handleDeepLink(url);

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Alerts',
        params: {
          screen: 'AlertsList',
        },
      });
    });

    it('should handle deep link to alert details', () => {
      const url = 'safehaven://alerts?alertId=123';
      navigationHandler.handleDeepLink(url);

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Alerts',
        params: {
          screen: 'AlertDetails',
          params: { alertId: 123 },
        },
      });
    });

    it('should handle deep link to SOS with incident ID', () => {
      const url = 'safehaven://sos?incidentId=456';
      navigationHandler.handleDeepLink(url);

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'SOS',
      });
    });

    it('should handle deep link to incidents', () => {
      const url = 'safehaven://incidents?incidentId=789';
      navigationHandler.handleDeepLink(url);

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Incidents',
        params: {
          screen: 'IncidentDetails',
          params: { incidentId: 789 },
        },
      });
    });

    it('should fallback to home for invalid deep links', () => {
      const url = 'invalid-url';
      navigationHandler.handleDeepLink(url);

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Home',
      });
    });
  });

  describe('generateDeepLinkUrl', () => {
    it('should generate correct URL for alert notification', () => {
      const notification: NotificationData = {
        id: '1',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test alert body',
        timestamp: Date.now(),
        data: { alertId: '123' },
      };

      const url = navigationHandler.generateDeepLinkUrl(notification);
      expect(url).toBe('safehaven://alerts?alertId=123');
    });

    it('should generate correct URL for SOS notification', () => {
      const notification: NotificationData = {
        id: '2',
        type: 'sos',
        severity: 'critical',
        title: 'SOS Alert',
        body: 'Emergency SOS',
        timestamp: Date.now(),
        data: { incidentId: '456' },
      };

      const url = navigationHandler.generateDeepLinkUrl(notification);
      expect(url).toBe('safehaven://sos?incidentId=456');
    });

    it('should generate correct URL for incident notification', () => {
      const notification: NotificationData = {
        id: '3',
        type: 'incident',
        severity: 'medium',
        title: 'Incident Report',
        body: 'New incident reported',
        timestamp: Date.now(),
        data: { incidentId: '789' },
      };

      const url = navigationHandler.generateDeepLinkUrl(notification);
      expect(url).toBe('safehaven://incidents?incidentId=789');
    });

    it('should generate base URL when no specific ID is provided', () => {
      const notification: NotificationData = {
        id: '1',
        type: 'alert',
        severity: 'high',
        title: 'Test Alert',
        body: 'Test alert body',
        timestamp: Date.now(),
      };

      const url = navigationHandler.generateDeepLinkUrl(notification);
      expect(url).toBe('safehaven://alerts');
    });
  });

  describe('navigation utilities', () => {
    it('should check if navigation is ready', () => {
      mockIsReady.mockReturnValue(true);
      expect(navigationHandler.isNavigationReady()).toBe(true);

      mockIsReady.mockReturnValue(false);
      expect(navigationHandler.isNavigationReady()).toBe(false);
    });

    it('should handle navigation to home screen', () => {
      navigationHandler.navigateToHome();

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Home',
      });
    });

    it('should handle navigation to alerts screen', () => {
      navigationHandler.navigateToAlerts();

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Alerts',
        params: {
          screen: 'AlertsList',
        },
      });
    });

    it('should handle navigation to incident with ID', () => {
      navigationHandler.navigateToIncident('123');

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Incidents',
        params: {
          screen: 'IncidentDetails',
          params: { incidentId: 123 },
        },
      });
    });

    it('should navigate to incidents list when no incident ID provided', () => {
      navigationHandler.navigateToIncident('');

      expect(mockNavigate).toHaveBeenCalledWith('Main', {
        screen: 'Incidents',
        params: {
          screen: 'IncidentsList',
        },
      });
    });
  });
});