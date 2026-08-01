/**
 * HapticFeedbackService - Handles severity-based haptic feedback
 * 
 * This service manages haptic feedback for different notification severities,
 * including device capability checking, user preference handling, and 
 * severity-to-intensity mapping using expo-haptics.
 * 
 * Requirements covered:
 * - 3.1: Critical severity alerts trigger strong haptic feedback
 * - 3.2: High severity alerts trigger medium haptic feedback
 * - 3.3: Medium/low severity alerts trigger light haptic feedback
 * - 3.4: Respect user vibration preferences
 * - 3.5: Respect device vibration settings
 * - 3.6: Use expo-haptics with appropriate intensity patterns
 */

import * as Haptics from 'expo-haptics';
import { AlertSeverity, IHapticFeedbackService, HapticPattern } from '../../types/notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export class HapticFeedbackService implements IHapticFeedbackService {
  private enabled: boolean = true;
  private deviceSupported: boolean = false;
  private isInitialized: boolean = false;
  private readonly STORAGE_KEY = 'notification_vibration_enabled';

  // Haptic pattern configuration mapping severity to expo-haptics feedback types
  private readonly hapticPatterns: HapticPattern = {
    critical: 'notificationSuccess', // Strong feedback for critical alerts
    high: 'impactHeavy',            // Medium feedback for high alerts
    medium: 'impactMedium',         // Light feedback for medium alerts
    low: 'impactLight',             // Light feedback for low alerts
  };

  constructor() {
    // Initialize asynchronously but don't block constructor
    this.initialize().catch(error => {
      console.warn('Failed to initialize haptic service in constructor:', error);
    });
  }

  /**
   * Initialize the haptic feedback service
   * Check device capabilities and load user preferences
   */
  private async initialize(): Promise<void> {
    try {
      // Check device haptic support
      this.deviceSupported = await this.checkDeviceSupport();
      
      // Load user preference
      await this.loadVibrationPreference();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize haptic feedback service:', error);
      this.deviceSupported = false;
      this.isInitialized = true; // Mark as initialized even on error to prevent blocking
    }
  }

  /**
   * Trigger haptic feedback based on alert severity
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
   */
  async triggerFeedback(severity: AlertSeverity): Promise<void> {
    // Ensure service is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check if haptic feedback is enabled (Requirement 3.4)
    if (!this.enabled) {
      return;
    }

    // Check if device supports haptic feedback (Requirement 3.5)
    if (!this.deviceSupported) {
      return;
    }

    try {
      const hapticType = this.hapticPatterns[severity];
      
      // Trigger appropriate haptic feedback based on severity (Requirements 3.1, 3.2, 3.3, 3.6)
      switch (hapticType) {
        case 'notificationSuccess':
          // Strong feedback for critical alerts (Requirement 3.1)
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
          
        case 'impactHeavy':
          // Medium feedback for high alerts (Requirement 3.2)
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
          
        case 'impactMedium':
          // Light feedback for medium alerts (Requirement 3.3)
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
          
        case 'impactLight':
          // Light feedback for low alerts (Requirement 3.3)
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
          
        default:
          console.warn(`Unknown haptic pattern: ${hapticType}`);
          // Fallback to light impact for unknown patterns
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
    } catch (error) {
      console.error(`Failed to trigger haptic feedback for severity ${severity}:`, error);
      // Graceful degradation - don't throw error to avoid breaking notification flow
    }
  }

  /**
   * Enable or disable haptic feedback
   * Requirement: 3.4 - Respect user vibration preferences
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.saveVibrationPreference(enabled);
  }

  /**
   * Check if haptic feedback is enabled
   * Requirement: 3.4 - Respect user vibration preferences
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if device supports haptic feedback
   * Requirement: 3.5 - Respect device vibration settings
   */
  isSupported(): boolean {
    return this.deviceSupported;
  }

  /**
   * Check device haptic support capabilities
   * Different platforms have different haptic capabilities
   */
  private async checkDeviceSupport(): Promise<boolean> {
    try {
      // On iOS, haptic feedback is generally supported on iPhone 7 and later
      // On Android, it depends on the device hardware
      if (Platform.OS === 'ios') {
        // Try to trigger a light haptic to test support
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return true;
      } else if (Platform.OS === 'android') {
        // Android support varies by device, try a test haptic
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Device does not support haptic feedback:', error);
      return false;
    }
  }

  /**
   * Load vibration preference from storage
   */
  private async loadVibrationPreference(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored !== null) {
        this.enabled = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load vibration preference:', error);
      // Default to enabled if loading fails
      this.enabled = true;
    }
  }

  /**
   * Save vibration preference to storage
   */
  private async saveVibrationPreference(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.warn('Failed to save vibration preference:', error);
    }
  }

  /**
   * Get the haptic pattern for a given severity (for testing/debugging)
   */
  getHapticPattern(severity: AlertSeverity): string {
    return this.hapticPatterns[severity];
  }

  /**
   * Test haptic feedback for a specific severity (for settings preview)
   * This method ignores the enabled state to allow testing in settings
   */
  async testFeedback(severity: AlertSeverity): Promise<void> {
    // Ensure service is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check device support but ignore enabled state for testing
    if (!this.deviceSupported) {
      throw new Error('Device does not support haptic feedback');
    }

    try {
      const hapticType = this.hapticPatterns[severity];
      
      switch (hapticType) {
        case 'notificationSuccess':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'impactHeavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'impactMedium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'impactLight':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error(`Failed to test haptic feedback for severity ${severity}:`, error);
      throw error; // Re-throw for testing scenarios
    }
  }

  /**
   * Get service status for debugging
   */
  async getServiceStatus(): Promise<{
    isInitialized: boolean;
    isEnabled: boolean;
    deviceSupported: boolean;
    platform: string;
    availablePatterns: HapticPattern;
  }> {
    return {
      isInitialized: this.isInitialized,
      isEnabled: this.enabled,
      deviceSupported: this.deviceSupported,
      platform: Platform.OS,
      availablePatterns: this.hapticPatterns,
    };
  }

  /**
   * Reset service to default state (useful for testing)
   */
  async reset(): Promise<void> {
    this.enabled = true;
    this.isInitialized = false;
    await this.initialize();
  }
}

// Export singleton instance
export const hapticFeedbackService = new HapticFeedbackService();