/**
 * NetworkSyncService - Handles notification sync when connectivity is restored
 * and provides retry logic with exponential backoff for failed operations
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationData } from '../../types/notification';
import api from '../api';

interface PendingNotification {
  id: string;
  notification: NotificationData;
  timestamp: number;
  retryCount: number;
}

interface SyncOperation {
  id: string;
  type: 'device_token_registration' | 'notification_sync' | 'settings_sync';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface INetworkSyncService {
  initialize(): Promise<void>;
  addPendingNotification(notification: NotificationData): Promise<void>;
  addPendingSyncOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void>;
  syncWhenOnline(): Promise<void>;
  isOnline(): boolean;
  retryFailedOperation<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T>;
}

export class NetworkSyncService implements INetworkSyncService {
  private isConnected = false;
  private pendingNotifications: PendingNotification[] = [];
  private pendingSyncOperations: SyncOperation[] = [];
  private syncInProgress = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  // Storage keys
  private readonly PENDING_NOTIFICATIONS_KEY = 'pending_notifications';
  private readonly PENDING_SYNC_OPERATIONS_KEY = 'pending_sync_operations';
  private readonly LAST_SYNC_KEY = 'last_notification_sync';

  // Retry configuration
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly BASE_RETRY_DELAY = 1000; // 1 second
  private readonly MAX_RETRY_DELAY = 30000; // 30 seconds

  /**
   * Initialize the network sync service
   */
  async initialize(): Promise<void> {
    try {
      // Load pending operations from storage
      await this.loadPendingOperations();

      // Set up network state listener
      NetInfo.addEventListener(this.handleNetworkStateChange.bind(this));

      // Get initial network state
      const netInfoState = await NetInfo.fetch();
      this.handleNetworkStateChange(netInfoState);

      console.log('NetworkSyncService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NetworkSyncService:', error);
      throw error;
    }
  }

  /**
   * Handle network state changes
   */
  private handleNetworkStateChange(state: NetInfoState): void {
    const wasConnected = this.isConnected;
    this.isConnected = state.isConnected ?? false;

    console.log('Network state changed:', {
      isConnected: this.isConnected,
      type: state.type,
      wasConnected
    });

    // If we just came back online, sync pending operations
    if (this.isConnected && !wasConnected) {
      console.log('Network connectivity restored, starting sync...');
      this.syncWhenOnline().catch(error => {
        console.error('Error during connectivity restoration sync:', error);
      });
    }
  }

  /**
   * Load pending operations from storage
   */
  private async loadPendingOperations(): Promise<void> {
    try {
      const [notificationsData, operationsData] = await Promise.all([
        AsyncStorage.getItem(this.PENDING_NOTIFICATIONS_KEY),
        AsyncStorage.getItem(this.PENDING_SYNC_OPERATIONS_KEY)
      ]);

      if (notificationsData) {
        this.pendingNotifications = JSON.parse(notificationsData);
      }

      if (operationsData) {
        this.pendingSyncOperations = JSON.parse(operationsData);
      }

      console.log('Loaded pending operations:', {
        notifications: this.pendingNotifications.length,
        operations: this.pendingSyncOperations.length
      });
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  }

  /**
   * Save pending operations to storage
   */
  private async savePendingOperations(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(this.PENDING_NOTIFICATIONS_KEY, JSON.stringify(this.pendingNotifications)),
        AsyncStorage.setItem(this.PENDING_SYNC_OPERATIONS_KEY, JSON.stringify(this.pendingSyncOperations))
      ]);
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  }

  /**
   * Add a notification to pending sync queue
   */
  async addPendingNotification(notification: NotificationData): Promise<void> {
    const pendingNotification: PendingNotification = {
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notification,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.pendingNotifications.push(pendingNotification);
    await this.savePendingOperations();

    console.log('Added pending notification:', pendingNotification.id);

    // If we're online, try to sync immediately
    if (this.isConnected) {
      this.syncWhenOnline().catch(error => {
        console.error('Error during immediate sync:', error);
      });
    }
  }

  /**
   * Add a sync operation to pending queue
   */
  async addPendingSyncOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const syncOperation: SyncOperation = {
      ...operation,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.pendingSyncOperations.push(syncOperation);
    await this.savePendingOperations();

    console.log('Added pending sync operation:', syncOperation.id, syncOperation.type);

    // If we're online, try to sync immediately
    if (this.isConnected) {
      this.syncWhenOnline().catch(error => {
        console.error('Error during immediate sync:', error);
      });
    }
  }

  /**
   * Sync all pending operations when online
   */
  async syncWhenOnline(): Promise<void> {
    if (!this.isConnected || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      console.log('Starting sync process...');

      // Sync pending notifications
      await this.syncPendingNotifications();

      // Sync pending operations
      await this.syncPendingOperations();

      // Update last sync timestamp
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());

      console.log('Sync process completed successfully');
    } catch (error) {
      console.error('Error during sync process:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync pending notifications
   */
  private async syncPendingNotifications(): Promise<void> {
    if (this.pendingNotifications.length === 0) {
      return;
    }

    console.log('Syncing pending notifications:', this.pendingNotifications.length);

    const notificationsToRemove: string[] = [];

    for (const pendingNotification of this.pendingNotifications) {
      try {
        // Try to fetch the latest notification data from server
        await this.fetchNotificationUpdate(pendingNotification.notification);
        notificationsToRemove.push(pendingNotification.id);
        console.log('Successfully synced notification:', pendingNotification.id);
      } catch (error) {
        console.error('Failed to sync notification:', pendingNotification.id, error);
        
        // Increment retry count
        pendingNotification.retryCount++;
        
        // Remove if max retries exceeded
        if (pendingNotification.retryCount >= this.DEFAULT_MAX_RETRIES) {
          console.warn('Max retries exceeded for notification:', pendingNotification.id);
          notificationsToRemove.push(pendingNotification.id);
        }
      }
    }

    // Remove successfully synced or failed notifications
    this.pendingNotifications = this.pendingNotifications.filter(
      notification => !notificationsToRemove.includes(notification.id)
    );

    if (notificationsToRemove.length > 0) {
      await this.savePendingOperations();
    }
  }

  /**
   * Sync pending operations
   */
  private async syncPendingOperations(): Promise<void> {
    if (this.pendingSyncOperations.length === 0) {
      return;
    }

    console.log('Syncing pending operations:', this.pendingSyncOperations.length);

    const operationsToRemove: string[] = [];

    for (const operation of this.pendingSyncOperations) {
      try {
        await this.executeSyncOperation(operation);
        operationsToRemove.push(operation.id);
        console.log('Successfully executed sync operation:', operation.id, operation.type);
      } catch (error) {
        console.error('Failed to execute sync operation:', operation.id, operation.type, error);
        
        // Increment retry count
        operation.retryCount++;
        
        // Remove if max retries exceeded
        if (operation.retryCount >= operation.maxRetries) {
          console.warn('Max retries exceeded for sync operation:', operation.id, operation.type);
          operationsToRemove.push(operation.id);
        }
      }
    }

    // Remove successfully executed or failed operations
    this.pendingSyncOperations = this.pendingSyncOperations.filter(
      operation => !operationsToRemove.includes(operation.id)
    );

    if (operationsToRemove.length > 0) {
      await this.savePendingOperations();
    }
  }

  /**
   * Fetch notification update from server
   */
  private async fetchNotificationUpdate(notification: NotificationData): Promise<void> {
    try {
      // This would typically fetch the latest notification data from the server
      // For now, we'll just make a simple API call to verify connectivity
      const response = await api.get('/notifications/sync', {
        params: {
          notificationId: notification.id,
          timestamp: notification.timestamp
        }
      });

      console.log('Notification sync response:', response.status);
    } catch (error) {
      console.error('Error fetching notification update:', error);
      throw error;
    }
  }

  /**
   * Execute a sync operation
   */
  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'device_token_registration':
        await this.syncDeviceTokenRegistration(operation.data);
        break;
      case 'notification_sync':
        await this.syncNotificationData(operation.data);
        break;
      case 'settings_sync':
        await this.syncSettingsData(operation.data);
        break;
      default:
        throw new Error(`Unknown sync operation type: ${operation.type}`);
    }
  }

  /**
   * Sync device token registration
   */
  private async syncDeviceTokenRegistration(data: any): Promise<void> {
    try {
      const response = await api.post('/notifications/register-device', {
        deviceToken: data.deviceToken,
        platform: data.platform,
        userId: data.userId
      });

      console.log('Device token registration synced:', response.status);
    } catch (error) {
      console.error('Error syncing device token registration:', error);
      throw error;
    }
  }

  /**
   * Sync notification data
   */
  private async syncNotificationData(data: any): Promise<void> {
    try {
      const response = await api.post('/notifications/sync-data', data);
      console.log('Notification data synced:', response.status);
    } catch (error) {
      console.error('Error syncing notification data:', error);
      throw error;
    }
  }

  /**
   * Sync settings data
   */
  private async syncSettingsData(data: any): Promise<void> {
    try {
      const response = await api.post('/notifications/sync-settings', data);
      console.log('Settings data synced:', response.status);
    } catch (error) {
      console.error('Error syncing settings data:', error);
      throw error;
    }
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.isConnected;
  }

  /**
   * Retry a failed operation with exponential backoff
   */
  async retryFailedOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.DEFAULT_MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Clear any existing retry timeout for this operation
        if (attempt > 0) {
          console.log(`Operation succeeded on attempt ${attempt + 1}`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          console.error(`Operation failed after ${maxRetries + 1} attempts:`, lastError.message);
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.BASE_RETRY_DELAY * Math.pow(2, attempt),
          this.MAX_RETRY_DELAY
        );

        console.warn(`Operation failed on attempt ${attempt + 1}, retrying in ${delay}ms:`, lastError.message);
        
        // Wait before retrying
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Utility function to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTimestamp(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }

  /**
   * Clear all pending operations (for testing or reset)
   */
  async clearPendingOperations(): Promise<void> {
    try {
      this.pendingNotifications = [];
      this.pendingSyncOperations = [];
      
      // Clear retry timeouts
      this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
      this.retryTimeouts.clear();

      await Promise.all([
        AsyncStorage.removeItem(this.PENDING_NOTIFICATIONS_KEY),
        AsyncStorage.removeItem(this.PENDING_SYNC_OPERATIONS_KEY)
      ]);

      console.log('Cleared all pending operations');
    } catch (error) {
      console.error('Error clearing pending operations:', error);
    }
  }

  /**
   * Get pending operations count for monitoring
   */
  getPendingOperationsCount(): { notifications: number; operations: number } {
    return {
      notifications: this.pendingNotifications.length,
      operations: this.pendingSyncOperations.length
    };
  }
}

// Export singleton instance
export const networkSyncService = new NetworkSyncService();