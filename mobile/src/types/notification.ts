/**
 * Notification system type definitions for SafeHaven mobile app
 * Defines interfaces for notification data, settings, and service contracts
 */

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type NotificationType = 'alert' | 'sos' | 'incident';
export type BadgeLocation = 'header' | 'alerts_tab' | 'home_cards';

/**
 * Core notification data structure
 */
export interface NotificationData {
  id: string;
  type: NotificationType;
  severity: AlertSeverity;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
}

/**
 * User notification preferences
 */
export interface NotificationSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  lastUpdated: number;
}

/**
 * Badge update callback function type
 */
export type BadgeUpdateCallback = (location: BadgeLocation, count: number) => void;

/**
 * Sound configuration mapping severity to sound files
 */
export interface SoundConfig {
  critical: string; // Path to urgent sound file
  high: string;     // Path to standard alert sound
  medium: string;   // Path to subtle notification sound
  low: string;      // Path to subtle notification sound
}

/**
 * Haptic feedback pattern mapping
 */
export interface HapticPattern {
  critical: 'notificationSuccess'; // Strong feedback
  high: 'impactHeavy';            // Medium feedback
  medium: 'impactMedium';         // Light feedback
  low: 'impactLight';             // Light feedback
}

/**
 * Notification state for Redux/Context management
 */
export interface NotificationState {
  unreadCounts: {
    alerts: number;
    incidents: number;
    sos: number;
    total: number;
  };
  notifications: NotificationData[];
  settings: NotificationSettings;
  deviceToken: string | null;
  permissionsGranted: boolean;
}

/**
 * Notification action types for state management
 */
export type NotificationAction = 
  | { type: 'UPDATE_BADGE_COUNT'; payload: { location: BadgeLocation; count: number } }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationData }
  | { type: 'MARK_READ'; payload: { notificationIds: string[] } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationSettings> }
  | { type: 'SET_DEVICE_TOKEN'; payload: string }
  | { type: 'SET_PERMISSIONS'; payload: boolean };

/**
 * Local storage schema for notifications
 */
export interface StoredNotificationData {
  notifications: NotificationData[];
  settings: NotificationSettings;
  badgeCounts: Record<BadgeLocation, number>;
  lastSync: number;
}

/**
 * Service contract interfaces
 */

/**
 * Main notification manager interface
 */
export interface INotificationManager {
  initialize(): Promise<void>;
  handleNotification(notification: NotificationData): Promise<void>;
  requestPermissions(): Promise<boolean>;
  registerDeviceToken(): Promise<string>;
  updateBadgeCount(count: number): void;
  navigateToNotification(notification: NotificationData): void;
  syncNotifications(): Promise<void>;
  isOnline(): boolean;
  getPendingOperationsCount(): { notifications: number; operations: number };
  handleNetworkFailure(operation: string, error: Error): Promise<void>;
  getLastSyncTimestamp(): Promise<number | null>;
  scheduleLocalNotification(title: string, body: string, data?: any, trigger?: any): Promise<string>;
  cancelNotification(identifier: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
  getScheduledNotifications(): Promise<any[]>;
}

/**
 * Badge counter service interface
 */
export interface IBadgeCounterService {
  updateBadgeCount(location: BadgeLocation, count: number): void;
  getBadgeCount(location: BadgeLocation): number;
  clearBadge(location: BadgeLocation): void;
  clearAllBadges(): void;
  subscribeToBadgeUpdates(callback: BadgeUpdateCallback): () => void;
}

/**
 * Audio alert service interface
 */
export interface IAudioAlertService {
  playAlert(severity: AlertSeverity): Promise<void>;
  preloadSounds(): Promise<void>;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
}

/**
 * Haptic feedback service interface
 */
export interface IHapticFeedbackService {
  triggerFeedback(severity: AlertSeverity): Promise<void>;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  isSupported(): boolean;
}

/**
 * Notification settings manager interface
 */
export interface INotificationSettingsManager {
  getSoundEnabled(): Promise<boolean>;
  setSoundEnabled(enabled: boolean): Promise<void>;
  getVibrationEnabled(): Promise<boolean>;
  setVibrationEnabled(enabled: boolean): Promise<void>;
  previewSound(severity: AlertSeverity): Promise<void>;
  previewVibration(severity: AlertSeverity): Promise<void>;
  getSettings(): Promise<NotificationSettings>;
  updateSettings(settings: Partial<NotificationSettings>): Promise<void>;
}

/**
 * Navigation handler interface
 */
export interface INavigationHandler {
  handleNotificationPress(notification: NotificationData): void;
  navigateToAlerts(): void;
  navigateToIncident(incidentId: string): void;
  navigateToHome(): void;
  handleDeepLink(url: string): void;
  generateDeepLinkUrl(notification: NotificationData): string;
  registerDeepLinkHandler(): void;
  getInitialDeepLink(): Promise<string | null>;
  isNavigationReady(): boolean;
}

/**
 * Local notification service interface
 */
export interface ILocalNotificationService {
  initialize(): Promise<void>;
  scheduleLocalNotification(notification: NotificationData, delayMinutes?: number): Promise<string>;
  cacheAlert(notification: NotificationData): Promise<void>;
  syncWithRemoteNotifications(remoteNotifications: NotificationData[]): Promise<void>;
  resolveNotificationConflicts(): Promise<void>;
  cleanupExpiredNotifications(): Promise<void>;
  prioritizeStorageForCriticalAlerts(): Promise<void>;
  getCachedAlerts(): Promise<any[]>;
  getLocalNotifications(): Promise<any[]>;
  cancelLocalNotification(localId: string): Promise<void>;
  getStorageUsage(): Promise<{ used: number; available: number; criticalCount: number }>;
}