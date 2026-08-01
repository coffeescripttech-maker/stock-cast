// SMS Service - Send SMS with silent capability on Android

import * as SMS from 'expo-sms';
import { Platform } from 'react-native';

// Import silent SMS module (Android only)
let SilentSMS: any = null;
try {
  SilentSMS = require('../../modules/silent-sms').default;
} catch (error) {
  console.log('Silent SMS module not available (expected on iOS/web)');
}

export interface SOSData {
  latitude?: number;
  longitude?: number;
  targetAgency: string;
  userInfo: {
    userId: number;
    name: string;
    phone: string;
  };
  incidentTypeId?: number;
  incidentTypeName?: string;
}

/**
 * Send SOS via SMS - tries silent send on Android, falls back to user confirmation
 * 
 * Flow:
 * 1. Android: Try silent SMS (no user interaction) if permission granted
 * 2. Fallback: Open SMS app with pre-filled message (user must press SEND)
 * 
 * @param sosData - SOS alert data
 * @param gatewayNumber - SMS gateway number (default: 09923150633)
 * @returns Promise<boolean> - true if SMS sent or app opened successfully
 * @throws Error with specific message if SMS fails
 */
export async function sendSOSviaSMS(
  sosData: SOSData,
  gatewayNumber: string = '09923150633'
): Promise<boolean> {
  try {
    // Format SMS message: "SOS|AGENCY|LAT,LNG|USERID|NAME|PHONE|INCIDENT_TYPE_ID|INCIDENT_TYPE_NAME"
    const lat = sosData.latitude?.toFixed(6) || '0';
    const lng = sosData.longitude?.toFixed(6) || '0';
    const agency = sosData.targetAgency.toUpperCase();
    const userId = sosData.userInfo.userId;
    const name = sosData.userInfo.name;
    const phone = sosData.userInfo.phone;
    
    // Build message with optional incident type
    let smsMessage = `SOS|${agency}|${lat},${lng}|${userId}|${name}|${phone}`;
    
    // Add incident type if provided
    if (sosData.incidentTypeId && sosData.incidentTypeName) {
      smsMessage += `|${sosData.incidentTypeId}|${sosData.incidentTypeName}`;
    }
    
    console.log('📱 Preparing SMS to gateway:', gatewayNumber);
    console.log('📱 Message:', smsMessage);
    console.log('📱 Has incident type:', !!(sosData.incidentTypeId && sosData.incidentTypeName));
    console.log('📱 Message length:', smsMessage.length, 'characters');

    // TRY SILENT SMS FIRST (Android only)
    if (Platform.OS === 'android' && SilentSMS) {
      try {
        const isSilentAvailable = await SilentSMS.isAvailable();
        
        if (isSilentAvailable) {
          console.log('🚀 Attempting silent SMS send (no user interaction)...');
          
          const result = await SilentSMS.sendSMS(gatewayNumber, smsMessage);
          
          if (result.success) {
            console.log('✅ Silent SMS sent successfully!', result);
            return true;
          }
        } else {
          console.log('⚠️ Silent SMS not available (permission not granted)');
        }
      } catch (silentError: any) {
        console.warn('⚠️ Silent SMS failed, falling back to user confirmation:', silentError.message);
        // Continue to fallback
      }
    }

    // FALLBACK: Open SMS app with pre-filled message
    console.log('📱 Opening SMS app with pre-filled message (user must press SEND)...');
    
    const isAvailable = await SMS.isAvailableAsync();
    
    if (!isAvailable) {
      console.error('❌ SMS not available on this device');
      throw new Error('SMS not available on this device');
    }

    // Open SMS app with pre-filled message
    const { result } = await SMS.sendSMSAsync(
      [gatewayNumber],
      smsMessage
    );

    console.log('📱 SMS app result:', result);

    if (result === 'sent') {
      console.log('✅ User sent SMS from SMS app');
      return true;
    } else if (result === 'cancelled') {
      console.log('⚠️ User cancelled SMS send');
      throw new Error('SMS send cancelled by user');
    } else if (result === 'unknown') {
      console.log('⚠️ SMS app opened, result unknown');
      return true;
    } else {
      console.error('❌ SMS failed:', result);
      throw new Error(`SMS failed: ${result}`);
    }

  } catch (error: any) {
    console.error('❌ Error with SMS:', error);
    
    if (error.message?.includes('not available')) {
      throw error;
    } else if (error.message?.includes('cancelled')) {
      throw error;
    } else {
      throw new Error('SMS failed - device may not support SMS or user has no cellular load');
    }
  }
}

/**
 * Check if device can send SMS (either silent or with user confirmation)
 */
export async function canSendSMS(): Promise<boolean> {
  try {
    // Check silent SMS first (Android)
    if (Platform.OS === 'android' && SilentSMS) {
      const isSilentAvailable = await SilentSMS.isAvailable();
      if (isSilentAvailable) {
        return true;
      }
    }
    
    // Check regular SMS
    return await SMS.isAvailableAsync();
  } catch (error) {
    console.error('Error checking SMS availability:', error);
    return false;
  }
}

/**
 * Check if silent SMS is available (Android only, requires SEND_SMS permission)
 */
export async function canSendSilentSMS(): Promise<boolean> {
  if (Platform.OS !== 'android' || !SilentSMS) {
    return false;
  }
  
  try {
    return await SilentSMS.isAvailable();
  } catch (error) {
    return false;
  }
}
