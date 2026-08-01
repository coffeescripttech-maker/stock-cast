/**
 * NotificationSettingsManager - Manages user notification preferences
 * 
 * This service provides a unified interface for managing notification settings,
 * including sound and vibration preferences, settings persistence, and preview
 * functionality for testing notification behavior.
 * 
 * Requirements covered:
 * - 5.1: Provide toggle options for sounds and vibrations
 * - 5.2: Disable sounds when sound setting is disabled
 * - 5.3: Disable vibrations when vibration setting is disabled
 * - 5.4: Apply settings changes immediately
 * - 5.5: Persist user preferences across app sessions
 * - 5.6: Provide preview functionality for testing sound and vibration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AlertSeverity, 
  NotificationSettings, 
  INotificationSettingsManager 
} from '../../types/notification';
import { audioAlertService } from './AudioAlertService';
import { hapticFeedbackService } from './HapticFeedbackService';

export class NotificationSettingsManager implements INotificationSettingsManager {
  private settings: NotificationSettings;
  private isInitialized: boolean = false;
  private readonly STORAGE_KEY = 'notification_settings';
  
  // Default settings
  private readonly DEFAULT_SETTINGS: NotificationSettings = {
    soundEnabled: true,
    vibrationEnabled: true,
    lastUpdated: Date.now(),
  };

  constructor() {
    // Initialize with defaults, load from storage asynchronously
    this.settings = { ...this.DEFAULT_SETTINGS };
    this.initialize().catch(error => {
      console.warn('Failed to initialize notification settings manager:', error);
    });
  }

  /**
   * Initialize the settings manager by loading stored preferences
   */
  private async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      
      // Apply loaded settings to services immediately (Requirement 5.4)
      await this.applySettingsToServices();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification settings:', error);
      // Use defaults if initialization fails
      this.settings = { ...this.DEFAULT_SETTINGS };
      this.isInitialized = true;
    }
  }

  /**
   * Get current sound enabled state
   * Requirement: 5.1 - Provide toggle options for sounds and vibrations
   */
  async getSoundEnabled(): Promise<boolean> {
    await this.ensureInitialized();
    return this.settings.soundEnabled;
  }

  /**
   * Set sound enabled state
   * Requirements: 5.2, 5.4, 5.5 - Disable sounds, apply immediately, persist
   */
  async setSoundEnabled(enabled: boolean): Promise<void> {
    await this.ensureInitialized();
    
    this.settings.soundEnabled = enabled;
    this.settings.lastUpdated = Date.now();
    
    // Apply change immediately to audio service (Requirement 5.4)
    try {
      audioAlertService.setEnabled(enabled);
    } catch (error) {
      console.warn('Failed to apply sound setting to audio service:', error);
      // Continue with persistence even if service application fails
    }
    
    // Persist the change (Requirement 5.5)
    await this.saveSettings();
  }

  /**
   * Get current vibration enabled state
   * Requirement: 5.1 - Provide toggle options for sounds and vibrations
   */
  async getVibrationEnabled(): Promise<boolean> {
    await this.ensureInitialized();
    return this.settings.vibrationEnabled;
  }

  /**
   * Set vibration enabled state
   * Requirements: 5.3, 5.4, 5.5 - Disable vibrations, apply immediately, persist
   */
  async setVibrationEnabled(enabled: boolean): Promise<void> {
    await this.ensureInitialized();
    
    this.settings.vibrationEnabled = enabled;
    this.settings.lastUpdated = Date.now();
    
    // Apply change immediately to haptic service (Requirement 5.4)
    try {
      hapticFeedbackService.setEnabled(enabled);
    } catch (error) {
      console.warn('Failed to apply vibration setting to haptic service:', error);
      // Continue with persistence even if service application fails
    }
    
    // Persist the change (Requirement 5.5)
    await this.saveSettings();
  }

  /**
   * Preview sound for a specific severity level
   * Requirement: 5.6 - Provide preview functionality for testing sound and vibration
   */
  async previewSound(severity: AlertSeverity): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // Temporarily enable sound for preview if it's disabled
      const originalSoundState = audioAlertService.isEnabled();
      
      if (!originalSoundState) {
        audioAlertService.setEnabled(true);
      }
      
      // Play the preview sound
      await audioAlertService.playAlert(severity);
      
      // Restore original sound state
      if (!originalSoundState) {
        audioAlertService.setEnabled(false);
      }
      
    } catch (error) {
      console.error(`Failed to preview sound for severity ${severity}:`, error);
      throw new Error(`Sound preview failed: ${error.message}`);
    }
  }

  /**
   * Preview vibration for a specific severity level
   * Requirement: 5.6 - Provide preview functionality for testing sound and vibration
   */
  async previewVibration(severity: AlertSeverity): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // Check if device supports haptic feedback
      if (!hapticFeedbackService.isSupported()) {
        throw new Error('Device does not support haptic feedback');
      }
      
      // Use the test method which ignores enabled state for preview
      await hapticFeedbackService.testFeedback(severity);
      
    } catch (error) {
      console.error(`Failed to preview vibration for severity ${severity}:`, error);
      throw new Error(`Vibration preview failed: ${error.message}`);
    }
  }

  /**
   * Get complete notification settings
   * Requirement: 5.5 - Persist user preferences across app sessions
   */
  async getSettings(): Promise<NotificationSettings> {
    await this.ensureInitialized();
    return { ...this.settings }; // Return a copy to prevent external mutation
  }

  /**
   * Update notification settings with partial changes
   * Requirements: 5.4, 5.5 - Apply changes immediately, persist preferences
   */
  async updateSettings(settingsUpdate: Partial<NotificationSettings>): Promise<void> {
    await this.ensureInitialized();
    
    // Update settings object
    this.settings = {
      ...this.settings,
      ...settingsUpdate,
      lastUpdated: Date.now(),
    };
    
    // Apply changes immediately to services (Requirement 5.4)
    await this.applySettingsToServices();
    
    // Persist the changes (Requirement 5.5)
    await this.saveSettings();
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.settings = { 
      ...this.DEFAULT_SETTINGS,
      lastUpdated: Date.now(),
    };
    
    // Apply defaults to services
    await this.applySettingsToServices();
    
    // Persist the reset
    await this.saveSettings();
  }

  /**
   * Get settings status for debugging
   */
  async getSettingsStatus(): Promise<{
    isInitialized: boolean;
    settings: NotificationSettings;
    audioServiceEnabled: boolean;
    hapticServiceEnabled: boolean;
    hapticSupported: boolean;
  }> {
    await this.ensureInitialized();
    
    return {
      isInitialized: this.isInitialized,
      settings: { ...this.settings },
      audioServiceEnabled: audioAlertService.isEnabled(),
      hapticServiceEnabled: hapticFeedbackService.isEnabled(),
      hapticSupported: hapticFeedbackService.isSupported(),
    };
  }

  /**
   * Ensure the service is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Load settings from AsyncStorage
   * Requirement: 5.5 - Persist user preferences across app sessions
   */
  private async loadSettings(): Promise<void> {
    try {
      const storedSettings = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as NotificationSettings;
        
        // Validate the loaded settings structure
        if (this.isValidSettings(parsed)) {
          this.settings = {
            ...this.DEFAULT_SETTINGS,
            ...parsed,
          };
        } else {
          console.warn('Invalid settings format in storage, using defaults');
          this.settings = { ...this.DEFAULT_SETTINGS };
        }
      } else {
        // No stored settings, use defaults
        this.settings = { ...this.DEFAULT_SETTINGS };
      }
      
    } catch (error) {
      console.error('Failed to load notification settings from storage:', error);
      this.settings = { ...this.DEFAULT_SETTINGS };
    }
  }

  /**
   * Save settings to AsyncStorage
   * Requirement: 5.5 - Persist user preferences across app sessions
   */
  private async saveSettings(): Promise<void> {
    try {
      const settingsJson = JSON.stringify(this.settings);
      await AsyncStorage.setItem(this.STORAGE_KEY, settingsJson);
    } catch (error) {
      console.error('Failed to save notification settings to storage:', error);
      throw new Error('Settings persistence failed');
    }
  }

  /**
   * Apply current settings to audio and haptic services
   * Requirement: 5.4 - Apply settings changes immediately
   */
  private async applySettingsToServices(): Promise<void> {
    try {
      // Apply sound setting to audio service (Requirements 5.2, 5.4)
      audioAlertService.setEnabled(this.settings.soundEnabled);
    } catch (error) {
      console.warn('Failed to apply sound setting to audio service:', error);
      // Don't throw here to avoid breaking the settings flow
    }

    try {
      // Apply vibration setting to haptic service (Requirements 5.3, 5.4)
      hapticFeedbackService.setEnabled(this.settings.vibrationEnabled);
    } catch (error) {
      console.warn('Failed to apply vibration setting to haptic service:', error);
      // Don't throw here to avoid breaking the settings flow
    }
  }

  /**
   * Validate settings object structure
   */
  private isValidSettings(settings: any): settings is NotificationSettings {
    return (
      typeof settings === 'object' &&
      settings !== null &&
      typeof settings.soundEnabled === 'boolean' &&
      typeof settings.vibrationEnabled === 'boolean' &&
      typeof settings.lastUpdated === 'number'
    );
  }

  /**
   * Get available severity levels for preview testing
   */
  getAvailableSeverityLevels(): AlertSeverity[] {
    return ['critical', 'high', 'medium', 'low'];
  }

  /**
   * Test if settings can be persisted (for diagnostics)
   */
  async testPersistence(): Promise<boolean> {
    try {
      const testKey = `${this.STORAGE_KEY}_test`;
      const testData = { test: true, timestamp: Date.now() };
      
      await AsyncStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);
      
      return retrieved !== null && JSON.parse(retrieved).test === true;
    } catch (error) {
      console.error('Settings persistence test failed:', error);
      return false;
    }
  }

  /**
   * Import settings from external source (for migration/backup)
   */
  async importSettings(externalSettings: NotificationSettings): Promise<void> {
    if (!this.isValidSettings(externalSettings)) {
      throw new Error('Invalid settings format for import');
    }
    
    await this.updateSettings(externalSettings);
  }

  /**
   * Export current settings (for backup/migration)
   */
  async exportSettings(): Promise<NotificationSettings> {
    await this.ensureInitialized();
    return { ...this.settings };
  }
}

// Export singleton instance
export const notificationSettingsManager = new NotificationSettingsManager();