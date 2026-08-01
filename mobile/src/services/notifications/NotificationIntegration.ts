/**
 * NotificationIntegration - Connects backend notifications to mobile app
 * 
 * This service handles:
 * - Push notification registration with backend
 * - Real-time notification processing from admin actions
 * - Badge count synchronization
 * - Deep linking from notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationManager } from './NotificationManager';
import { badgeCounterService } from './BadgeCounterService';
import { audioAlertService } from './AudioAlertService';
import { hapticFeedbackService } from './HapticFeedbackService';
import { navigationHandler } from './NavigationHandler';
import { notificationSettingsManager } from './NotificationSettingsManager';
import { NotificationData, AlertSeverity } from '../../types/notification';
import { api } from '../../services/api';

export class NotificationIntegration {
  private notificationManager: NotificationManager;
  private isInitialized = false;
  private deviceToken: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.notificationManager = new NotificationManager(
      navigationHandler,
      badgeCounterService,
      audioAlertService,
      hapticFeedbackService
    );
  }

  /**
   * Initialize the notification integration system
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.userId = userId;

      // Initialize the notification manager
      await this.notificationManager.initialize();

      // Request permissions
      const hasPermissions = await this.notificationManager.requestPermissions();
      if (!hasPermissions) {
        console.warn('Notification permissions not granted');
        return;
      }

      // Register device token with backend
      await this.registerDeviceToken();

      // Set up notification handlers
      this.setupNotificationHandlers();

      // Sync existing notifications
      await this.syncNotifications();

      this.isInitialized = true;
      console.log('NotificationIntegration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NotificationIntegration:', error);
      throw error;
    }
  }

  /**
   * Register device token with backend for push notifications
   */
  private async registerDeviceToken(): Promise<void> {
    try {
      this.deviceToken = await this.notificationManager.registerDeviceToken();
      
      if (this.deviceToken && this.userId) {
        // Register with SafeHaven backend
        await api.post('/notifications/register-device', {
          deviceToken: this.deviceToken,
          userId: this.userId,
          platform: 'mobile'
        });

        console.log('Device token registered with SafeHaven backend');
      }
    } catch (error) {
      console.error('Failed to register device token:', error);
      // Don't throw - allow app to continue without push notifications
    }
  }

  /**
   * Set up notification event handlers
   */
  private setupNotificationHandlers(): void {
    // Handle incoming notifications and update badges
    this.notificationManager.handleNotification = async (notification: NotificationData) => {
      try {
        console.log('Processing notification:', notification.type, notification.severity);

        // Update badge counters based on notification type
        this.updateBadgeCounters(notification);

        // Play audio alert if enabled
        const soundEnabled = await notificationSettingsManager.getSoundEnabled();
        if (soundEnabled && audioAlertService) {
          await audioAlertService.playAlert(notification.severity);
        }

        // Trigger haptic feedback if enabled
        const vibrationEnabled = await notificationSettingsManager.getVibrationEnabled();
        if (vibrationEnabled && hapticFeedbackService) {
          await hapticFeedbackService.triggerFeedback(notification.severity);
        }

        // Store notification for later viewing
        await this.storeNotification(notification);

        console.log('Notification processed successfully');
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    };
  }

  /**
   * Update badge counters based on notification type
   */
  private updateBadgeCounters(notification: NotificationData): void {
    try {
      // Increment header bell badge
      badgeCounterService.incrementBadgeCount('header', 1);

      // Increment alerts tab badge for all notification types
      badgeCounterService.incrementBadgeCount('alerts_tab', 1);

      // Increment home cards badge for critical alerts
      if (notification.severity === 'critical' || notification.severity === 'high') {
        badgeCounterService.incrementBadgeCount('home_cards', 1);
      }

      // Update app badge count (iOS)
      const totalCount = badgeCounterService.getBadgeCount('header');
      this.notificationManager.updateBadgeCount(totalCount);

      console.log('Badge counters updated:', {
        header: badgeCounterService.getBadgeCount('header'),
        alerts_tab: badgeCounterService.getBadgeCount('alerts_tab'),
        home_cards: badgeCounterService.getBadgeCount('home_cards')
      });
    } catch (error) {
      console.error('Error updating badge counters:', error);
    }
  }

  /**
   * Store notification for later viewing
   */
  private async storeNotification(notification: NotificationData): Promise<void> {
    try {
      // Store in local storage for offline access
      const storedNotifications = await this.getStoredNotifications();
      storedNotifications.unshift(notification);

      // Keep only last 50 notifications
      const trimmedNotifications = storedNotifications.slice(0, 50);

      await this.saveStoredNotifications(trimmedNotifications);
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  /**
   * Sync notifications from backend
   */
  async syncNotifications(): Promise<void> {
    try {
      if (!this.userId) {
        console.warn('Cannot sync notifications - user ID not set');
        return;
      }

      // Get unread notifications from backend
      const response = await api.get('/notifications/unread');
      
      if (response.data && response.data.notifications) {
        const notifications = response.data.notifications;
        
        // Update badge counts based on unread notifications
        let headerCount = 0;
        let alertsCount = 0;
        let homeCardsCount = 0;

        notifications.forEach((notification: any) => {
          headerCount++;
          alertsCount++;
          
          if (notification.severity === 'critical' || notification.severity === 'high') {
            homeCardsCount++;
          }
        });

        // Update badge counters
        badgeCounterService.updateBadgeCount('header', headerCount);
        badgeCounterService.updateBadgeCount('alerts_tab', alertsCount);
        badgeCounterService.updateBadgeCount('home_cards', homeCardsCount);

        // Update app badge count (iOS)
        this.notificationManager.updateBadgeCount(headerCount);

        console.log('Notifications synced:', {
          total: notifications.length,
          header: headerCount,
          alerts: alertsCount,
          homeCards: homeCardsCount
        });
      }
    } catch (error) {
      console.error('Error syncing notifications:', error);
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(notificationIds?: string[]): Promise<void> {
    try {
      if (!this.userId) {
        console.warn('Cannot mark notifications as read - user ID not set');
        return;
      }

      // Mark as read on backend
      await api.post('/notifications/mark-read', {
        notificationIds: notificationIds || 'all'
      });

      // Clear badge counters if marking all as read
      if (!notificationIds) {
        badgeCounterService.clearAllBadges();
        this.notificationManager.updateBadgeCount(0);
      } else {
        // Decrement badge counters by the number of notifications marked as read
        const count = notificationIds.length;
        badgeCounterService.decrementBadgeCount('header', count);
        badgeCounterService.decrementBadgeCount('alerts_tab', count);
        
        // Update app badge count
        const newCount = badgeCounterService.getBadgeCount('header');
        this.notificationManager.updateBadgeCount(newCount);
      }

      console.log('Notifications marked as read:', notificationIds?.length || 'all');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  /**
   * Handle notification tap/press
   */
  async handleNotificationPress(notification: NotificationData): Promise<void> {
    try {
      // Navigate to appropriate screen
      if (navigationHandler) {
        navigationHandler.handleNotificationPress(notification);
      }

      // Mark this notification as read
      if (notification.id) {
        await this.markNotificationsAsRead([notification.id]);
      }

      console.log('Notification press handled:', notification.type);
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  }

  /**
   * Get stored notifications from local storage
   */
  private async getStoredNotifications(): Promise<NotificationData[]> {
    try {
      const stored = await AsyncStorage.getItem('stored_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  /**
   * Save notifications to local storage
   */
  private async saveStoredNotifications(notifications: NotificationData[]): Promise<void> {
    try {
      await AsyncStorage.setItem('stored_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving stored notifications:', error);
    }
  }

  /**
   * Get current badge counts
   */
  getBadgeCounts(): { header: number; alerts_tab: number; home_cards: number } {
    return {
      header: badgeCounterService.getBadgeCount('header'),
      alerts_tab: badgeCounterService.getBadgeCount('alerts_tab'),
      home_cards: badgeCounterService.getBadgeCount('home_cards')
    };
  }

  /**
   * Test notification system
   */
  async testNotification(severity: AlertSeverity = 'medium'): Promise<void> {
    try {
      const testNotification: NotificationData = {
        id: `test_${Date.now()}`,
        type: 'alert',
        severity,
        title: 'Test Notification',
        body: 'This is a test notification to verify the system is working.',
        data: { test: true },
        timestamp: Date.now()
      };

      await this.notificationManager.handleNotification(testNotification);
      console.log('Test notification sent successfully');
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<{
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  }> {
    try {
      const soundEnabled = await notificationSettingsManager.getSoundEnabled();
      const vibrationEnabled = await notificationSettingsManager.getVibrationEnabled();
      
      return { soundEnabled, vibrationEnabled };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return { soundEnabled: true, vibrationEnabled: true };
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: {
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
  }): Promise<void> {
    try {
      if (settings.soundEnabled !== undefined) {
        await notificationSettingsManager.setSoundEnabled(settings.soundEnabled);
      }
      
      if (settings.vibrationEnabled !== undefined) {
        await notificationSettingsManager.setVibrationEnabled(settings.vibrationEnabled);
      }

      console.log('Notification settings updated:', settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      // Cancel all scheduled notifications
      await this.notificationManager.cancelAllNotifications();
      
      // Clear badge counters
      badgeCounterService.clearAllBadges();
      this.notificationManager.updateBadgeCount(0);

      this.isInitialized = false;
      console.log('NotificationIntegration cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const notificationIntegration = new NotificationIntegration();
export default notificationIntegration;