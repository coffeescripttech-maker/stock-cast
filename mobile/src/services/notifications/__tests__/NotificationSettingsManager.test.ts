/**
 * NotificationSettingsManager Tests
 * 
 * Tests for the notification settings management functionality including
 * settings persistence, service integration, and preview functionality.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationSettingsManager } from '../NotificationSettingsManager';
import { audioAlertService } from '../AudioAlertService';
import { hapticFeedbackService } from '../HapticFeedbackService';
import { AlertSeverity, NotificationSettings } from '../../../types/notification';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock audio and haptic services
jest.mock('../AudioAlertService', () => ({
  audioAlertService: {
    setEnabled: jest.fn(),
    isEnabled: jest.fn(() => true),
    playAlert: jest.fn(),
  },
}));

jest.mock('../HapticFeedbackService', () => ({
  hapticFeedbackService: {
    setEnabled: jest.fn(),
    isEnabled: jest.fn(() => true),
    isSupported: jest.fn(() => true),
    testFeedback: jest.fn(),
  },
}));

describe('NotificationSettingsManager', () => {
  let settingsManager: NotificationSettingsManager;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockAudioService = audioAlertService as jest.Mocked<typeof audioAlertService>;
  const mockHapticService = hapticFeedbackService as jest.Mocked<typeof hapticFeedbackService>;

  beforeEach(() => {
    jest.clearAllMocks();
    settingsManager = new NotificationSettingsManager();
  });

  describe('Initialization', () => {
    it('should initialize with default settings when no stored settings exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const settings = await settingsManager.getSettings();

      expect(settings.soundEnabled).toBe(true);
      expect(settings.vibrationEnabled).toBe(true);
      expect(settings.lastUpdated).toBeGreaterThan(0);
    });

    it('should load stored settings on initialization', async () => {
      const storedSettings: NotificationSettings = {
        soundEnabled: false,
        vibrationEnabled: true,
        lastUpdated: 1234567890,
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedSettings));

      const newManager = new NotificationSettingsManager();
      const settings = await newManager.getSettings();

      expect(settings.soundEnabled).toBe(false);
      expect(settings.vibrationEnabled).toBe(true);
    });

    it('should use defaults when stored settings are invalid', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      const newManager = new NotificationSettingsManager();
      const settings = await newManager.getSettings();

      expect(settings.soundEnabled).toBe(true);
      expect(settings.vibrationEnabled).toBe(true);
    });

    it('should apply loaded settings to services on initialization', async () => {
      const storedSettings: NotificationSettings = {
        soundEnabled: false,
        vibrationEnabled: false,
        lastUpdated: Date.now(),
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedSettings));

      new NotificationSettingsManager();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockAudioService.setEnabled).toHaveBeenCalledWith(false);
      expect(mockHapticService.setEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('Sound Settings', () => {
    it('should get current sound enabled state', async () => {
      const enabled = await settingsManager.getSoundEnabled();
      expect(typeof enabled).toBe('boolean');
    });

    it('should set sound enabled state and apply to audio service', async () => {
      await settingsManager.setSoundEnabled(false);

      const enabled = await settingsManager.getSoundEnabled();
      expect(enabled).toBe(false);
      expect(mockAudioService.setEnabled).toHaveBeenCalledWith(false);
    });

    it('should persist sound setting changes', async () => {
      await settingsManager.setSoundEnabled(false);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'notification_settings',
        expect.stringContaining('"soundEnabled":false')
      );
    });

    it('should update lastUpdated timestamp when changing sound setting', async () => {
      const beforeTime = Date.now();
      await settingsManager.setSoundEnabled(false);
      const settings = await settingsManager.getSettings();

      expect(settings.lastUpdated).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('Vibration Settings', () => {
    it('should get current vibration enabled state', async () => {
      const enabled = await settingsManager.getVibrationEnabled();
      expect(typeof enabled).toBe('boolean');
    });

    it('should set vibration enabled state and apply to haptic service', async () => {
      await settingsManager.setVibrationEnabled(false);

      const enabled = await settingsManager.getVibrationEnabled();
      expect(enabled).toBe(false);
      expect(mockHapticService.setEnabled).toHaveBeenCalledWith(false);
    });

    it('should persist vibration setting changes', async () => {
      await settingsManager.setVibrationEnabled(false);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'notification_settings',
        expect.stringContaining('"vibrationEnabled":false')
      );
    });
  });

  describe('Preview Functionality', () => {
    it('should preview sound for different severity levels', async () => {
      const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];

      for (const severity of severities) {
        await settingsManager.previewSound(severity);
        expect(mockAudioService.playAlert).toHaveBeenCalledWith(severity);
      }
    });

    it('should temporarily enable sound for preview when disabled', async () => {
      mockAudioService.isEnabled.mockReturnValue(false);
      
      await settingsManager.previewSound('critical');

      expect(mockAudioService.setEnabled).toHaveBeenCalledWith(true);
      expect(mockAudioService.playAlert).toHaveBeenCalledWith('critical');
      expect(mockAudioService.setEnabled).toHaveBeenCalledWith(false);
    });

    it('should preview vibration for different severity levels', async () => {
      const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];

      for (const severity of severities) {
        await settingsManager.previewVibration(severity);
        expect(mockHapticService.testFeedback).toHaveBeenCalledWith(severity);
      }
    });

    it('should throw error when previewing vibration on unsupported device', async () => {
      mockHapticService.isSupported.mockReturnValue(false);

      await expect(settingsManager.previewVibration('critical'))
        .rejects.toThrow('Device does not support haptic feedback');
    });

    it('should handle preview errors gracefully', async () => {
      mockAudioService.playAlert.mockRejectedValue(new Error('Audio error'));

      await expect(settingsManager.previewSound('critical'))
        .rejects.toThrow('Sound preview failed');
    });
  });

  describe('Settings Management', () => {
    it('should get complete settings object', async () => {
      const settings = await settingsManager.getSettings();

      expect(settings).toHaveProperty('soundEnabled');
      expect(settings).toHaveProperty('vibrationEnabled');
      expect(settings).toHaveProperty('lastUpdated');
    });

    it('should update settings with partial changes', async () => {
      const partialUpdate = { soundEnabled: false };
      
      await settingsManager.updateSettings(partialUpdate);
      const settings = await settingsManager.getSettings();

      expect(settings.soundEnabled).toBe(false);
      expect(mockAudioService.setEnabled).toHaveBeenCalledWith(false);
    });

    it('should apply multiple setting changes at once', async () => {
      const updates = {
        soundEnabled: false,
        vibrationEnabled: false,
      };

      await settingsManager.updateSettings(updates);

      expect(mockAudioService.setEnabled).toHaveBeenCalledWith(false);
      expect(mockHapticService.setEnabled).toHaveBeenCalledWith(false);
    });

    it('should reset to default settings', async () => {
      // First change settings
      await settingsManager.setSoundEnabled(false);
      await settingsManager.setVibrationEnabled(false);

      // Then reset
      await settingsManager.resetToDefaults();
      const settings = await settingsManager.getSettings();

      expect(settings.soundEnabled).toBe(true);
      expect(settings.vibrationEnabled).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should save settings to AsyncStorage', async () => {
      await settingsManager.setSoundEnabled(false);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'notification_settings',
        expect.any(String)
      );
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(settingsManager.setSoundEnabled(false))
        .rejects.toThrow('Settings persistence failed');
    });

    it('should test persistence capability', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue('{"test":true,"timestamp":123}');
      mockAsyncStorage.removeItem.mockResolvedValue();

      const canPersist = await settingsManager.testPersistence();
      expect(canPersist).toBe(true);
    });

    it('should return false for persistence test on storage error', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      const canPersist = await settingsManager.testPersistence();
      expect(canPersist).toBe(false);
    });
  });

  describe('Import/Export', () => {
    it('should export current settings', async () => {
      // Reset mock to allow successful operations
      mockAsyncStorage.setItem.mockResolvedValue();
      
      await settingsManager.setSoundEnabled(false);
      
      const exported = await settingsManager.exportSettings();
      
      expect(exported.soundEnabled).toBe(false);
      expect(exported).toHaveProperty('vibrationEnabled');
      expect(exported).toHaveProperty('lastUpdated');
    });

    it('should import valid settings', async () => {
      // Reset mock to allow successful operations
      mockAsyncStorage.setItem.mockResolvedValue();
      
      const importSettings: NotificationSettings = {
        soundEnabled: false,
        vibrationEnabled: false,
        lastUpdated: Date.now(),
      };

      await settingsManager.importSettings(importSettings);
      const current = await settingsManager.getSettings();

      expect(current.soundEnabled).toBe(false);
      expect(current.vibrationEnabled).toBe(false);
    });

    it('should reject invalid settings for import', async () => {
      const invalidSettings = {
        soundEnabled: 'invalid',
        vibrationEnabled: true,
      } as any;

      await expect(settingsManager.importSettings(invalidSettings))
        .rejects.toThrow('Invalid settings format for import');
    });
  });

  describe('Status and Diagnostics', () => {
    it('should provide settings status for debugging', async () => {
      const status = await settingsManager.getSettingsStatus();

      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('settings');
      expect(status).toHaveProperty('audioServiceEnabled');
      expect(status).toHaveProperty('hapticServiceEnabled');
      expect(status).toHaveProperty('hapticSupported');
    });

    it('should provide available severity levels', () => {
      const levels = settingsManager.getAvailableSeverityLevels();
      
      expect(levels).toEqual(['critical', 'high', 'medium', 'low']);
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage initialization errors', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const newManager = new NotificationSettingsManager();
      const settings = await newManager.getSettings();

      // Should fall back to defaults
      expect(settings.soundEnabled).toBe(true);
      expect(settings.vibrationEnabled).toBe(true);
    });

    it('should handle service application errors gracefully', async () => {
      // Reset AsyncStorage mock to allow successful operations
      mockAsyncStorage.setItem.mockResolvedValue();
      
      mockAudioService.setEnabled.mockImplementation(() => {
        throw new Error('Service error');
      });

      // Should not throw error, just log warning
      await expect(settingsManager.setSoundEnabled(false)).resolves.not.toThrow();
      
      // Settings should still be updated despite service error
      const settings = await settingsManager.getSettings();
      expect(settings.soundEnabled).toBe(false);
    });
  });
});