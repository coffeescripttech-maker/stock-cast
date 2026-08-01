/**
 * AudioAlertService Unit Tests
 * 
 * Tests specific functionality and edge cases for the audio alert system
 */

import { AudioAlertService } from '../AudioAlertService';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertSeverity } from '../../../types/notification';

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    getAudioModeAsync: jest.fn().mockResolvedValue({
      playsInSilentModeIOS: false,
      allowsRecordingIOS: false,
    }),
    Sound: {
      createAsync: jest.fn(),
    },
    INTERRUPTION_MODE_IOS_DO_NOT_MIX: 'DO_NOT_MIX',
    INTERRUPTION_MODE_ANDROID_DO_NOT_MIX: 'DO_NOT_MIX',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('AudioAlertService', () => {
  let audioService: AudioAlertService;
  let mockSound: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage to return null by default
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    // Create mock sound object
    mockSound = {
      replayAsync: jest.fn().mockResolvedValue(undefined),
      stopAsync: jest.fn().mockResolvedValue(undefined),
      unloadAsync: jest.fn().mockResolvedValue(undefined),
      getStatusAsync: jest.fn().mockResolvedValue({
        isLoaded: true,
        isPlaying: false,
      }),
    };

    // Mock Audio.Sound.createAsync to return our mock sound
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
    });

    audioService = new AudioAlertService();
  });

  describe('preloadSounds', () => {
    it('should preload all severity level sounds', async () => {
      await audioService.preloadSounds();

      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });

      expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(4);
      expect(audioService.isSoundLoaded('critical')).toBe(true);
      expect(audioService.isSoundLoaded('high')).toBe(true);
      expect(audioService.isSoundLoaded('medium')).toBe(true);
      expect(audioService.isSoundLoaded('low')).toBe(true);
    });

    it('should handle individual sound loading failures gracefully', async () => {
      (Audio.Sound.createAsync as jest.Mock)
        .mockResolvedValueOnce({ sound: mockSound })
        .mockRejectedValueOnce(new Error('Failed to load'))
        .mockResolvedValueOnce({ sound: mockSound })
        .mockResolvedValueOnce({ sound: mockSound });

      await audioService.preloadSounds();

      expect(audioService.isSoundLoaded('critical')).toBe(true);
      expect(audioService.isSoundLoaded('high')).toBe(false);
      expect(audioService.isSoundLoaded('medium')).toBe(true);
      expect(audioService.isSoundLoaded('low')).toBe(true);
    });

    it('should throw error if audio system initialization fails', async () => {
      (Audio.setAudioModeAsync as jest.Mock).mockRejectedValue(new Error('Audio init failed'));

      await expect(audioService.preloadSounds()).rejects.toThrow('Audio system initialization failed');
    });
  });

  describe('playAlert', () => {
    beforeEach(async () => {
      await audioService.preloadSounds();
    });

    it('should play sound for critical severity', async () => {
      await audioService.playAlert('critical');

      expect(mockSound.replayAsync).toHaveBeenCalled();
    });

    it('should play sound for high severity', async () => {
      await audioService.playAlert('high');

      expect(mockSound.replayAsync).toHaveBeenCalled();
    });

    it('should play sound for medium severity', async () => {
      await audioService.playAlert('medium');

      expect(mockSound.replayAsync).toHaveBeenCalled();
    });

    it('should play sound for low severity', async () => {
      await audioService.playAlert('low');

      expect(mockSound.replayAsync).toHaveBeenCalled();
    });

    it('should not play sound when disabled', async () => {
      audioService.setEnabled(false);
      await audioService.playAlert('critical');

      expect(mockSound.replayAsync).not.toHaveBeenCalled();
    });

    it('should stop currently playing sounds before playing new one', async () => {
      mockSound.getStatusAsync.mockResolvedValue({
        isLoaded: true,
        isPlaying: true,
      });

      await audioService.playAlert('critical');

      expect(mockSound.stopAsync).toHaveBeenCalled();
      expect(mockSound.replayAsync).toHaveBeenCalled();
    });

    it('should handle missing sound gracefully', async () => {
      // Create service without preloading
      const newService = new AudioAlertService();
      
      await expect(newService.playAlert('critical')).resolves.not.toThrow();
    });

    it('should handle playback errors gracefully', async () => {
      mockSound.replayAsync.mockRejectedValue(new Error('Playback failed'));

      await expect(audioService.playAlert('critical')).resolves.not.toThrow();
    });

    it('should initialize sounds if not already initialized', async () => {
      const newService = new AudioAlertService();
      
      await newService.playAlert('critical');

      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });
  });

  describe('setEnabled/isEnabled', () => {
    it('should enable and disable sound alerts', () => {
      expect(audioService.isEnabled()).toBe(true);

      audioService.setEnabled(false);
      expect(audioService.isEnabled()).toBe(false);

      audioService.setEnabled(true);
      expect(audioService.isEnabled()).toBe(true);
    });

    it('should save preference to AsyncStorage', () => {
      audioService.setEnabled(false);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'notification_sound_enabled',
        JSON.stringify(false)
      );
    });
  });

  describe('getSoundPath', () => {
    it('should return sound paths for each severity', () => {
      // Since we're using identity-obj-proxy, the paths will be objects
      expect(typeof audioService.getSoundPath('critical')).toBe('object');
      expect(typeof audioService.getSoundPath('high')).toBe('object');
      expect(typeof audioService.getSoundPath('medium')).toBe('object');
      expect(typeof audioService.getSoundPath('low')).toBe('object');
    });
  });

  describe('getAudioStatus', () => {
    beforeEach(async () => {
      await audioService.preloadSounds();
    });

    it('should return comprehensive audio status', async () => {
      const status = await audioService.getAudioStatus();

      expect(status).toEqual({
        isInitialized: true,
        isEnabled: true,
        loadedSounds: ['critical', 'high', 'medium', 'low'],
        audioMode: {
          playsInSilentModeIOS: false,
          allowsRecordingIOS: false,
        },
      });
    });

    it('should handle audio mode errors gracefully', async () => {
      (Audio.getAudioModeAsync as jest.Mock).mockRejectedValue(new Error('Audio mode error'));

      const status = await audioService.getAudioStatus();

      expect(status.audioMode).toBeNull();
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await audioService.preloadSounds();
    });

    it('should stop and unload all sounds', async () => {
      await audioService.cleanup();

      expect(mockSound.stopAsync).toHaveBeenCalled();
      expect(mockSound.unloadAsync).toHaveBeenCalled();
    });

    it('should reset initialization state', async () => {
      await audioService.cleanup();

      const status = await audioService.getAudioStatus();
      expect(status.isInitialized).toBe(false);
      expect(status.loadedSounds).toEqual([]);
    });

    it('should handle cleanup errors gracefully', async () => {
      mockSound.unloadAsync.mockRejectedValue(new Error('Cleanup failed'));

      await expect(audioService.cleanup()).resolves.not.toThrow();
    });
  });

  describe('preference persistence', () => {
    it('should load saved preference on initialization', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(false));

      const newService = new AudioAlertService();
      
      // Wait for async constructor to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(newService.isEnabled()).toBe(false);
    });

    it('should default to enabled if no saved preference', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const newService = new AudioAlertService();
      
      // Wait for async constructor to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(newService.isEnabled()).toBe(true);
    });

    it('should handle storage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const newService = new AudioAlertService();
      
      // Wait for async constructor to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(newService.isEnabled()).toBe(true);
    });
  });
});