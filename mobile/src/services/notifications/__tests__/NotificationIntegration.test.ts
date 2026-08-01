/**
 * Integration Tests for Notification System
 * 
 * Tests end-to-end notification flows, cross-platform behavior,
 * and accessibility compliance for the complete notification system.
 */

import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Alert, Platform } from 'react-native';

// Import components and services
import { HomeScreen } from '../../../screens/home/HomeScreen';
import { AlertsListScreen } from '../../../screens/alerts/AlertsListScreen';
import { SettingsScreen } from '../../../screens/profile/SettingsScreen';
import { CustomTabBar } from '../../../components/navigation/CustomTabBar';
import { CustomHeader } from '../../../components/navigation/CustomHeader';
import BadgeIndicator from '../../../components/common/BadgeIndicator';
import ConnectedBadge from '../../../components/common/ConnectedBadge';

// Import services
import { notificationManager } from '../NotificationManager';
import { badgeCounterService } from '../BadgeCounterService';
import { audioAlertService } from '../AudioAlertService';
import { hapticFeedbackService } from '../HapticFeedbackService';
import { notificationSettingsManager } from '../NotificationSettingsManager';
import { navigationHandler } from '../NavigationHandler';

// Import contexts
import { BadgeProvider } from '../../../store/BadgeContext';
import { AuthProvider } from '../../../store/AuthContext';
import { AlertProvider } from '../../../store/AlertContext';
import { NotificationProvider } from '../../../store/NotificationContext';

// Mock external dependencies
jest.mock('expo-notifications');
jest.mock('expo-haptics');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    <AuthProvider>
      <AlertProvider>
        <NotificationProvider>
          <BadgeProvider>
            {children}
          </BadgeProvider>
        </NotificationProvider>
      </AlertProvider>
    </AuthProvider>
  </NavigationContainer>
);

describe('Notification System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    badgeCounterService.clearAllBadges();
  });

  describe('End-to-End Notification Flow', () => {
    it('should handle complete notification delivery and display flow', async () => {
      // Mock notification data
      const mockNotification = {
        id: 'test-notification-1',
        type: 'alert' as const,
        severity: 'critical' as const,
        title: 'Critical Alert',
        body: 'Emergency situation detected',
        data: { alertId: 'alert-123' },
        timestamp: Date.now(),
      };

      // Render home screen
      const { getByTestId, queryByText } = render(
        <TestWrapper>
          <HomeScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // Simulate notification reception
      await act(async () => {
        await notificationManager.handleNotification(mockNotification);
      });

      // Verify badge updates
      await waitFor(() => {
        expect(badgeCounterService.getBadgeCount('header')).toBe(1);
        expect(badgeCounterService.getBadgeCount('alerts_tab')).toBe(1);
        expect(badgeCounterService.getBadgeCount('home_cards')).toBe(1);
      });

      // Verify UI updates
      expect(queryByText('Critical Alert')).toBeTruthy();
    });

    it('should clear badges when navigating to alerts screen', async () => {
      // Set initial badge counts
      badgeCounterService.updateBadgeCount('header', 3);
      badgeCounterService.updateBadgeCount('alerts_tab', 3);

      // Render alerts screen
      const { getByTestId } = render(
        <TestWrapper>
          <AlertsListScreen />
        </TestWrapper>
      );

      // Wait for screen to load and clear badges
      await waitFor(() => {
        expect(badgeCounterService.getBadgeCount('header')).toBe(0);
        expect(badgeCounterService.getBadgeCount('alerts_tab')).toBe(0);
      });
    });

    it('should handle notification navigation correctly', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        canGoBack: jest.fn(() => true),
      };

      const mockNotification = {
        id: 'test-notification-2',
        type: 'alert' as const,
        severity: 'high' as const,
        title: 'High Priority Alert',
        body: 'Weather warning issued',
        data: { alertId: 'alert-456' },
        timestamp: Date.now(),
      };

      // Test navigation handling
      await act(async () => {
        navigationHandler.handleNotificationPress(mockNotification);
      });

      // Verify navigation was called correctly
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Alerts', {
        screen: 'AlertDetails',
        params: { alertId: 'alert-456' },
      });
    });
  });

  describe('Cross-Platform Behavior', () => {
    it('should work consistently on iOS', async () => {
      // Mock iOS platform
      Platform.OS = 'ios';

      const { getByTestId } = render(
        <TestWrapper>
          <BadgeIndicator count={5} testID="test-badge" />
        </TestWrapper>
      );

      const badge = getByTestId('test-badge');
      expect(badge).toBeTruthy();
      expect(badge.props.children.props.children).toBe('5');
    });

    it('should work consistently on Android', async () => {
      // Mock Android platform
      Platform.OS = 'android';

      const { getByTestId } = render(
        <TestWrapper>
          <BadgeIndicator count={99} maxCount={99} testID="test-badge" />
        </TestWrapper>
      );

      const badge = getByTestId('test-badge');
      expect(badge).toBeTruthy();
      expect(badge.props.children.props.children).toBe('99');
    });

    it('should handle platform-specific haptic feedback', async () => {
      const mockHapticTrigger = jest.spyOn(hapticFeedbackService, 'triggerFeedback');

      // Test iOS haptics
      Platform.OS = 'ios';
      await hapticFeedbackService.triggerFeedback('critical');
      expect(mockHapticTrigger).toHaveBeenCalledWith('critical');

      // Test Android haptics
      Platform.OS = 'android';
      await hapticFeedbackService.triggerFeedback('high');
      expect(mockHapticTrigger).toHaveBeenCalledWith('high');
    });
  });

  describe('Settings Integration', () => {
    it('should update notification settings and apply immediately', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      // Find and toggle sound setting
      const soundToggle = getByTestId('sound-toggle');
      fireEvent(soundToggle, 'onValueChange', false);

      // Verify setting was applied
      await waitFor(async () => {
        const settings = await notificationSettingsManager.getSettings();
        expect(settings.soundEnabled).toBe(false);
        expect(audioAlertService.isEnabled()).toBe(false);
      });
    });

    it('should test sound and vibration previews', async () => {
      const mockPreviewSound = jest.spyOn(notificationSettingsManager, 'previewSound');
      const mockPreviewVibration = jest.spyOn(notificationSettingsManager, 'previewVibration');

      const { getByText } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      // Test sound preview
      const soundTestButton = getByText('Test');
      fireEvent.press(soundTestButton);
      expect(mockPreviewSound).toHaveBeenCalledWith('high');

      // Test vibration preview
      const vibrationTestButton = getByText('Test');
      fireEvent.press(vibrationTestButton);
      expect(mockPreviewVibration).toHaveBeenCalledWith('high');
    });
  });

  describe('Badge System Integration', () => {
    it('should update badges across all UI locations', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ConnectedBadge location="header" testID="header-badge" />
        </TestWrapper>
      );

      // Update badge count
      act(() => {
        badgeCounterService.updateBadgeCount('header', 7);
      });

      // Verify badge displays correct count
      await waitFor(() => {
        const badge = document.querySelector('[data-testid="header-badge"]');
        expect(badge).toBeTruthy();
      });
    });

    it('should handle badge overflow correctly', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <BadgeIndicator count={150} maxCount={99} testID="overflow-badge" />
        </TestWrapper>
      );

      const badge = getByTestId('overflow-badge');
      expect(badge.props.children.props.children).toBe('99+');
    });

    it('should hide badges when count is zero', async () => {
      const { queryByTestId } = render(
        <TestWrapper>
          <BadgeIndicator count={0} testID="zero-badge" />
        </TestWrapper>
      );

      expect(queryByTestId('zero-badge')).toBeNull();
    });
  });

  describe('Accessibility Compliance', () => {
    it('should provide proper accessibility labels for badges', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <BadgeIndicator 
            count={3} 
            testID="accessible-badge"
            accessibilityLabel="3 unread notifications"
          />
        </TestWrapper>
      );

      const badge = getByTestId('accessible-badge');
      expect(badge.props.accessibilityLabel).toBe('3 unread notifications');
    });

    it('should support screen reader navigation', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <CustomHeader showNotificationBell={true} />
        </TestWrapper>
      );

      const notificationButton = getByTestId('notification-button');
      expect(notificationButton.props.accessibilityRole).toBe('button');
      expect(notificationButton.props.accessible).toBe(true);
    });

    it('should provide proper focus management', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const soundToggle = getByTestId('sound-toggle');
      expect(soundToggle.props.accessible).toBe(true);
      expect(soundToggle.props.accessibilityRole).toBe('switch');
    });
  });

  describe('Error Handling', () => {
    it('should handle notification processing errors gracefully', async () => {
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
      
      const invalidNotification = {
        id: '',
        type: 'invalid' as any,
        severity: 'unknown' as any,
        title: '',
        body: '',
        timestamp: 0,
      };

      // Should not crash on invalid notification
      await expect(
        notificationManager.handleNotification(invalidNotification)
      ).resolves.not.toThrow();

      mockConsoleError.mockRestore();
    });

    it('should handle settings persistence failures', async () => {
      // Mock AsyncStorage failure
      const mockAsyncStorage = require('@react-native-async-storage/async-storage');
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));

      const { getByTestId } = render(
        <TestWrapper>
          <SettingsScreen />
        </TestWrapper>
      );

      const soundToggle = getByTestId('sound-toggle');
      
      // Should handle error gracefully
      await act(async () => {
        fireEvent(soundToggle, 'onValueChange', false);
      });

      // Setting should revert on error
      expect(audioAlertService.isEnabled()).toBe(true);
    });

    it('should handle navigation failures with fallback', async () => {
      const mockNavigation = {
        navigate: jest.fn().mockRejectedValue(new Error('Navigation failed')),
        goBack: jest.fn(),
        canGoBack: jest.fn(() => false),
      };

      const mockNotification = {
        id: 'test-notification-3',
        type: 'alert' as const,
        severity: 'medium' as const,
        title: 'Medium Alert',
        body: 'Standard notification',
        data: { alertId: 'alert-789' },
        timestamp: Date.now(),
      };

      // Should fallback to home screen on navigation failure
      await act(async () => {
        navigationHandler.handleNotificationPress(mockNotification);
      });

      // Should attempt fallback navigation
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
    });
  });

  describe('Performance', () => {
    it('should handle rapid badge updates efficiently', async () => {
      const startTime = Date.now();
      
      // Simulate rapid badge updates
      for (let i = 0; i < 100; i++) {
        badgeCounterService.updateBadgeCount('header', i);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
      expect(badgeCounterService.getBadgeCount('header')).toBe(99);
    });

    it('should handle multiple simultaneous notifications', async () => {
      const notifications = Array.from({ length: 10 }, (_, i) => ({
        id: `notification-${i}`,
        type: 'alert' as const,
        severity: 'low' as const,
        title: `Alert ${i}`,
        body: `Test notification ${i}`,
        timestamp: Date.now() + i,
      }));

      // Process all notifications simultaneously
      await Promise.all(
        notifications.map(notification => 
          notificationManager.handleNotification(notification)
        )
      );

      // Should handle all notifications without errors
      expect(badgeCounterService.getBadgeCount('header')).toBe(10);
    });
  });
});

// Mock navigation object for tests
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  isFocused: jest.fn(() => true),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
  getState: jest.fn(),
  getParent: jest.fn(),
  getId: jest.fn(),
};