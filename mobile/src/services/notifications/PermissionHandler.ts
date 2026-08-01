/**
 * PermissionHandler - Manages notification permissions and device token registration
 * Handles permission requests, validation, and retry logic with exponential backoff
 * Implements comprehensive permission handling with fallback functionality and runtime detection
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, Linking, Platform } from 'react-native';

interface PermissionState {
  granted: boolean;
  lastChecked: number;
  tokenRegistered: boolean;
  deviceToken?: string;
  denialCount: number;
  lastDenialTime?: number;
  fallbackMode: boolean;
}

interface TokenValidationResult {
  isValid: boolean;
  token?: string;
  needsRefresh: boolean;
  error?: string;
}

interface FallbackCapabilities {
  canShowInAppNotifications: boolean;
  canUseLocalStorage: boolean;
  canScheduleLocalNotifications: boolean;
  canAccessSettings: boolean;
}

type PermissionChangeListener = (granted: boolean) => void;

export class PermissionHandler {
  private static readonly PERMISSION_STORAGE_KEY = 'notification_permissions';
  private static readonly TOKEN_STORAGE_KEY = 'device_token';
  private static readonly MAX_RETRY_ATTEMPTS = 5;
  private static readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private static readonly TOKEN_VALIDATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_DENIAL_COUNT = 3;
  private static readonly DENIAL_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

  private static permissionChangeListeners: PermissionChangeListener[] = [];
  private static appStateSubscription: { remove: () => void } | null = null;
  private static isMonitoringPermissions = false;

  /**
   * Request notification permissions with proper error handling and fallback
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        await this.savePermissionState({ 
          granted: false, 
          lastChecked: Date.now(),
          tokenRegistered: false,
          denialCount: 0,
          fallbackMode: true
        });
        return false;
      }

      // Check existing permissions first
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        await this.savePermissionState({ 
          granted: true, 
          lastChecked: Date.now(),
          tokenRegistered: false,
          denialCount: 0,
          fallbackMode: false
        });
        return true;
      }

      // Check if we should avoid requesting due to repeated denials
      const currentState = await this.getPermissionState();
      if (this.shouldAvoidRequest(currentState)) {
        console.log('Avoiding permission request due to repeated denials');
        await this.enableFallbackMode();
        return false;
      }

      // Request permissions if not granted
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';

      // Update denial count if permission was denied
      const newDenialCount = granted ? 0 : currentState.denialCount + 1;
      const shouldEnableFallback = !granted && newDenialCount >= this.MAX_DENIAL_COUNT;

      await this.savePermissionState({ 
        granted, 
        lastChecked: Date.now(),
        tokenRegistered: false,
        denialCount: newDenialCount,
        lastDenialTime: granted ? undefined : Date.now(),
        fallbackMode: shouldEnableFallback
      });

      if (!granted) {
        console.warn('Notification permissions denied by user');
        if (shouldEnableFallback) {
          await this.enableFallbackMode();
        }
      }

      // Notify listeners of permission change
      this.notifyPermissionChange(granted);

      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      await this.savePermissionState({ 
        granted: false, 
        lastChecked: Date.now(),
        tokenRegistered: false,
        denialCount: 0,
        fallbackMode: true
      });
      await this.enableFallbackMode();
      return false;
    }
  }

  /**
   * Check current permission status with runtime change detection
   */
  static async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === 'granted';

      // Update stored permission state
      const currentState = await this.getPermissionState();
      const previouslyGranted = currentState.granted;

      await this.savePermissionState({
        ...currentState,
        granted,
        lastChecked: Date.now()
      });

      // Detect runtime permission changes
      if (previouslyGranted !== granted) {
        console.log(`Permission status changed: ${previouslyGranted} -> ${granted}`);
        this.notifyPermissionChange(granted);
        
        if (!granted && previouslyGranted) {
          // Permissions were revoked
          await this.handlePermissionRevocation();
        } else if (granted && !previouslyGranted) {
          // Permissions were granted
          await this.handlePermissionGrant();
        }
      }

      return granted;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Register device token with exponential backoff retry logic
   */
  static async registerDeviceToken(projectId?: string): Promise<string | null> {
    let attempt = 0;
    let delay = this.INITIAL_RETRY_DELAY;

    while (attempt < this.MAX_RETRY_ATTEMPTS) {
      try {
        if (!Device.isDevice) {
          throw new Error('Must use physical device for push notifications');
        }

        // Check permissions first
        const hasPermissions = await this.checkPermissions();
        if (!hasPermissions) {
          throw new Error('Notification permissions not granted');
        }

        // Get the Expo push token
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId || undefined,
        });

        const token = tokenData.data;

        // Save token and update permission state
        await AsyncStorage.setItem(this.TOKEN_STORAGE_KEY, token);
        
        const currentState = await this.getPermissionState();
        await this.savePermissionState({
          ...currentState,
          tokenRegistered: true,
          deviceToken: token
        });

        console.log('Device token registered successfully:', token);
        return token;

      } catch (error) {
        attempt++;
        console.error(`Device token registration attempt ${attempt} failed:`, error);

        if (attempt >= this.MAX_RETRY_ATTEMPTS) {
          console.error('Max retry attempts reached for device token registration');
          return null;
        }

        // Wait before retrying with exponential backoff
        await this.delay(delay);
        delay *= 2; // Double the delay for next attempt
      }
    }

    return null;
  }

  /**
   * Validate and refresh device token if needed with comprehensive validation
   */
  static async validateAndRefreshToken(projectId?: string): Promise<TokenValidationResult> {
    try {
      const storedToken = await AsyncStorage.getItem(this.TOKEN_STORAGE_KEY);
      const permissionState = await this.getPermissionState();

      // Check if token validation is needed
      const needsValidation = this.shouldValidateToken(permissionState);

      if (!needsValidation && storedToken && permissionState.granted && permissionState.tokenRegistered) {
        return {
          isValid: true,
          token: storedToken,
          needsRefresh: false
        };
      }

      // Validate current permissions
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        console.warn('Permissions not granted, cannot validate token');
        await this.clearTokenData();
        return {
          isValid: false,
          needsRefresh: false,
          error: 'Permissions not granted'
        };
      }

      // Attempt to refresh token
      const newToken = await this.registerDeviceToken(projectId);
      if (newToken) {
        return {
          isValid: true,
          token: newToken,
          needsRefresh: true
        };
      } else {
        return {
          isValid: false,
          needsRefresh: true,
          error: 'Failed to refresh token'
        };
      }
    } catch (error) {
      console.error('Error validating device token:', error);
      return {
        isValid: false,
        needsRefresh: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle runtime permission changes with comprehensive detection
   */
  static async handlePermissionChange(): Promise<void> {
    try {
      const currentPermissions = await this.checkPermissions();
      const storedState = await this.getPermissionState();

      // If permissions were revoked
      if (storedState.granted && !currentPermissions) {
        await this.handlePermissionRevocation();
      }
      
      // If permissions were granted
      else if (!storedState.granted && currentPermissions) {
        await this.handlePermissionGrant();
      }
    } catch (error) {
      console.error('Error handling permission change:', error);
    }
  }

  /**
   * Handle permission revocation
   */
  private static async handlePermissionRevocation(): Promise<void> {
    console.log('Notification permissions were revoked');
    
    // Clear stored token and update state
    await this.clearTokenData();
    
    // Enable fallback mode
    await this.enableFallbackMode();
    
    // Notify listeners
    this.notifyPermissionChange(false);
  }

  /**
   * Handle permission grant
   */
  private static async handlePermissionGrant(): Promise<void> {
    console.log('Notification permissions were granted');
    
    // Update permission state
    const currentState = await this.getPermissionState();
    await this.savePermissionState({
      ...currentState,
      granted: true,
      lastChecked: Date.now(),
      tokenRegistered: false,
      fallbackMode: false,
      denialCount: 0,
      lastDenialTime: undefined
    });
    
    // Notify listeners
    this.notifyPermissionChange(true);
  }

  /**
   * Start monitoring permission changes
   */
  static startPermissionMonitoring(): void {
    if (this.isMonitoringPermissions) {
      return;
    }

    this.isMonitoringPermissions = true;

    // Monitor app state changes to detect permission changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));

    console.log('Permission monitoring started');
  }

  /**
   * Stop monitoring permission changes
   */
  static stopPermissionMonitoring(): void {
    if (!this.isMonitoringPermissions) {
      return;
    }

    this.isMonitoringPermissions = false;

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    console.log('Permission monitoring stopped');
  }

  /**
   * Handle app state changes to detect permission changes
   */
  private static async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    if (nextAppState === 'active') {
      // App became active, check for permission changes
      await this.checkPermissions();
    }
  }

  /**
   * Add permission change listener
   */
  static addPermissionChangeListener(listener: PermissionChangeListener): () => void {
    this.permissionChangeListeners.push(listener);
    
    return () => {
      const index = this.permissionChangeListeners.indexOf(listener);
      if (index > -1) {
        this.permissionChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all permission change listeners
   */
  private static notifyPermissionChange(granted: boolean): void {
    this.permissionChangeListeners.forEach(listener => {
      try {
        listener(granted);
      } catch (error) {
        console.error('Error in permission change listener:', error);
      }
    });
  }

  /**
   * Enable fallback mode for denied permissions
   */
  static async enableFallbackMode(): Promise<void> {
    try {
      const currentState = await this.getPermissionState();
      await this.savePermissionState({
        ...currentState,
        fallbackMode: true
      });

      console.log('Fallback mode enabled for notifications');
    } catch (error) {
      console.error('Error enabling fallback mode:', error);
    }
  }

  /**
   * Check if fallback mode is enabled
   */
  static async isFallbackModeEnabled(): Promise<boolean> {
    try {
      const state = await this.getPermissionState();
      return state.fallbackMode || false;
    } catch (error) {
      console.error('Error checking fallback mode:', error);
      return false;
    }
  }

  /**
   * Get available fallback capabilities
   */
  static async getFallbackCapabilities(): Promise<FallbackCapabilities> {
    try {
      return {
        canShowInAppNotifications: true, // Always available
        canUseLocalStorage: true, // AsyncStorage always available
        canScheduleLocalNotifications: Device.isDevice, // Requires physical device
        canAccessSettings: await this.canOpenSettings()
      };
    } catch (error) {
      console.error('Error getting fallback capabilities:', error);
      return {
        canShowInAppNotifications: true,
        canUseLocalStorage: true,
        canScheduleLocalNotifications: false,
        canAccessSettings: false
      };
    }
  }

  /**
   * Open device settings for notification permissions
   */
  static async openNotificationSettings(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const url = 'app-settings:';
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return true;
        }
      } else if (Platform.OS === 'android') {
        const url = 'android.settings.APP_NOTIFICATION_SETTINGS';
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return true;
        }
      }
      
      // Fallback to general settings
      await Linking.openSettings();
      return true;
    } catch (error) {
      console.error('Error opening notification settings:', error);
      return false;
    }
  }

  /**
   * Check if we can open device settings
   */
  private static async canOpenSettings(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await Linking.canOpenURL('app-settings:');
      } else if (Platform.OS === 'android') {
        return await Linking.canOpenURL('android.settings.APP_NOTIFICATION_SETTINGS');
      }
      return true; // Assume we can open general settings
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if we should avoid requesting permissions due to repeated denials
   */
  private static shouldAvoidRequest(state: PermissionState): boolean {
    if (state.denialCount < this.MAX_DENIAL_COUNT) {
      return false;
    }

    if (!state.lastDenialTime) {
      return false;
    }

    const timeSinceLastDenial = Date.now() - state.lastDenialTime;
    return timeSinceLastDenial < this.DENIAL_COOLDOWN;
  }

  /**
   * Check if token validation is needed
   */
  private static shouldValidateToken(state: PermissionState): boolean {
    if (!state.granted || !state.tokenRegistered) {
      return true;
    }

    const timeSinceLastCheck = Date.now() - state.lastChecked;
    return timeSinceLastCheck > this.TOKEN_VALIDATION_INTERVAL;
  }

  /**
   * Clear token data when permissions are revoked
   */
  private static async clearTokenData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TOKEN_STORAGE_KEY);
      
      const currentState = await this.getPermissionState();
      await this.savePermissionState({
        ...currentState,
        granted: false,
        tokenRegistered: false,
        deviceToken: undefined
      });
    } catch (error) {
      console.error('Error clearing token data:', error);
    }
  }

  /**
   * Get stored permission state with default values
   */
  static async getPermissionState(): Promise<PermissionState> {
    try {
      const stored = await AsyncStorage.getItem(this.PERMISSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure all required fields are present with defaults
        return {
          granted: parsed.granted || false,
          lastChecked: parsed.lastChecked || 0,
          tokenRegistered: parsed.tokenRegistered || false,
          deviceToken: parsed.deviceToken,
          denialCount: parsed.denialCount || 0,
          lastDenialTime: parsed.lastDenialTime,
          fallbackMode: parsed.fallbackMode || false
        };
      }
    } catch (error) {
      console.error('Error getting permission state:', error);
    }

    // Return default state
    return {
      granted: false,
      lastChecked: 0,
      tokenRegistered: false,
      denialCount: 0,
      fallbackMode: false
    };
  }

  /**
   * Save permission state to storage
   */
  private static async savePermissionState(state: PermissionState): Promise<void> {
    try {
      await AsyncStorage.setItem(this.PERMISSION_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving permission state:', error);
    }
  }

  /**
   * Get stored device token
   */
  static async getStoredDeviceToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('Error getting stored device token:', error);
      return null;
    }
  }

  /**
   * Clear all stored permission data
   */
  static async clearStoredData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.PERMISSION_STORAGE_KEY,
        this.TOKEN_STORAGE_KEY
      ]);
    } catch (error) {
      console.error('Error clearing stored permission data:', error);
    }
  }

  /**
   * Provide comprehensive fallback functionality when permissions are denied
   */
  static async getFallbackGuidance(): Promise<{
    title: string;
    message: string;
    actions: Array<{ label: string; action: string; enabled: boolean }>;
    capabilities: FallbackCapabilities;
    canRetry: boolean;
  }> {
    const capabilities = await this.getFallbackCapabilities();
    const state = await this.getPermissionState();
    const canRetry = !this.shouldAvoidRequest(state);

    return {
      title: 'Notification Permissions Required',
      message: 'SafeHaven needs notification permissions to alert you about emergency situations. You can still use the app, but you won\'t receive push notifications. We\'ll show alerts within the app instead.',
      actions: [
        { 
          label: 'Open Settings', 
          action: 'open_settings',
          enabled: capabilities.canAccessSettings
        },
        { 
          label: 'Continue Without Notifications', 
          action: 'continue',
          enabled: true
        },
        { 
          label: 'Try Again', 
          action: 'retry',
          enabled: canRetry
        }
      ],
      capabilities,
      canRetry
    };
  }

  /**
   * Utility function for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}