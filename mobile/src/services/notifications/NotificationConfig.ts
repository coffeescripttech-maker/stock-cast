/**
 * NotificationConfig - Configuration for notification channels, sounds, and haptic patterns
 * Centralizes all notification-related configuration
 */

import { SoundConfig, HapticPattern, AlertSeverity } from '../../types/notification';

/**
 * Sound file configuration
 * Note: Sound files should be placed in assets/sounds/ directory
 */
export const SOUND_CONFIG: SoundConfig = {
  critical: 'critical_alert.wav',
  high: 'high_alert.wav', 
  medium: 'medium_alert.wav',
  low: 'low_alert.wav'
};

/**
 * Haptic feedback patterns for different severity levels
 */
export const HAPTIC_PATTERNS: HapticPattern = {
  critical: 'notificationSuccess', // Strong feedback
  high: 'impactHeavy',            // Medium feedback
  medium: 'impactMedium',         // Light feedback
  low: 'impactLight'              // Light feedback
};

/**
 * Android notification channel configurations
 */
export const ANDROID_CHANNELS = {
  critical: {
    id: 'critical',
    name: 'Critical Alerts',
    importance: 'MAX' as const,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF0000',
    sound: SOUND_CONFIG.critical,
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
    description: 'Critical emergency alerts that require immediate attention'
  },
  high: {
    id: 'high',
    name: 'High Priority Alerts',
    importance: 'HIGH' as const,
    vibrationPattern: [0, 150, 150, 150],
    lightColor: '#FF8C00',
    sound: SOUND_CONFIG.high,
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
    description: 'High priority alerts and warnings'
  },
  medium: {
    id: 'medium',
    name: 'Medium Priority Alerts',
    importance: 'DEFAULT' as const,
    vibrationPattern: [0, 100, 100, 100],
    lightColor: '#FFD700',
    sound: SOUND_CONFIG.medium,
    enableVibrate: true,
    showBadge: true,
    description: 'Medium priority notifications and updates'
  },
  low: {
    id: 'low',
    name: 'Low Priority Alerts',
    importance: 'LOW' as const,
    sound: SOUND_CONFIG.low,
    showBadge: true,
    description: 'Low priority notifications and general updates'
  }
};

/**
 * Default notification settings
 */
export const DEFAULT_NOTIFICATION_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true,
  lastUpdated: Date.now()
};

/**
 * Notification timing constants
 */
export const NOTIFICATION_TIMING = {
  DELIVERY_TIMEOUT: 5000, // 5 seconds max for notification delivery
  RETRY_DELAY: 1000,      // 1 second initial retry delay
  MAX_RETRIES: 3,         // Maximum retry attempts
  SYNC_INTERVAL: 30000,   // 30 seconds for sync operations
  TOKEN_REFRESH_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Badge configuration
 */
export const BADGE_CONFIG = {
  MAX_DISPLAY_COUNT: 99,  // Show "99+" for counts above this
  LOCATIONS: ['header', 'alerts_tab', 'home_cards'] as const,
  COLORS: {
    default: '#FF0000',
    critical: '#FF0000',
    high: '#FF8C00',
    medium: '#FFD700',
    low: '#32CD32'
  }
};

/**
 * Storage keys for notification data
 */
export const STORAGE_KEYS = {
  NOTIFICATIONS: 'stored_notifications',
  SETTINGS: 'notification_settings',
  BADGE_COUNTS: 'badge_counts',
  LAST_SYNC: 'last_notification_sync',
  DEVICE_TOKEN: 'device_token',
  PERMISSIONS: 'notification_permissions'
};

/**
 * Get channel ID for severity level
 */
export function getChannelForSeverity(severity: AlertSeverity): string {
  return severity;
}

/**
 * Get sound file for severity level
 */
export function getSoundForSeverity(severity: AlertSeverity): string {
  return SOUND_CONFIG[severity];
}

/**
 * Get haptic pattern for severity level
 */
export function getHapticForSeverity(severity: AlertSeverity): string {
  return HAPTIC_PATTERNS[severity];
}

  /**
   * Get vibration pattern for severity level (Android)
   */
  export function getVibrationPattern(severity: AlertSeverity): number[] {
    const channel = ANDROID_CHANNELS[severity];
    return (channel as any).vibrationPattern || [0, 100];
  }

/**
 * Validate notification data
 */
export function validateNotificationData(data: any): boolean {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    typeof data.body === 'string' &&
    ['alert', 'sos', 'incident'].includes(data.type) &&
    ['critical', 'high', 'medium', 'low'].includes(data.severity)
  );
}