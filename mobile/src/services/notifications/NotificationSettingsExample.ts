/**
 * NotificationSettingsManager Usage Examples
 * 
 * This file demonstrates how to use the NotificationSettingsManager
 * for managing notification preferences in the SafeHaven mobile app.
 */

import { notificationSettingsManager } from './NotificationSettingsManager';
import { AlertSeverity } from '../../types/notification';

/**
 * Example: Basic settings management
 */
export async function basicSettingsExample() {
  console.log('=== Basic Settings Management ===');
  
  // Get current settings
  const currentSettings = await notificationSettingsManager.getSettings();
  console.log('Current settings:', currentSettings);
  
  // Check individual settings
  const soundEnabled = await notificationSettingsManager.getSoundEnabled();
  const vibrationEnabled = await notificationSettingsManager.getVibrationEnabled();
  console.log(`Sound: ${soundEnabled}, Vibration: ${vibrationEnabled}`);
  
  // Update individual settings
  await notificationSettingsManager.setSoundEnabled(false);
  await notificationSettingsManager.setVibrationEnabled(true);
  console.log('Updated sound and vibration settings');
  
  // Update multiple settings at once
  await notificationSettingsManager.updateSettings({
    soundEnabled: true,
    vibrationEnabled: false,
  });
  console.log('Updated multiple settings');
}

/**
 * Example: Preview functionality for settings screen
 */
export async function previewFunctionalityExample() {
  console.log('=== Preview Functionality ===');
  
  const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
  
  // Preview sounds for different severity levels
  for (const severity of severities) {
    try {
      console.log(`Previewing ${severity} sound...`);
      await notificationSettingsManager.previewSound(severity);
    } catch (error) {
      console.error(`Failed to preview ${severity} sound:`, (error as Error).message);
    }
  }
  
  // Preview vibrations for different severity levels
  for (const severity of severities) {
    try {
      console.log(`Previewing ${severity} vibration...`);
      await notificationSettingsManager.previewVibration(severity);
    } catch (error) {
      console.error(`Failed to preview ${severity} vibration:`, (error as Error).message);
    }
  }
}

/**
 * Example: Settings persistence and backup
 */
export async function settingsPersistenceExample() {
  console.log('=== Settings Persistence ===');
  
  // Test if persistence is working
  const canPersist = await notificationSettingsManager.testPersistence();
  console.log(`Persistence available: ${canPersist}`);
  
  // Export current settings (for backup)
  const exportedSettings = await notificationSettingsManager.exportSettings();
  console.log('Exported settings:', exportedSettings);
  
  // Simulate settings change
  await notificationSettingsManager.setSoundEnabled(false);
  
  // Import settings (restore from backup)
  await notificationSettingsManager.importSettings(exportedSettings);
  console.log('Restored settings from backup');
}

/**
 * Example: Error handling and diagnostics
 */
export async function errorHandlingExample() {
  console.log('=== Error Handling & Diagnostics ===');
  
  // Get detailed status for debugging
  const status = await notificationSettingsManager.getSettingsStatus();
  console.log('Settings status:', status);
  
  // Get available severity levels
  const severityLevels = notificationSettingsManager.getAvailableSeverityLevels();
  console.log('Available severity levels:', severityLevels);
  
  // Test preview with error handling
  try {
    await notificationSettingsManager.previewVibration('critical');
  } catch (error) {
    console.log('Handled preview error gracefully:', (error as Error).message);
  }
}

/**
 * Example: Settings screen integration
 */
export class NotificationSettingsScreen {
  private soundEnabled: boolean = true;
  private vibrationEnabled: boolean = true;
  
  async initialize() {
    // Load current settings when screen opens
    this.soundEnabled = await notificationSettingsManager.getSoundEnabled();
    this.vibrationEnabled = await notificationSettingsManager.getVibrationEnabled();
    
    console.log('Settings screen initialized with:', {
      sound: this.soundEnabled,
      vibration: this.vibrationEnabled,
    });
  }
  
  async toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    await notificationSettingsManager.setSoundEnabled(this.soundEnabled);
    console.log(`Sound ${this.soundEnabled ? 'enabled' : 'disabled'}`);
  }
  
  async toggleVibration() {
    this.vibrationEnabled = !this.vibrationEnabled;
    await notificationSettingsManager.setVibrationEnabled(this.vibrationEnabled);
    console.log(`Vibration ${this.vibrationEnabled ? 'enabled' : 'disabled'}`);
  }
  
  async previewCriticalAlert() {
    try {
      // Preview both sound and vibration for critical alert
      await notificationSettingsManager.previewSound('critical');
      await notificationSettingsManager.previewVibration('critical');
      console.log('Critical alert preview completed');
    } catch (error) {
      console.error('Preview failed:', (error as Error).message);
    }
  }
  
  async resetToDefaults() {
    await notificationSettingsManager.resetToDefaults();
    await this.initialize(); // Reload settings
    console.log('Settings reset to defaults');
  }
}

/**
 * Example: Integration with notification system
 */
export async function notificationSystemIntegration() {
  console.log('=== Notification System Integration ===');
  
  // This would typically be called by the NotificationManager
  // when a notification is received
  
  const mockNotification = {
    id: '123',
    type: 'alert' as const,
    severity: 'critical' as AlertSeverity,
    title: 'Emergency Alert',
    body: 'Severe weather warning in your area',
    timestamp: Date.now(),
  };
  
  // Check if sound is enabled before playing
  const soundEnabled = await notificationSettingsManager.getSoundEnabled();
  if (soundEnabled) {
    console.log('Playing sound for notification...');
    // audioAlertService.playAlert(mockNotification.severity);
  }
  
  // Check if vibration is enabled before triggering
  const vibrationEnabled = await notificationSettingsManager.getVibrationEnabled();
  if (vibrationEnabled) {
    console.log('Triggering vibration for notification...');
    // hapticFeedbackService.triggerFeedback(mockNotification.severity);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    await basicSettingsExample();
    await previewFunctionalityExample();
    await settingsPersistenceExample();
    await errorHandlingExample();
    await notificationSystemIntegration();
    
    // Settings screen example
    const settingsScreen = new NotificationSettingsScreen();
    await settingsScreen.initialize();
    await settingsScreen.toggleSound();
    await settingsScreen.previewCriticalAlert();
    await settingsScreen.resetToDefaults();
    
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Example execution failed:', error);
  }
}

// Export for use in other files
export { notificationSettingsManager };