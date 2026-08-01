/**
 * NotificationManager - Central orchestrator for all notification functionality
 * Handles expo-notifications integration, permission management, and device token registration
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { 
  INotificationManager, 
  NotificationData, 
  INavigationHandler,
  IBadgeCounterService,
  IAudioAlertService,
  IHapticFeedbackService
} from '../../types/notification';
import { foregroundNotificationHandler, IForegroundNotificationHandler } from './ForegroundNotificationHandler';
import { networkSyncService, INetworkSyncService } from './NetworkSyncService';
import { localNotificationService, ILocalNotificationService } from './LocalNotificationService';

export class NotificationManager implements INotificationManager {
  private navigationHandler?: INavigationHandler;
  private badgeService?: IBadgeCounterService;
  private audioService?: IAudioAlertService;
  private hapticService?: IHapticFeedbackService;
  private foregroundHandler: IForegroundNotificationHandler;
  private networkSyncService: INetworkSyncService;
  private localNotificationService: ILocalNotificationService;
  private isInitialized = false;

  constructor(
    navigationHandler?: INavigationHandler,
    badgeService?: IBadgeCounterService,
    audioService?: IAudioAlertService,
    hapticService?: IHapticFeedbackService,
    foregroundHandler?: IForegroundNotificationHandler,
    networkSyncService?: INetworkSyncService,
    localNotificationService?: ILocalNotificationService
  ) {
    this.navigationHandler = navigationHandler;
    this.badgeService = badgeService;
    this.audioService = audioService;
    this.hapticService = hapticService;
    this.foregroundHandler = foregroundHandler || foregroundNotificationHandler;
    this.networkSyncService = networkSyncService || networkSyncService;
    this.localNotificationService = localNotificationService || localNotificationService;
  }

  /**
   * Initialize the notification system
   * Sets up expo-notifications configuration and notification channels
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Initialize network sync service
      await this.networkSyncService.initialize();

      // Initialize local notification service
      await this.localNotificationService.initialize();

      // Initialize foreground notification handler
      this.foregroundHandler.initialize();

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('NotificationManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NotificationManager:', error);
      throw error;
    }
  }

  /**
   * Set up Android notification channels for different severity levels
   */
  private async setupAndroidChannels(): Promise<void> {
    // Critical alerts channel
    await Notifications.setNotificationChannelAsync('critical', {
      name: 'Critical Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF0000',
      sound: 'critical_alert.wav',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    // High priority alerts channel
    await Notifications.setNotificationChannelAsync('high', {
      name: 'High Priority Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 150, 150, 150],
      lightColor: '#FF8C00',
      sound: 'high_alert.wav',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    // Medium priority alerts channel
    await Notifications.setNotificationChannelAsync('medium', {
      name: 'Medium Priority Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100, 100, 100],
      lightColor: '#FFD700',
      sound: 'medium_alert.wav',
      enableVibrate: true,
      showBadge: true,
    });

    // Low priority alerts channel
    await Notifications.setNotificationChannelAsync('low', {
      name: 'Low Priority Alerts',
      importance: Notifications.AndroidImportance.LOW,
      sound: 'low_alert.wav',
      showBadge: true,
    });
  }

  /**
   * Set up notification event listeners
   */
  private setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener(this.handleForegroundNotification.bind(this));

    // Handle notification tap/press
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse.bind(this));
  }

  /**
   * Handle notification received while app is in foreground
   */
  private async handleForegroundNotification(notification: Notifications.Notification): Promise<void> {
    try {
      const notificationData = this.parseNotificationData(notification);
      
      // Show in-app notification if app is in foreground
      if (this.foregroundHandler.isAppInForeground()) {
        console.log('Displaying foreground notification:', notificationData.title);
        this.foregroundHandler.showNotification(notificationData);
      }
      
      // Process the notification (update badges, play sounds, etc.)
      await this.handleNotification(notificationData);
    } catch (error) {
      console.error('Error handling foreground notification:', error);
    }
  }

  /**
   * Handle notification tap/press response
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    try {
      const notificationData = this.parseNotificationData(response.notification);
      this.navigateToNotification(notificationData);
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  }

  /**
   * Parse expo notification into our NotificationData format
   */
  private parseNotificationData(notification: Notifications.Notification): NotificationData {
    const request = notification.request;
    const content = request.content;
    
    return {
      id: request.identifier,
      type: (content.data?.type as any) || 'alert',
      severity: (content.data?.severity as any) || 'medium',
      title: content.title || 'SafeHaven Alert',
      body: content.body || '',
      data: content.data || {},
      timestamp: notification.date || Date.now(),
    };
  }

  /**
   * Handle incoming notification - orchestrates all notification processing
   */
  async handleNotification(notification: NotificationData): Promise<void> {
    try {
      console.log('Processing notification:', notification.id, notification.type, notification.severity);
      
      // If offline, add to pending sync queue
      if (!this.networkSyncService.isOnline()) {
        console.log('Device offline, adding notification to pending sync queue');
        await this.networkSyncService.addPendingNotification(notification);
        
        // Cache critical alerts for offline access
        if (notification.severity === 'critical' || notification.severity === 'high') {
          await this.localNotificationService.cacheAlert(notification);
        }
      } else {
        // Cache all alerts when online for offline access
        await this.localNotificationService.cacheAlert(notification);
      }

      // Update badge counters based on notification type
      if (this.badgeService) {
        this.updateBadgeCounters(notification);
      }

      // Play audio alert with retry logic
      if (this.audioService) {
        await this.networkSyncService.retryFailedOperation(
          () => this.audioService!.playAlert(notification.severity),
          2 // Reduced retries for audio
        ).catch(error => {
          console.warn('Audio alert failed after retries:', error.message);
          // Graceful degradation - continue without audio
        });
      }

      // Trigger haptic feedback with retry logic
      if (this.hapticService) {
        await this.networkSyncService.retryFailedOperation(
          () => this.hapticService!.triggerFeedback(notification.severity),
          2 // Reduced retries for haptic
        ).catch(error => {
          console.warn('Haptic feedback failed after retries:', error.message);
          // Graceful degradation - continue without haptic
        });
      }

      console.log('Notification handled successfully:', notification.id);
    } catch (error) {
      console.error('Error handling notification:', error);
      
      // Graceful degradation - at least try to update badges
      if (this.badgeService) {
        try {
          this.updateBadgeCounters(notification);
        } catch (badgeError) {
          console.error('Failed to update badge counters:', badgeError);
        }
      }
    }
  }

  /**
   * Update badge counters based on notification type and content
   */
  private updateBadgeCounters(notification: NotificationData): void {
    if (!this.badgeService) return;

    try {
      // Increment badge count for all locations
      this.badgeService.incrementBadgeCount('header', 1);
      this.badgeService.incrementBadgeCount('alerts_tab', 1);
      
      // Update home cards badge based on notification type
      if (notification.type === 'alert' || notification.type === 'sos' || notification.type === 'incident') {
        this.badgeService.incrementBadgeCount('home_cards', 1);
      }

      console.log('Badge counters updated for notification:', notification.id);
    } catch (error) {
      console.error('Error updating badge counters:', error);
    }
  }

  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Notifications require a physical device');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(): Promise<string> {
    try {
      if (!Device.isDevice) {
        throw new Error('Must use physical device for push notifications');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // This should be configured from app.json
      });

      console.log('Device token obtained:', token.data);

      // Try to register with backend using retry logic
      if (this.networkSyncService.isOnline()) {
        try {
          await this.networkSyncService.retryFailedOperation(async () => {
            // This would typically make an API call to register the token
            console.log('Registering device token with backend...');
            // await api.post('/notifications/register-device', { deviceToken: token.data });
          });
          console.log('Device token registered with backend successfully');
        } catch (error) {
          console.warn('Failed to register device token with backend, adding to sync queue:', error.message);
          
          // Add to pending sync operations if registration fails
          await this.networkSyncService.addPendingSyncOperation({
            type: 'device_token_registration',
            data: {
              deviceToken: token.data,
              platform: Platform.OS,
              userId: 'current_user_id' // This should come from auth context
            },
            maxRetries: 5
          });
        }
      } else {
        console.log('Device offline, adding token registration to sync queue');
        
        // Add to pending sync operations if offline
        await this.networkSyncService.addPendingSyncOperation({
          type: 'device_token_registration',
          data: {
            deviceToken: token.data,
            platform: Platform.OS,
            userId: 'current_user_id' // This should come from auth context
          },
          maxRetries: 5
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  }

  /**
   * Update the app badge count (iOS)
   */
  updateBadgeCount(count: number): void {
    try {
      if (Platform.OS === 'ios') {
        Notifications.setBadgeCountAsync(count);
      }
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  }

  /**
   * Navigate to appropriate screen based on notification
   */
  navigateToNotification(notification: NotificationData): void {
    try {
      if (this.navigationHandler) {
        this.navigationHandler.handleNotificationPress(notification);
      } else {
        console.warn('NavigationHandler not configured');
      }
    } catch (error) {
      console.error('Error navigating to notification:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data: any = {},
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: trigger || null, // null means immediate
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Sync notifications when connectivity is restored
   */
  async syncNotifications(): Promise<void> {
    try {
      await this.networkSyncService.syncWhenOnline();
    } catch (error) {
      console.error('Error syncing notifications:', error);
    }
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.networkSyncService.isOnline();
  }

  /**
   * Get pending operations count for monitoring
   */
  getPendingOperationsCount(): { notifications: number; operations: number } {
    return this.networkSyncService.getPendingOperationsCount();
  }

  /**
   * Handle network failure gracefully
   */
  async handleNetworkFailure(operation: string, error: Error): Promise<void> {
    console.warn(`Network operation failed: ${operation}`, error.message);
    
    // Log the failure for monitoring
    try {
      await this.networkSyncService.addPendingSyncOperation({
        type: 'notification_sync',
        data: {
          operation,
          error: error.message,
          timestamp: Date.now()
        },
        maxRetries: 3
      });
    } catch (syncError) {
      console.error('Failed to add network failure to sync queue:', syncError);
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTimestamp(): Promise<number | null> {
    return this.networkSyncService.getLastSyncTimestamp();
  }

  /**
   * Get cached alerts for offline access
   */
  async getCachedAlerts(): Promise<any[]> {
    return this.localNotificationService.getCachedAlerts();
  }

  /**
   * Get local notifications
   */
  async getLocalNotifications(): Promise<any[]> {
    return this.localNotificationService.getLocalNotifications();
  }

  /**
   * Get storage usage for monitoring
   */
  async getStorageUsage(): Promise<{ used: number; available: number; criticalCount: number }> {
    return this.localNotificationService.getStorageUsage();
  }

  /**
   * Force sync with remote notifications
   */
  async forceSyncWithRemote(): Promise<void> {
    try {
      await this.localNotificationService.forceSyncWhenOnline();
    } catch (error) {
      console.error('Error forcing sync with remote:', error);
    }
  }

  /**
   * Clean up expired notifications manually
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      await this.localNotificationService.cleanupExpiredNotifications();
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }

  /**
   * Resolve notification conflicts
   */
  async resolveNotificationConflicts(): Promise<void> {
    try {
      await this.localNotificationService.resolveNotificationConflicts();
    } catch (error) {
      console.error('Error resolving notification conflicts:', error);
    }
  }

  /**
   * Get notification conflicts for manual resolution
   */
  getNotificationConflicts(): any[] {
    return this.localNotificationService.getConflicts();
  }

  /**
   * Manually resolve a specific conflict
   */
  async resolveSpecificConflict(conflictIndex: number, resolution: 'use_local' | 'use_remote' | 'merge'): Promise<void> {
    try {
      await this.localNotificationService.resolveConflict(conflictIndex, resolution);
    } catch (error) {
      console.error('Error resolving specific conflict:', error);
    }
  }
}