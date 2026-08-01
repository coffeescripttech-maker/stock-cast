/**
 * ForegroundNotificationHandler - Manages in-app notification display
 * Handles notification display when the app is in the foreground
 */

import { AppState, AppStateStatus } from 'react-native';
import { NotificationData } from '../../types/notification';

export type ForegroundNotificationCallback = (notification: NotificationData) => void;
export type NotificationDismissCallback = () => void;

export interface IForegroundNotificationHandler {
  initialize(): void;
  showNotification(notification: NotificationData): void;
  hideNotification(): void;
  setNotificationCallback(callback: ForegroundNotificationCallback): void;
  setDismissCallback(callback: NotificationDismissCallback): void;
  isAppInForeground(): boolean;
}

class ForegroundNotificationHandler implements IForegroundNotificationHandler {
  private currentNotification: NotificationData | null = null;
  private notificationCallback?: ForegroundNotificationCallback;
  private dismissCallback?: NotificationDismissCallback;
  private appState: AppStateStatus = AppState.currentState;
  private isInitialized = false;
  private appStateSubscription?: { remove: () => void }; // Store the subscription

  /**
   * Initialize the foreground notification handler
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Listen to app state changes - store the subscription
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    this.isInitialized = true;
    
    console.log('ForegroundNotificationHandler initialized');
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    console.log('App state changed from', this.appState, 'to', nextAppState);
    
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground
      console.log('App came to foreground');
    } else if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
      // App went to background - hide any visible notifications
      this.hideNotification();
    }
    
    this.appState = nextAppState;
  }

  /**
   * Show a notification in the foreground
   */
  showNotification(notification: NotificationData): void {
    if (!this.isAppInForeground()) {
      console.log('App not in foreground, skipping in-app notification display');
      return;
    }

    console.log('Showing foreground notification:', notification.title);
    this.currentNotification = notification;
    
    if (this.notificationCallback) {
      this.notificationCallback(notification);
    }
  }

  /**
   * Hide the current notification
   */
  hideNotification(): void {
    if (this.currentNotification) {
      console.log('Hiding foreground notification');
      this.currentNotification = null;
      
      if (this.dismissCallback) {
        this.dismissCallback();
      }
    }
  }

  /**
   * Set callback for when notification should be displayed
   */
  setNotificationCallback(callback: ForegroundNotificationCallback): void {
    this.notificationCallback = callback;
  }

  /**
   * Set callback for when notification should be dismissed
   */
  setDismissCallback(callback: NotificationDismissCallback): void {
    this.dismissCallback = callback;
  }

  /**
   * Check if app is currently in foreground
   */
  isAppInForeground(): boolean {
    return this.appState === 'active';
  }

  /**
   * Get current notification being displayed
   */
  getCurrentNotification(): NotificationData | null {
    return this.currentNotification;
  }

  /**
   * Clear current notification without triggering callbacks
   */
  clearCurrentNotification(): void {
    this.currentNotification = null;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Use the subscription to remove the listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = undefined;
    }
    
    this.currentNotification = null;
    this.notificationCallback = undefined;
    this.dismissCallback = undefined;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const foregroundNotificationHandler = new ForegroundNotificationHandler();
export default foregroundNotificationHandler;