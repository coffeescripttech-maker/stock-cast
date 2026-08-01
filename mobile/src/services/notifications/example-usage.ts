/**
 * Example usage of the notification infrastructure
 * This file demonstrates how to integrate the notification system into the SafeHaven app
 */

import { NotificationInitializer } from './NotificationInitializer';
import { NotificationManager } from './NotificationManager';
import { PermissionHandler } from './PermissionHandler';
import { NotificationData } from '../../types/notification';

/**
 * Example: Initialize notification system in App.tsx
 */
export async function initializeNotificationsInApp(): Promise<void> {
  try {
    // Get project ID from app.json or environment
    const projectId = '658ac31a-7930-47e9-9adc-8126ed6a438a'; // From app.json

    // Initialize the notification system
    await NotificationInitializer.setupForApp(projectId);
    
    console.log('Notification system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize notification system:', error);
  }
}

/**
 * Example: Handle incoming notification from backend
 */
export async function handleIncomingNotification(notificationData: any): Promise<void> {
  try {
    const manager = NotificationInitializer.getInstance();
    if (!manager) {
      console.warn('Notification manager not initialized');
      return;
    }

    // Convert backend data to NotificationData format
    const notification: NotificationData = {
      id: notificationData.id || `notification-${Date.now()}`,
      type: notificationData.type || 'alert',
      severity: notificationData.severity || 'medium',
      title: notificationData.title || 'SafeHaven Alert',
      body: notificationData.message || notificationData.body || '',
      data: notificationData.data || {},
      timestamp: notificationData.timestamp || Date.now()
    };

    // Handle the notification (this will trigger badges, sounds, haptics)
    await manager.handleNotification(notification);
  } catch (error) {
    console.error('Error handling incoming notification:', error);
  }
}

/**
 * Example: Check notification system status
 */
export async function checkNotificationStatus(): Promise<void> {
  try {
    const status = await NotificationInitializer.getSystemStatus();
    
    console.log('Notification System Status:', {
      initialized: status.initialized,
      hasPermissions: status.hasPermissions,
      hasToken: status.hasToken,
      tokenPreview: status.token ? `${status.token.substring(0, 20)}...` : 'None'
    });

    if (!status.hasPermissions) {
      console.log('Requesting notification permissions...');
      const granted = await PermissionHandler.requestPermissions();
      console.log('Permissions granted:', granted);
    }
  } catch (error) {
    console.error('Error checking notification status:', error);
  }
}

/**
 * Example: Schedule a local notification
 */
export async function scheduleLocalAlert(
  title: string, 
  body: string, 
  delaySeconds: number = 0
): Promise<void> {
  try {
    const manager = NotificationInitializer.getInstance();
    if (!manager) {
      console.warn('Notification manager not initialized');
      return;
    }

    const trigger = delaySeconds > 0 ? { seconds: delaySeconds } : null;
    
    const notificationId = await manager.scheduleLocalNotification(
      title,
      body,
      { type: 'local', severity: 'medium' },
      trigger
    );

    console.log('Local notification scheduled:', notificationId);
  } catch (error) {
    console.error('Error scheduling local notification:', error);
  }
}

/**
 * Example: Handle app state changes
 */
export async function handleAppStateChange(nextAppState: string): Promise<void> {
  try {
    if (nextAppState === 'active') {
      // App came to foreground
      await NotificationInitializer.handleAppForeground();
    } else if (nextAppState === 'background') {
      // App went to background
      await NotificationInitializer.handleAppBackground();
    }
  } catch (error) {
    console.error('Error handling app state change:', error);
  }
}

/**
 * Example integration in App.tsx:
 * 
 * ```typescript
 * import { useEffect } from 'react';
 * import { AppState } from 'react-native';
 * import { 
 *   initializeNotificationsInApp, 
 *   handleAppStateChange 
 * } from './src/services/notifications/example-usage';
 * 
 * export default function App() {
 *   useEffect(() => {
 *     // Initialize notifications when app starts
 *     initializeNotificationsInApp();
 * 
 *     // Handle app state changes
 *     const subscription = AppState.addEventListener('change', handleAppStateChange);
 *     return () => subscription?.remove();
 *   }, []);
 * 
 *   // ... rest of your app
 * }
 * ```
 */