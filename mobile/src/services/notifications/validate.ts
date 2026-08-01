/**
 * Validation script for notification infrastructure
 * Checks if all notification components are properly set up
 */

import { NotificationManager } from './NotificationManager';
import { PermissionHandler } from './PermissionHandler';
import { NotificationInitializer } from './NotificationInitializer';
import { 
  NotificationData, 
  NotificationSettings, 
  SOUND_CONFIG, 
  HAPTIC_PATTERNS,
  ANDROID_CHANNELS 
} from './index';

/**
 * Validate notification infrastructure setup
 */
export function validateNotificationInfrastructure(): {
  success: boolean;
  errors: string[];
  components: string[];
} {
  const errors: string[] = [];
  const components: string[] = [];

  try {
    // Check if NotificationManager can be instantiated
    const manager = new NotificationManager();
    components.push('NotificationManager');

    // Check if PermissionHandler has required methods
    if (typeof PermissionHandler.requestPermissions === 'function') {
      components.push('PermissionHandler.requestPermissions');
    } else {
      errors.push('PermissionHandler.requestPermissions is not a function');
    }

    if (typeof PermissionHandler.registerDeviceToken === 'function') {
      components.push('PermissionHandler.registerDeviceToken');
    } else {
      errors.push('PermissionHandler.registerDeviceToken is not a function');
    }

    // Check if NotificationInitializer has required methods
    if (typeof NotificationInitializer.initialize === 'function') {
      components.push('NotificationInitializer.initialize');
    } else {
      errors.push('NotificationInitializer.initialize is not a function');
    }

    // Check if types are properly defined
    const testNotification: NotificationData = {
      id: 'test-1',
      type: 'alert',
      severity: 'high',
      title: 'Test',
      body: 'Test notification',
      timestamp: Date.now()
    };
    components.push('NotificationData type');

    const testSettings: NotificationSettings = {
      soundEnabled: true,
      vibrationEnabled: true,
      lastUpdated: Date.now()
    };
    components.push('NotificationSettings type');

    // Check if configuration objects exist
    if (SOUND_CONFIG && typeof SOUND_CONFIG === 'object') {
      components.push('SOUND_CONFIG');
    } else {
      errors.push('SOUND_CONFIG is not properly defined');
    }

    if (HAPTIC_PATTERNS && typeof HAPTIC_PATTERNS === 'object') {
      components.push('HAPTIC_PATTERNS');
    } else {
      errors.push('HAPTIC_PATTERNS is not properly defined');
    }

    if (ANDROID_CHANNELS && typeof ANDROID_CHANNELS === 'object') {
      components.push('ANDROID_CHANNELS');
    } else {
      errors.push('ANDROID_CHANNELS is not properly defined');
    }

    return {
      success: errors.length === 0,
      errors,
      components
    };

  } catch (error) {
    errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      errors,
      components
    };
  }
}

/**
 * Print validation results
 */
export function printValidationResults(): void {
  const results = validateNotificationInfrastructure();
  
  console.log('=== Notification Infrastructure Validation ===');
  console.log(`Status: ${results.success ? 'SUCCESS' : 'FAILED'}`);
  
  if (results.components.length > 0) {
    console.log('\n✅ Successfully validated components:');
    results.components.forEach(component => {
      console.log(`  - ${component}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Validation errors:');
    results.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  }
  
  console.log('\n=== End Validation ===');
}

// Run validation if this file is executed directly
if (require.main === module) {
  printValidationResults();
}