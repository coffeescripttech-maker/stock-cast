/**
 * NotificationInitializer - Utility for setting up the notification system
 * Handles app-wide notification initialization and configuration
 */

import { NotificationManager } from './NotificationManager';
import { PermissionHandler } from './PermissionHandler';
import { ANDROID_CHANNELS } from './NotificationConfig';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class NotificationInitializer {
  private static instance: NotificationManager | null = null;
  private static isInitialized = false;

  /**
   * Initialize the notification system for the entire app
   */
  static async initialize(projectId?: string): Promise<NotificationManager> {
    if (this.isInitialized && this.instance) {
      return this.instance;
    }

    try {
      console.log('Initializing notification system...');

      // Create notification manager instance
      this.instance = new NotificationManager();

      // Initialize the notification manager
      await this.instance.initialize();

      // Request permissions
      const hasPermissions = await PermissionHandler.requestPermissions();
      
      if (hasPermissions) {
        // Register device token
        const token = await PermissionHandler.registerDeviceToken(projectId);
        if (token) {
          console.log('Notification system initialized with token:', token);
        } else {
          console.warn('Notification system initialized but token registration failed');
        }
      } else {
        console.warn('Notification system initialized but permissions denied');
      }

      this.isInitialized = true;
      return this.instance;

    } catch (error) {
      console.error('Failed to initialize notification system:', error);
      throw error;
    }
  }

  /**
   * Get the current notification manager instance
   */
  static getInstance(): NotificationManager | null {
    return this.instance;
  }

  /**
   * Check if notification system is initialized
   */
  static isSystemInitialized(): boolean {
    return this.isInitialized && this.instance !== null;
  }

  /**
   * Reinitialize the notification system (useful for permission changes)
   */
  static async reinitialize(projectId?: string): Promise<NotificationManager> {
    this.isInitialized = false;
    this.instance = null;
    return await this.initialize(projectId);
  }

  /**
   * Setup notification system for app startup
   * This should be called in App.tsx or main app component
   */
  static async setupForApp(projectId?: string): Promise<void> {
    try {
      // Initialize notification system
      await this.initialize(projectId);

      // Set up app state change listeners for permission handling
      this.setupAppStateListeners();

      console.log('Notification system setup complete');
    } catch (error) {
      console.error('Failed to setup notification system for app:', error);
      // Don't throw here - app should continue to work without notifications
    }
  }

  /**
   * Setup app state listeners for handling permission changes
   */
  private static setupAppStateListeners(): void {
    // This would typically use AppState from react-native
    // For now, we'll just set up a periodic check
    setInterval(async () => {
      try {
        await PermissionHandler.handlePermissionChange();
      } catch (error) {
        console.error('Error in periodic permission check:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Handle app coming to foreground
   */
  static async handleAppForeground(): Promise<void> {
    try {
      if (this.instance) {
        // Check for permission changes
        await PermissionHandler.handlePermissionChange();
        
        // Validate and refresh token if needed
        const token = await PermissionHandler.validateAndRefreshToken();
        if (!token) {
          console.warn('Device token validation failed');
        }
      }
    } catch (error) {
      console.error('Error handling app foreground:', error);
    }
  }

  /**
   * Handle app going to background
   */
  static async handleAppBackground(): Promise<void> {
    try {
      // Clear any pending local notifications if needed
      // This is a placeholder for future functionality
      console.log('App going to background - notification system ready');
    } catch (error) {
      console.error('Error handling app background:', error);
    }
  }

  /**
   * Get notification system status
   */
  static async getSystemStatus(): Promise<{
    initialized: boolean;
    hasPermissions: boolean;
    hasToken: boolean;
    token?: string;
  }> {
    try {
      const hasPermissions = await PermissionHandler.checkPermissions();
      const token = await PermissionHandler.getStoredDeviceToken();

      return {
        initialized: this.isInitialized,
        hasPermissions,
        hasToken: !!token,
        token: token || undefined
      };
    } catch (error) {
      console.error('Error getting notification system status:', error);
      return {
        initialized: false,
        hasPermissions: false,
        hasToken: false
      };
    }
  }

  /**
   * Reset notification system (for testing or troubleshooting)
   */
  static async reset(): Promise<void> {
    try {
      // Clear all stored data
      await PermissionHandler.clearStoredData();
      
      // Cancel all notifications
      if (this.instance) {
        await this.instance.cancelAllNotifications();
      }

      // Reset instance
      this.isInitialized = false;
      this.instance = null;

      console.log('Notification system reset complete');
    } catch (error) {
      console.error('Error resetting notification system:', error);
    }
  }
}