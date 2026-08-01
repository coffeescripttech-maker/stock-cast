/**
 * ForegroundNotificationIntegration - Integration service for foreground notifications
 * Connects NotificationManager with ForegroundNotificationHandler and navigation
 */

import { NavigationContainerRef } from '@react-navigation/native';
import { NotificationManager } from './NotificationManager';
import { NavigationHandler } from './NavigationHandler';
import { badgeCounterService } from './BadgeCounterService';
import { foregroundNotificationHandler } from './ForegroundNotificationHandler';
import { NotificationData } from '../../types/notification';

export class ForegroundNotificationIntegration {
  private notificationManager: NotificationManager;
  private navigationHandler: NavigationHandler;
  private isInitialized = false;

  constructor() {
    this.navigationHandler = new NavigationHandler();
    this.notificationManager = new NotificationManager(
      this.navigationHandler,
      badgeCounterService,
      undefined, // Audio service will be injected later
      undefined, // Haptic service will be injected later
      foregroundNotificationHandler
    );
  }

  /**
   * Initialize the integration with navigation reference
   */
  async initialize(navigationRef: NavigationContainerRef<any>): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set navigation reference
      this.navigationHandler.setNavigationRef(navigationRef);

      // Initialize notification manager
      await this.notificationManager.initialize();

      // Set up foreground notification handler callback for navigation
      foregroundNotificationHandler.setNotificationCallback((notification: NotificationData) => {
        console.log('Foreground notification callback triggered:', notification.title);
      });

      this.isInitialized = true;
      console.log('ForegroundNotificationIntegration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ForegroundNotificationIntegration:', error);
      throw error;
    }
  }

  /**
   * Handle notification press from foreground display
   */
  handleNotificationPress(notification: NotificationData): void {
    try {
      console.log('Handling notification press from foreground display:', notification.id);
      
      // Navigate to appropriate screen
      this.navigationHandler.handleNotificationPress(notification);
      
      // Update badge counters to reflect viewed notification
      this.updateBadgeCountersForViewed(notification);
      
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  }

  /**
   * Update badge counters when notification is viewed
   */
  private updateBadgeCountersForViewed(notification: NotificationData): void {
    try {
      // Decrement badge counts since user viewed the notification
      badgeCounterService.decrementBadgeCount('header', 1);
      badgeCounterService.decrementBadgeCount('alerts_tab', 1);
      
      if (notification.type === 'alert' || notification.type === 'sos' || notification.type === 'incident') {
        badgeCounterService.decrementBadgeCount('home_cards', 1);
      }

      console.log('Badge counters decremented for viewed notification:', notification.id);
    } catch (error) {
      console.error('Error updating badge counters for viewed notification:', error);
    }
  }

  /**
   * Get the notification manager instance
   */
  getNotificationManager(): NotificationManager {
    return this.notificationManager;
  }

  /**
   * Get the navigation handler instance
   */
  getNavigationHandler(): NavigationHandler {
    return this.navigationHandler;
  }

  /**
   * Check if integration is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.navigationHandler.isNavigationReady();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    foregroundNotificationHandler.cleanup();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const foregroundNotificationIntegration = new ForegroundNotificationIntegration();
export default foregroundNotificationIntegration;