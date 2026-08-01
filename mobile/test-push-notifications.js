/**
 * Test Push Notifications
 * Run this in the app to test if notifications are working
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function testPushNotifications() {
  console.log('🧪 Testing Push Notifications...');
  console.log('Platform:', Platform.OS);
  
  // 1. Check permissions
  console.log('\n1️⃣ Checking notification permissions...');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log('   Current status:', existingStatus);
  
  if (existingStatus !== 'granted') {
    console.log('   Requesting permissions...');
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('   New status:', status);
    
    if (status !== 'granted') {
      console.error('❌ Notification permissions not granted!');
      return false;
    }
  }
  
  console.log('✅ Permissions granted!');
  
  // 2. Test notification
  console.log('\n2️⃣ Sending test notification...');
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Test Notification',
        body: 'If you see this, push notifications are working!',
        data: { test: true },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
    
    console.log('✅ Notification sent! ID:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    return false;
  }
}

// Test with delay
export async function testPushNotificationWithDelay(seconds = 5) {
  console.log(`🧪 Testing Push Notification with ${seconds}s delay...`);
  console.log('Put the app in background now!');
  
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Delayed Test Notification',
        body: `This notification was scheduled ${seconds} seconds ago`,
        data: { test: true, delayed: true },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: { seconds },
    });
    
    console.log(`✅ Notification scheduled! ID: ${notificationId}`);
    console.log(`   Will appear in ${seconds} seconds`);
    return true;
  } catch (error) {
    console.error('❌ Failed to schedule notification:', error);
    return false;
  }
}

// Get notification settings
export async function getNotificationSettings() {
  console.log('🔍 Getting notification settings...');
  
  const permissions = await Notifications.getPermissionsAsync();
  console.log('Permissions:', JSON.stringify(permissions, null, 2));
  
  if (Platform.OS === 'android') {
    const channels = await Notifications.getNotificationChannelsAsync();
    console.log('Notification Channels:', JSON.stringify(channels, null, 2));
  }
  
  return permissions;
}
