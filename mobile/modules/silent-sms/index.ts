// Silent SMS Module - Native module for sending SMS without user interaction (Android only)
import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';
import { Platform } from 'react-native';

// Import the native module. On web, it will be resolved to SilentSMS.web.ts
// and on native platforms to SilentSMS.ts
const SilentSMSModule = NativeModulesProxy.SilentSMS;

export interface SendSMSResult {
  success: boolean;
  phoneNumber: string;
  parts: number;
}

/**
 * Check if silent SMS sending is available on this device
 * Returns true only on Android with SEND_SMS permission granted
 */
export async function isAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    return await SilentSMSModule.isAvailable();
  } catch (error) {
    console.warn('Silent SMS not available:', error);
    return false;
  }
}

/**
 * Send SMS silently without user interaction (Android only)
 * @param phoneNumber - Phone number to send SMS to
 * @param message - Message content
 * @returns Promise with send result
 * @throws Error if permission denied or send fails
 */
export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<SendSMSResult> {
  if (Platform.OS !== 'android') {
    throw new Error('Silent SMS is only available on Android');
  }

  if (!phoneNumber || !message) {
    throw new Error('Phone number and message are required');
  }

  try {
    return await SilentSMSModule.sendSMS(phoneNumber, message);
  } catch (error: any) {
    console.error('Failed to send silent SMS:', error);
    throw error;
  }
}

export default {
  isAvailable,
  sendSMS,
};
