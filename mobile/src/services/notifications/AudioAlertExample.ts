/**
 * AudioAlertService Usage Example
 * 
 * This file demonstrates how to use the AudioAlertService
 * in a React Native application.
 */

import { audioAlertService } from './AudioAlertService';
import { AlertSeverity } from '../../types/notification';

/**
 * Example usage of AudioAlertService
 */
export class AudioAlertExample {
  
  /**
   * Initialize the audio system
   */
  static async initialize(): Promise<void> {
    try {
      await audioAlertService.preloadSounds();
      console.log('Audio alert system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio alerts:', error);
    }
  }

  /**
   * Play alert for different severity levels
   */
  static async playAlertBySeverity(severity: AlertSeverity): Promise<void> {
    try {
      await audioAlertService.playAlert(severity);
      console.log(`Played ${severity} alert sound`);
    } catch (error) {
      console.error(`Failed to play ${severity} alert:`, error);
    }
  }

  /**
   * Toggle sound alerts on/off
   */
  static toggleSoundAlerts(): void {
    const currentState = audioAlertService.isEnabled();
    audioAlertService.setEnabled(!currentState);
    console.log(`Sound alerts ${!currentState ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get comprehensive status of audio system
   */
  static async getSystemStatus(): Promise<void> {
    try {
      const status = await audioAlertService.getAudioStatus();
      console.log('Audio System Status:', {
        initialized: status.isInitialized,
        enabled: status.isEnabled,
        loadedSounds: status.loadedSounds,
        audioMode: status.audioMode
      });
    } catch (error) {
      console.error('Failed to get audio status:', error);
    }
  }

  /**
   * Example notification handler that plays appropriate sound
   */
  static async handleNotification(notificationData: {
    severity: AlertSeverity;
    title: string;
    body: string;
  }): Promise<void> {
    console.log(`Received notification: ${notificationData.title}`);
    
    // Play sound based on severity
    await this.playAlertBySeverity(notificationData.severity);
  }

  /**
   * Cleanup when app is closing
   */
  static async cleanup(): Promise<void> {
    try {
      await audioAlertService.cleanup();
      console.log('Audio alert system cleaned up');
    } catch (error) {
      console.error('Failed to cleanup audio system:', error);
    }
  }
}

/**
 * Example integration with React Native component
 */
export const useAudioAlerts = () => {
  const playAlert = async (severity: AlertSeverity) => {
    await AudioAlertExample.playAlertBySeverity(severity);
  };

  const toggleSounds = () => {
    AudioAlertExample.toggleSoundAlerts();
  };

  const isEnabled = () => {
    return audioAlertService.isEnabled();
  };

  return {
    playAlert,
    toggleSounds,
    isEnabled,
  };
};

// Example usage in app initialization
export const initializeAudioSystem = async () => {
  await AudioAlertExample.initialize();
  
  // Example: Play different severity alerts
  setTimeout(() => AudioAlertExample.playAlertBySeverity('low'), 1000);
  setTimeout(() => AudioAlertExample.playAlertBySeverity('medium'), 2000);
  setTimeout(() => AudioAlertExample.playAlertBySeverity('high'), 3000);
  setTimeout(() => AudioAlertExample.playAlertBySeverity('critical'), 4000);
};