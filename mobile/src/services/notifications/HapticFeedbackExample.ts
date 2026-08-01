/**
 * HapticFeedbackService Usage Examples
 * 
 * This file demonstrates how to use the HapticFeedbackService
 * for different notification scenarios and user interactions.
 */

import { hapticFeedbackService } from './HapticFeedbackService';
import { AlertSeverity } from '../../types/notification';

/**
 * Example: Basic haptic feedback for different alert severities
 */
export async function demonstrateBasicHapticFeedback() {
  console.log('=== Basic Haptic Feedback Examples ===');
  
  // Critical alert - strong haptic feedback
  console.log('Triggering critical alert haptic...');
  await hapticFeedbackService.triggerFeedback('critical');
  
  // Wait between haptics for better demonstration
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // High alert - medium haptic feedback
  console.log('Triggering high alert haptic...');
  await hapticFeedbackService.triggerFeedback('high');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Medium alert - light haptic feedback
  console.log('Triggering medium alert haptic...');
  await hapticFeedbackService.triggerFeedback('medium');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Low alert - light haptic feedback
  console.log('Triggering low alert haptic...');
  await hapticFeedbackService.triggerFeedback('low');
}

/**
 * Example: User settings management
 */
export async function demonstrateSettingsManagement() {
  console.log('=== Haptic Settings Management ===');
  
  // Check current status
  const status = await hapticFeedbackService.getServiceStatus();
  console.log('Current haptic status:', status);
  
  // Check if haptic is enabled
  console.log('Haptic enabled:', hapticFeedbackService.isEnabled());
  
  // Check device support
  console.log('Device supported:', hapticFeedbackService.isSupported());
  
  // Disable haptic feedback
  console.log('Disabling haptic feedback...');
  hapticFeedbackService.setEnabled(false);
  
  // Try to trigger haptic (should not work)
  console.log('Attempting haptic while disabled...');
  await hapticFeedbackService.triggerFeedback('critical');
  console.log('No haptic should have occurred');
  
  // Re-enable haptic feedback
  console.log('Re-enabling haptic feedback...');
  hapticFeedbackService.setEnabled(true);
  
  // Test haptic (should work)
  console.log('Testing haptic after re-enabling...');
  await hapticFeedbackService.triggerFeedback('high');
}

/**
 * Example: Settings preview functionality
 */
export async function demonstrateSettingsPreview() {
  console.log('=== Haptic Settings Preview ===');
  
  const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
  
  for (const severity of severities) {
    console.log(`Testing ${severity} haptic pattern...`);
    
    try {
      // Use testFeedback for settings preview (ignores enabled state)
      await hapticFeedbackService.testFeedback(severity);
      console.log(`✓ ${severity} haptic pattern works`);
    } catch (error) {
      console.log(`✗ ${severity} haptic pattern failed:`, error.message);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

/**
 * Example: Integration with notification handling
 */
export async function demonstrateNotificationIntegration() {
  console.log('=== Notification Integration Example ===');
  
  // Simulate receiving different types of notifications
  const notifications = [
    { severity: 'critical' as AlertSeverity, message: 'Emergency evacuation alert' },
    { severity: 'high' as AlertSeverity, message: 'Severe weather warning' },
    { severity: 'medium' as AlertSeverity, message: 'Traffic incident reported' },
    { severity: 'low' as AlertSeverity, message: 'Community announcement' },
  ];
  
  for (const notification of notifications) {
    console.log(`Processing ${notification.severity} notification: ${notification.message}`);
    
    // Trigger haptic feedback based on notification severity
    await hapticFeedbackService.triggerFeedback(notification.severity);
    
    // Get the haptic pattern used
    const pattern = hapticFeedbackService.getHapticPattern(notification.severity);
    console.log(`Used haptic pattern: ${pattern}`);
    
    // Wait before next notification
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}

/**
 * Example: Error handling and graceful degradation
 */
export async function demonstrateErrorHandling() {
  console.log('=== Error Handling Examples ===');
  
  // Check device support
  if (!hapticFeedbackService.isSupported()) {
    console.log('Device does not support haptic feedback - graceful degradation');
    return;
  }
  
  // Test with service disabled
  hapticFeedbackService.setEnabled(false);
  console.log('Haptic disabled - should not trigger feedback');
  await hapticFeedbackService.triggerFeedback('critical');
  
  // Re-enable for further tests
  hapticFeedbackService.setEnabled(true);
  
  // Test service status
  const status = await hapticFeedbackService.getServiceStatus();
  console.log('Service status:', {
    initialized: status.isInitialized,
    enabled: status.isEnabled,
    supported: status.deviceSupported,
    platform: status.platform,
  });
}

/**
 * Example: Performance considerations
 */
export async function demonstratePerformanceConsiderations() {
  console.log('=== Performance Considerations ===');
  
  // Rapid haptic feedback (should be handled gracefully)
  console.log('Testing rapid haptic feedback...');
  
  const rapidTests = Array.from({ length: 5 }, (_, i) => 
    hapticFeedbackService.triggerFeedback('medium')
  );
  
  await Promise.all(rapidTests);
  console.log('Rapid haptic tests completed');
  
  // Test service reset
  console.log('Testing service reset...');
  await hapticFeedbackService.reset();
  console.log('Service reset completed');
}

/**
 * Run all examples
 */
export async function runAllHapticExamples() {
  console.log('🔄 Starting HapticFeedbackService Examples...\n');
  
  try {
    await demonstrateBasicHapticFeedback();
    console.log('\n');
    
    await demonstrateSettingsManagement();
    console.log('\n');
    
    await demonstrateSettingsPreview();
    console.log('\n');
    
    await demonstrateNotificationIntegration();
    console.log('\n');
    
    await demonstrateErrorHandling();
    console.log('\n');
    
    await demonstratePerformanceConsiderations();
    console.log('\n');
    
    console.log('✅ All HapticFeedbackService examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running haptic examples:', error);
  }
}

// Export individual functions for selective testing
export {
  demonstrateBasicHapticFeedback,
  demonstrateSettingsManagement,
  demonstrateSettingsPreview,
  demonstrateNotificationIntegration,
  demonstrateErrorHandling,
  demonstratePerformanceConsiderations,
};