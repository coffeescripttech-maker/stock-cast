// Test Silent SMS Module
// Run this in your app to verify silent SMS is working

import { canSendSilentSMS } from './src/services/sms';

export async function testSilentSMS() {
  console.log('🧪 Testing Silent SMS Module...\n');

  try {
    // Check if silent SMS is available
    const isAvailable = await canSendSilentSMS();
    
    console.log('Platform:', Platform.OS);
    console.log('Silent SMS Available:', isAvailable);
    
    if (isAvailable) {
      console.log('✅ Silent SMS is ready!');
      console.log('   - Android device detected');
      console.log('   - SEND_SMS permission granted');
      console.log('   - Emergency SMS will send automatically when offline');
    } else {
      console.log('⚠️ Silent SMS not available');
      
      if (Platform.OS === 'ios') {
        console.log('   - iOS does not support silent SMS');
        console.log('   - Will use SMS app with pre-filled message');
      } else if (Platform.OS === 'android') {
        console.log('   - SEND_SMS permission not granted');
        console.log('   - Grant permission in: Settings > Apps > SafeHaven > Permissions > SMS');
        console.log('   - Or app will request permission on first SOS attempt');
      }
    }
    
    return isAvailable;
  } catch (error) {
    console.error('❌ Error testing silent SMS:', error);
    return false;
  }
}

// Usage in your app:
// import { testSilentSMS } from './test-silent-sms';
// testSilentSMS();
