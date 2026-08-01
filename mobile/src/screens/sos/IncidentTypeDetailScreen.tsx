// Incident Type Detail Screen - Review and send SOS

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Vibration,
} from 'react-native';
import * as Location from 'expo-location';
import { IncidentType } from '../../types/incidentTypes';
import sosService from '../../services/sos.service';
import { useAuth } from '../../store/AuthContext';
import { useNetwork } from '../../store/NetworkContext';
import { sendSOSviaSMS } from '../../services/sms';


export const IncidentTypeDetailScreen = ({ route, navigation }: any) => {
  const { incidentType } = route.params as { incidentType: IncidentType };
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const [sending, setSending] = useState(false);

  const getPriorityColor = () => {
    switch (incidentType.priority) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  };

  const handleSendSOS = async () => {
    try {
      setSending(true);

      // Get current location
      const location = await getCurrentLocation();

      // Determine target agency from responders
      const primaryResponder = incidentType.responders.find(r => r.isPrimary);
      const targetAgency = primaryResponder
        ? primaryResponder.agency.toLowerCase()
        : 'all';

      // Build user name
      const userName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user?.email || 'SafeHaven User';

      const sosData = {
        incidentTypeId: incidentType.id,
        incidentDescription: incidentType.description,
        latitude: location.latitude,
        longitude: location.longitude,
        message: `${incidentType.name} - ${incidentType.description}`,
        userInfo: {
          name: userName,
          phone: user?.phone || '',
        },
        targetAgency: targetAgency as any,
      };

      console.log('📡 Sending SOS with incident type...', { 
        isOnline, 
        incidentType: incidentType.name,
        incidentTypeId: incidentType.id 
      });

      // TRY API FIRST (if online)
      if (isOnline) {
        try {
          console.log('📡 Attempting API send (online)...');
          await sosService.createSOS(sosData);

          // Success vibration
          Vibration.vibrate([100, 50, 100, 50, 100]);

          // Navigate to confirmation screen
          navigation.replace('SOSConfirmation', { incidentType });
          return; // Success, exit
        } catch (apiError: any) {
          console.error('❌ API send failed, trying SMS fallback...', apiError);
          
          // Show warning that falling back to SMS
          console.log('⚠️ Internet connection failed, switching to SMS...');
          // Continue to SMS fallback
        }
      }

      // FALLBACK TO SMS (offline or API failed)
      console.log('📱 Opening SMS app with incident type data (offline fallback)...');
      
      const smsGatewayNumber = process.env.EXPO_PUBLIC_SMS_GATEWAY_NUMBER || '09923150633';
      
      // Send SMS with incident type data
      await sendSOSviaSMS({
        latitude: location.latitude,
        longitude: location.longitude,
        targetAgency: targetAgency,
        userInfo: {
          userId: user?.id || 0,
          name: userName,
          phone: user?.phone || 'Not provided',
        },
        incidentTypeId: incidentType.id,
        incidentTypeName: incidentType.name,
      }, smsGatewayNumber);

      // Success vibration
      Vibration.vibrate([100, 50, 100, 50, 100]);

      // Show brief instruction before SMS app opens
      Alert.alert(
        '📱 Opening SMS App',
        `Your emergency SMS for "${incidentType.name}" is ready!\n\n` +
        `📱 To: ${smsGatewayNumber}\n` +
        `📍 Location: Included\n` +
        `👤 Your info: ${userName}\n` +
        `🚨 Incident: ${incidentType.name}\n\n` +
        `⚠️ IMPORTANT: Press SEND in the SMS app to complete your emergency alert.`,
        [{ 
          text: 'OK', 
          style: 'default',
          onPress: () => {
            // Navigate to confirmation screen
            navigation.replace('SOSConfirmation', { incidentType });
          }
        }]
      );

    } catch (error: any) {
      console.error('❌ Error sending SOS:', error);
      
      // Error vibration
      Vibration.vibrate([100, 100, 100]);

      // Determine specific error message
      let errorTitle = '❌ SOS Send Failed';
      let errorMessage = '';

      if (error.message?.includes('cancelled by user')) {
        errorTitle = '⚠️ SMS Cancelled';
        errorMessage = 
          'You cancelled the SMS send.\n\n' +
          'Your emergency alert was NOT sent. If you need help, please try again or call 911 directly.';
      } else if (error.message?.includes('SMS not available')) {
        errorTitle = '❌ SMS Not Available';
        errorMessage = 'Your device does not support SMS sending. Please call emergency services directly at 911.';
      } else if (error.message?.includes('SMS') && !isOnline) {
        errorTitle = '❌ SMS Failed';
        errorMessage = 
          'Failed to open SMS app. Possible reasons:\n\n' +
          '• No SIM card inserted\n' +
          '• SMS app not available\n' +
          '• Device restrictions\n\n' +
          'Please call emergency services directly at 911.';
      } else if (!isOnline) {
        errorTitle = '❌ No Connection';
        errorMessage = 
          'Cannot send SOS alert:\n\n' +
          '• No internet connection\n' +
          '• SMS app failed to open\n\n' +
          'Please try again or call 911 directly.';
      } else {
        errorTitle = '❌ SOS Send Failed';
        errorMessage = 
          'Failed to send emergency alert. Please try again or call emergency services directly at 911.\n\n' +
          `Error: ${error.message || 'Unknown error'}`;
      }

      Alert.alert(
        errorTitle,
        errorMessage,
        [
          { text: 'Try Again', style: 'default', onPress: confirmSendSOS },
          { text: 'Call 911', style: 'destructive', onPress: () => {
            console.log('User chose to call 911');
          }},
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setSending(false);
    }
  };

  const confirmSendSOS = () => {
    Alert.alert(
      'Confirm Emergency Alert',
      `Are you sure you want to send an SOS alert for "${incidentType.name}"? This will notify emergency responders.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: handleSendSOS,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{incidentType.icon}</Text>
          </View>
          <Text style={styles.name}>{incidentType.name}</Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor() },
            ]}
          >
            <Text style={styles.priorityText}>
              {incidentType.priority.toUpperCase()} PRIORITY
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{incidentType.description}</Text>
        </View>

        {/* Responders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Responders</Text>
          <Text style={styles.sectionSubtitle}>
            The following agencies will be notified:
          </Text>
          {incidentType.responders.map((responder, index) => (
            <View key={index} style={styles.responderCard}>
              <View style={styles.responderHeader}>
                <Text style={styles.agency}>
                  {responder.isPrimary ? '✓ ' : '  '}
                  {responder.agency}
                </Text>
                {responder.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryText}>PRIMARY</Text>
                  </View>
                )}
              </View>
              <Text style={styles.action}>• {responder.action}</Text>
            </View>
          ))}
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Only use this for real emergencies. False alarms may result in
            penalties and delay response to actual emergencies.
          </Text>
        </View>
      </ScrollView>

      {/* Send Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            sending && styles.sendButtonDisabled,
          ]}
          onPress={confirmSendSOS}
          disabled={sending}
        >
          {sending ? (
            <>
              <ActivityIndicator color="#FFFFFF" style={styles.buttonLoader} />
              <Text style={styles.sendButtonText}>SENDING SOS...</Text>
            </>
          ) : (
            <>
              <Text style={styles.sendButtonIcon}>🚨</Text>
              <Text style={styles.sendButtonText}>SEND SOS ALERT</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  responderCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  responderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  agency: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  primaryBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  action: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sendButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttonLoader: {
    marginRight: 8,
  },
});

export default IncidentTypeDetailScreen;
