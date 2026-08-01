/**
 * Notification services index
 * Exports all notification-related services and utilities
 */

export { NotificationManager } from './NotificationManager';
export { PermissionHandler } from './PermissionHandler';
export { NotificationInitializer } from './NotificationInitializer';
export { BadgeCounterService } from './BadgeCounterService';
export { AudioAlertService, audioAlertService } from './AudioAlertService';
export { HapticFeedbackService, hapticFeedbackService } from './HapticFeedbackService';
export { NotificationSettingsManager, notificationSettingsManager } from './NotificationSettingsManager';
export * from './NotificationConfig';

// Re-export types for convenience
export * from '../../types/notification';