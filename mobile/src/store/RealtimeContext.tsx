// Real-Time Context for WebSocket Updates
// Manages real-time alert, incident, and SOS updates

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import { websocketService } from '../services/websocket.service';
import { useAuth } from './AuthContext';
import { useAlerts } from './AlertContext';
import { useBadgeCounter } from './BadgeContext';
import * as Notifications from 'expo-notifications';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface RealtimeContextType {
  isConnected: boolean;
  reconnectAttempts: number;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { fetchAlerts } = useAlerts();
  const { updateBadgeCount } = useBadgeCounter();
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Request notification permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        console.log('🔔 [RealtimeContext] Requesting notification permissions...');
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('   Existing permission status:', existingStatus);
        
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          console.log('   Requesting new permissions...');
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          console.log('   New permission status:', finalStatus);
        }
        
        if (finalStatus !== 'granted') {
          console.warn('⚠️ [RealtimeContext] Notification permissions not granted!');
          console.warn('   Push notifications will not work.');
        } else {
          console.log('✅ [RealtimeContext] Notification permissions granted!');
        }
      } catch (error) {
        console.error('❌ [RealtimeContext] Failed to request notification permissions:', error);
      }
    };

    requestPermissions();
  }, []);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔌 [RealtimeContext] User authenticated, initiating WebSocket connection...');
      console.log('   User ID:', user.id);
      console.log('   User Email:', user.email);
      connect();
    } else {
      console.log('🔌 [RealtimeContext] User not authenticated, disconnecting WebSocket...');
      disconnect();
    }

    return () => {
      console.log('🔌 [RealtimeContext] Component unmounting, cleaning up...');
      disconnect();
    };
  }, [isAuthenticated, user]);

  // Setup WebSocket event listeners
  useEffect(() => {
    // Listen for new alerts
    const unsubscribeNewAlert = websocketService.on('new_alert', async (data) => {
      console.log('📢 New alert received via WebSocket:', data);
      
      const alert = data.data || data;
      
      // Refresh alerts list
      fetchAlerts();
      
      // Increment badge counts for all alert locations
      updateBadgeCount('alerts_tab', (prev) => prev + 1);
      updateBadgeCount('header', (prev) => prev + 1);
      updateBadgeCount('home_cards', (prev) => prev + 1);
      
      // Send local push notification if app is in background or inactive
      const appState = AppState.currentState;
      console.log('📱 [Push Notification] App state:', appState);
      
      if (appState === 'background' || appState === 'inactive') {
        try {
          console.log('📱 [Push Notification] Scheduling notification...');
          console.log('   Alert:', {
            severity: alert.severity,
            alertType: alert.alertType,
            title: alert.title,
            id: alert.id
          });
          
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `🚨 ${alert.severity?.toUpperCase() || 'ALERT'}: ${alert.alertType || 'Emergency'}`,
              body: alert.title || 'New emergency alert in your area',
              data: { 
                type: 'alert', 
                alertId: alert.id,
                severity: alert.severity,
                alertType: alert.alertType
              },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
              badge: 1,
            },
            trigger: null, // Send immediately
          });
          console.log('✅ [Push Notification] Notification scheduled successfully! ID:', notificationId);
        } catch (error) {
          console.error('❌ [Push Notification] Failed to schedule notification:', error);
          console.error('   Error details:', JSON.stringify(error, null, 2));
        }
      } else {
        console.log('📱 App is active, skipping push notification (showing in-app instead)');
      }
    });

    // Listen for alert updates
    const unsubscribeAlertUpdate = websocketService.on('alert_updated', (alert) => {
      console.log('📢 Alert updated via WebSocket:', alert);
      
      // Refresh alerts list
      fetchAlerts();
    });

    // Listen for new incidents
    const unsubscribeNewIncident = websocketService.on('new_incident', async (data) => {
      console.log('📢 New incident received via WebSocket:', data);
      
      const incident = data.data || data;
      
      // Increment header badge for incidents
      updateBadgeCount('header', (prev) => prev + 1);
      
      // Send push notification if app is in background
      const appState = AppState.currentState;
      if (appState === 'background' || appState === 'inactive') {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '📋 New Incident Report',
              body: incident.description || 'A new incident has been reported',
              data: { 
                type: 'incident', 
                incidentId: incident.id 
              },
              sound: 'default',
            },
            trigger: null,
          });
          console.log('📱 Push notification sent for new incident');
        } catch (error) {
          console.error('❌ Failed to send push notification:', error);
        }
      }
    });

    // Listen for new SOS
    const unsubscribeNewSOS = websocketService.on('new_sos', async (data) => {
      console.log('📢 New SOS received via WebSocket:', data);
      
      const sos = data.data || data;
      
      // Increment header badge for SOS
      updateBadgeCount('header', (prev) => prev + 1);
      
      // Send push notification if app is in background
      const appState = AppState.currentState;
      if (appState === 'background' || appState === 'inactive') {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🆘 New SOS Alert',
              body: sos.message || 'Someone needs emergency assistance',
              data: { 
                type: 'sos', 
                sosId: sos.id 
              },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: null,
          });
          console.log('📱 Push notification sent for new SOS');
        } catch (error) {
          console.error('❌ Failed to send push notification:', error);
        }
      }
    });

    // Listen for badge updates
    const unsubscribeBadgeUpdate = websocketService.on('badge_update', (badgeCounts) => {
      console.log('📢 Badge update received via WebSocket:', badgeCounts);
      
      // Update badge counts if provided
      if (badgeCounts.alerts !== undefined) {
        updateBadgeCount('alerts_tab', badgeCounts.alerts);
        updateBadgeCount('home_cards', badgeCounts.alerts);
      }
      if (badgeCounts.total !== undefined) {
        updateBadgeCount('header', badgeCounts.total);
      }
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeNewAlert();
      unsubscribeAlertUpdate();
      unsubscribeNewIncident();
      unsubscribeNewSOS();
      unsubscribeBadgeUpdate();
    };
  }, [fetchAlerts, updateBadgeCount]);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = websocketService.getStatus();
      setIsConnected(status.connected);
      setReconnectAttempts(status.reconnectAttempts);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const connect = async () => {
    try {
      console.log('🔌 [RealtimeContext] Calling websocketService.connect()...');
      await websocketService.connect();
      setIsConnected(true);
      console.log('✅ [RealtimeContext] Connection successful!');
    } catch (error) {
      console.error('❌ [RealtimeContext] Failed to connect:', error);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    console.log('🔌 [RealtimeContext] Disconnecting WebSocket...');
    websocketService.disconnect();
    setIsConnected(false);
    setReconnectAttempts(0);
    console.log('✅ [RealtimeContext] Disconnected');
  };

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        reconnectAttempts,
        connect,
        disconnect,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};
