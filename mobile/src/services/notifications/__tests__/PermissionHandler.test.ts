/**
 * PermissionHandler tests
 * Tests for comprehensive notification permission management and device token registration
 */

import { PermissionHandler } from '../PermissionHandler';
import { AppState } from 'react-native';

// Mock expo-notifications
const mockGetPermissions = jest.fn(() => Promise.resolve({ status: 'granted' }));
const mockRequestPermissions = jest.fn(() => Promise.resolve({ status: 'granted' }));
const mockGetExpoPushToken = jest.fn(() => Promise.resolve({ data: 'test-token-123' }));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: mockGetPermissions,
  requestPermissionsAsync: mockRequestPermissions,
  getExpoPushTokenAsync: mockGetExpoPushToken,
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Native modules
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })), // Return subscription object
  },
  Linking: {
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    openURL: jest.fn(() => Promise.resolve()),
    openSettings: jest.fn(() => Promise.resolve()),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('PermissionHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushToken.mockResolvedValue({ data: 'test-token-123' });
    mockAsyncStorage.getItem.mockResolvedValue(null);
  });

  afterEach(() => {
    PermissionHandler.stopPermissionMonitoring();
  });

  describe('permission requests', () => {
    it('should request permissions successfully', async () => {
      const result = await PermissionHandler.requestPermissions();
      expect(result).toBe(true);
    });

    it('should check permissions successfully', async () => {
      const result = await PermissionHandler.checkPermissions();
      expect(result).toBe(true);
    });

    it('should handle permission denial gracefully', async () => {
      mockGetPermissions.mockResolvedValueOnce({ status: 'denied' });

      const result = await PermissionHandler.checkPermissions();
      expect(result).toBe(false);
    });

    it('should avoid repeated permission requests after max denials', async () => {
      // Mock state with max denials reached
      const deniedState = {
        granted: false,
        lastChecked: Date.now(),
        tokenRegistered: false,
        denialCount: 3,
        lastDenialTime: Date.now() - 1000, // 1 second ago
        fallbackMode: true
      };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(deniedState));
      mockRequestPermissions.mockResolvedValueOnce({ status: 'denied' });

      const result = await PermissionHandler.requestPermissions();
      expect(result).toBe(false);
      expect(mockRequestPermissions).not.toHaveBeenCalled();
    });

    it('should enable fallback mode after max denials', async () => {
      mockGetPermissions.mockResolvedValue({ status: 'denied' });
      mockRequestPermissions.mockResolvedValue({ status: 'denied' });
      
      // Mock initial state with 2 denials
      const initialState = {
        granted: false,
        lastChecked: Date.now(),
        tokenRegistered: false,
        denialCount: 2,
        fallbackMode: false
      };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(initialState));

      const result = await PermissionHandler.requestPermissions();
      expect(result).toBe(false);
      
      // Check that fallback mode was enabled
      const isFallbackEnabled = await PermissionHandler.isFallbackModeEnabled();
      expect(isFallbackEnabled).toBe(true);
    });
  });

  describe('device token registration', () => {
    it('should register device token successfully', async () => {
      const token = await PermissionHandler.registerDeviceToken('test-project-id');
      expect(token).toBe('test-token-123');
    });

    it('should handle token registration failure', async () => {
      mockGetExpoPushToken.mockRejectedValueOnce(new Error('Token registration failed'));

      const token = await PermissionHandler.registerDeviceToken('test-project-id');
      expect(token).toBeNull();
    });

    it('should validate and refresh token successfully', async () => {
      const result = await PermissionHandler.validateAndRefreshToken('test-project-id');
      expect(result.isValid).toBe(true);
      expect(result.token).toBe('test-token-123');
    });

    it('should return invalid result when permissions not granted', async () => {
      mockGetPermissions.mockResolvedValue({ status: 'denied' });
      
      const result = await PermissionHandler.validateAndRefreshToken('test-project-id');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Permissions not granted');
    });

    it('should refresh token when validation is needed', async () => {
      // Mock old state that needs validation
      const oldState = {
        granted: true,
        lastChecked: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        tokenRegistered: true,
        denialCount: 0,
        fallbackMode: false
      };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(oldState));
      mockAsyncStorage.getItem.mockResolvedValueOnce('old-token');

      const result = await PermissionHandler.validateAndRefreshToken('test-project-id');
      expect(result.isValid).toBe(true);
      expect(result.needsRefresh).toBe(true);
      expect(result.token).toBe('test-token-123');
    });
  });

  describe('permission state management', () => {
    it('should get permission state with defaults', async () => {
      const state = await PermissionHandler.getPermissionState();
      expect(state).toHaveProperty('granted');
      expect(state).toHaveProperty('lastChecked');
      expect(state).toHaveProperty('tokenRegistered');
      expect(state).toHaveProperty('denialCount');
      expect(state).toHaveProperty('fallbackMode');
    });

    it('should handle permission changes with runtime detection', async () => {
      // Mock initial granted state
      const grantedState = {
        granted: true,
        lastChecked: Date.now(),
        tokenRegistered: true,
        denialCount: 0,
        fallbackMode: false
      };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(grantedState));
      
      // Mock permission revocation
      mockGetPermissions.mockResolvedValueOnce({ status: 'denied' });

      await PermissionHandler.handlePermissionChange();
      
      // Should have cleared token data and enabled fallback
      expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should get stored device token', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('stored-token');
      const token = await PermissionHandler.getStoredDeviceToken();
      expect(token).toBe('stored-token');
    });

    it('should clear stored data', async () => {
      await PermissionHandler.clearStoredData();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });

  describe('fallback functionality', () => {
    it('should provide comprehensive fallback guidance', async () => {
      const guidance = await PermissionHandler.getFallbackGuidance();
      expect(guidance).toHaveProperty('title');
      expect(guidance).toHaveProperty('message');
      expect(guidance).toHaveProperty('actions');
      expect(guidance).toHaveProperty('capabilities');
      expect(guidance).toHaveProperty('canRetry');
      expect(Array.isArray(guidance.actions)).toBe(true);
      expect(guidance.actions.every(action => 
        action.hasOwnProperty('enabled')
      )).toBe(true);
    });

    it('should get fallback capabilities', async () => {
      const capabilities = await PermissionHandler.getFallbackCapabilities();
      expect(capabilities).toHaveProperty('canShowInAppNotifications');
      expect(capabilities).toHaveProperty('canUseLocalStorage');
      expect(capabilities).toHaveProperty('canScheduleLocalNotifications');
      expect(capabilities).toHaveProperty('canAccessSettings');
    });

    it('should enable and check fallback mode', async () => {
      await PermissionHandler.enableFallbackMode();
      const isEnabled = await PermissionHandler.isFallbackModeEnabled();
      expect(isEnabled).toBe(true);
    });

    it('should open notification settings', async () => {
      const result = await PermissionHandler.openNotificationSettings();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('permission monitoring', () => {
    it('should start and stop permission monitoring', () => {
      PermissionHandler.startPermissionMonitoring();
      expect(AppState.addEventListener).toHaveBeenCalled();
      
      PermissionHandler.stopPermissionMonitoring();
      // Should not throw
    });

    it('should add and remove permission change listeners', () => {
      const listener = jest.fn();
      const removeListener = PermissionHandler.addPermissionChangeListener(listener);
      
      expect(typeof removeListener).toBe('function');
      removeListener();
      // Should not throw
    });
  });
});