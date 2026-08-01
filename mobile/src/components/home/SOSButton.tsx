import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert as RNAlert,
  Animated,
  Vibration,
  Platform,
  PermissionsAndroid,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertTriangle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { useAuth } from '../../store/AuthContext';
import { useLocation } from '../../store/LocationContext';
import { useNetwork } from '../../store/NetworkContext';
import api from '../../services/api';
import { sendSOSviaSMS, canSendSilentSMS } from '../../services/sms';

interface SOSButtonProps {
  onSOSSent?: () => void;
}

type TargetAgency = 'barangay' | 'lgu' | 'bfp' | 'pnp' | 'mdrrmo' | 'all';

export const SOSButton: React.FC<SOSButtonProps> = ({ onSOSSent }) => {
  const { user } = useAuth();
  const { location } = useLocation();
  const { isOnline } = useNetwork();
  const navigation = useNavigation<any>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(1);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [selectedAgency, setSelectedAgency] = useState<TargetAgency>('all');
  const [hasSMSPermission, setHasSMSPermission] = useState(false);
  const [waitingForSMSReturn, setWaitingForSMSReturn] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Request SMS permission on Android
  useEffect(() => {
    const requestSMSPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.SEND_SMS,
            {
              title: 'SMS Permission',
              message: 'SafeHaven needs SMS permission to send emergency alerts when offline',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          setHasSMSPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('✅ SMS permission granted - silent SMS available');
          } else {
            console.log('⚠️ SMS permission denied - will use SMS app with user confirmation');
          }
        } catch (err) {
          console.warn('Error requesting SMS permission:', err);
        }
      }
    };

    requestSMSPermission();
  }, []);

  // Listen for app returning from background (after SMS app)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // User returned to app from background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App returned to foreground');
        
        // If we were waiting for SMS return, show confirmation
        if (waitingForSMSReturn) {
          console.log('✅ User returned from SMS app');
          setWaitingForSMSReturn(false);
          
          // Show confirmation that SMS was likely sent
          setTimeout(() => {
            RNAlert.alert(
              '✅ Welcome Back!',
              'Did you send the emergency SMS?\n\n' +
              '✅ If YES: Your SOS alert should arrive at the emergency gateway shortly.\n\n' +
              '❌ If NO: You can press the SOS button again to retry.',
              [
                { 
                  text: 'Yes, I sent it', 
                  style: 'default',
                  onPress: () => {
                    console.log('✅ User confirmed SMS was sent');
                    onSOSSent?.();
                  }
                },
                { 
                  text: 'No, I cancelled', 
                  style: 'cancel',
                  onPress: () => {
                    console.log('⚠️ User cancelled SMS');
                  }
                }
              ]
            );
          }, 500); // Small delay to ensure app is fully active
        }
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [waitingForSMSReturn, onSOSSent]);

  // Pulse animation
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleSOSPress = async () => {
    // Vibrate for haptic feedback
    Vibration.vibrate(100);
    setShowOptions(true);
  };

  const handleQuickSOS = () => {
    setShowOptions(false);
    setShowConfirm(true);
  };

  const handleReportIncident = () => {
    setShowOptions(false);
    navigation.navigate('SOS', { screen: 'IncidentTypeList' });
  };

  const handleConfirm = async () => {
    // Vibrate for confirmation
    Vibration.vibrate([100, 50, 100]);

    setSending(true);
    setCountdown(1);

    // Countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          sendSOS();
          return 0;
        }
        Vibration.vibrate(100);
        return prev - 1;
      });
    }, 1000);
  };

  const sendSOS = async () => {
    try {
      // Build user name from available data
      const userName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user?.email || 'SafeHaven User';

      const sosData = {
        latitude: location?.latitude,
        longitude: location?.longitude,
        message: 'Emergency! I need help!',
        targetAgency: selectedAgency,
        userInfo: {
          userId: user?.id || 0,
          name: userName,
          phone: user?.phone || 'Not provided',
        },
      };

      console.log('📡 Sending SOS...', { isOnline, sosData });

      // TRY API FIRST (if online)
      if (isOnline) {
        try {
          console.log('📡 Attempting API send (online)...');
          await api.post('/sos', sosData);

          // Success vibration
          Vibration.vibrate([100, 50, 100, 50, 100]);

          setShowConfirm(false);
          setSending(false);
          setCountdown(1);

          RNAlert.alert(
            '✅ SOS Sent Successfully!',
            `Your emergency alert has been sent to ${selectedAgency.toUpperCase()} responders via internet. Help is on the way!`,
            [{ text: 'OK', style: 'default' }]
          );

          onSOSSent?.();
          return; // Success, exit
        } catch (apiError: any) {
          console.error('❌ API send failed, trying SMS fallback...', apiError);
          
          // Show warning that falling back to SMS
          console.log('⚠️ Internet connection failed, switching to SMS...');
          // Continue to SMS fallback
        }
      }

      // FALLBACK TO SMS (offline or API failed)
      console.log('📱 Opening SMS app with pre-filled message (offline fallback)...');
      
      const smsGatewayNumber = process.env.EXPO_PUBLIC_SMS_GATEWAY_NUMBER || '09923150633';
      
      // Set flag that we're waiting for user to return from SMS app
      setWaitingForSMSReturn(true);
      
      // This will open SMS app with pre-filled message
      await sendSOSviaSMS(sosData, smsGatewayNumber);

      // Success vibration
      Vibration.vibrate([100, 50, 100, 50, 100]);

      setShowConfirm(false);
      setSending(false);
      setCountdown(3);

      // Show brief instruction before SMS app opens
      RNAlert.alert(
        '📱 Opening SMS App',
        `Your emergency SMS is ready!\n\n` +
        `📱 To: ${smsGatewayNumber}\n` +
        `📍 Location: ${location ? 'Included' : 'Not available'}\n` +
        `👤 Your info: ${userName}\n\n` +
        `⚠️ IMPORTANT: Press SEND in the SMS app to complete your emergency alert.\n\n` +
        `The app will automatically return here after you send or cancel.`,
        [{ text: 'OK', style: 'default' }]
      );

    } catch (error: any) {
      console.error('❌ Error sending SOS:', error);
      
      // Error vibration
      Vibration.vibrate([100, 100, 100]);

      setShowConfirm(false);
      setSending(false);
      setCountdown(3);

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

      RNAlert.alert(
        errorTitle,
        errorMessage,
        [
          { text: 'Try Again', style: 'default', onPress: () => setShowConfirm(true) },
          { text: 'Call 911', style: 'destructive', onPress: () => {
            // TODO: Add direct call to 911 if needed
            console.log('User chose to call 911');
          }},
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setSending(false);
    setCountdown(1);
    setSelectedAgency('all');
  };

  const agencies = [
    { value: 'all' as TargetAgency, label: 'All Agencies', icon: '🚨', description: 'Notify all emergency responders' },
    { value: 'barangay' as TargetAgency, label: 'Barangay', icon: '🏘️', description: 'Local barangay officials' },
    { value: 'lgu' as TargetAgency, label: 'LGU', icon: '🏛️', description: 'Local Government Unit' },
    { value: 'bfp' as TargetAgency, label: 'BFP', icon: '🚒', description: 'Bureau of Fire Protection' },
    { value: 'pnp' as TargetAgency, label: 'PNP', icon: '👮', description: 'Philippine National Police' },
    { value: 'mdrrmo' as TargetAgency, label: 'MDRRMO', icon: '⚠️', description: 'Disaster Risk Management' },
  ];

  return (
    <>
      <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handleSOSPress}
          activeOpacity={0.8}
        >
          <View style={styles.sosInner}>
            <AlertTriangle color="#FFFFFF" size={20} strokeWidth={3} />
            <Text style={styles.sosText}>SOS</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={64} color="#DC2626" />
            <Text style={styles.modalTitle}>Emergency Options</Text>
            <Text style={styles.modalMessage}>
              Choose how to report your emergency
            </Text>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleQuickSOS}
              >
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>🚨</Text>
                </View>
                <Text style={styles.optionTitle}>Quick SOS</Text>
                <Text style={styles.optionDescription}>
                  Send immediate emergency alert to all agencies
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleReportIncident}
              >
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>📋</Text>
                </View>
                <Text style={styles.optionTitle}>Report Incident</Text>
                <Text style={styles.optionDescription}>
                  Select specific incident type for targeted response
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {sending ? (
              <>
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>{countdown}</Text>
                </View>
                <Text style={styles.modalTitle}>Sending SOS...</Text>
                <Text style={styles.modalMessage}>
                  Your location and information will be sent to authorities and emergency
                  contacts.
                </Text>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="warning" size={64} color="#DC2626" />
                <Text style={styles.modalTitle}>Send Emergency Alert?</Text>
                
                {/* Agency Selection */}
                <Text style={styles.sectionTitle}>Select Emergency Agency:</Text>
                <View style={styles.agencyGrid}>
                  {agencies.map((agency) => (
                    <TouchableOpacity
                      key={agency.value}
                      style={[
                        styles.agencyCard,
                        selectedAgency === agency.value && styles.agencyCardSelected
                      ]}
                      onPress={() => setSelectedAgency(agency.value)}
                    >
                      <Text style={styles.agencyIcon}>{agency.icon}</Text>
                      <Text style={[
                        styles.agencyLabel,
                        selectedAgency === agency.value && styles.agencyLabelSelected
                      ]}>
                        {agency.label}
                      </Text>
                      <Text style={styles.agencyDescription}>{agency.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.modalMessage}>
                  Your location and information will be sent to the selected agency.
                </Text>
                
                {!location && (
                  <View style={styles.warningBox}>
                    <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                    <Text style={styles.warningText}>
                      Location not available. SOS will be sent without coordinates.
                    </Text>
                  </View>
                )}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                  >
                    <Text style={styles.confirmButtonText}>Send SOS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sosInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
    letterSpacing: 1,
  },
  sosSubtext: {
    fontSize: 0,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0,
    height: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  agencyGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    justifyContent: 'center',
  },
  agencyCard: {
    width: '47%',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: SPACING.sm,
    alignItems: 'center',
    minHeight: 100,
  },
  agencyCardSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  agencyIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  agencyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  agencyLabelSelected: {
    color: '#DC2626',
  },
  agencyDescription: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  recipientsList: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  recipientItem: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  modalButtons: {
    width: '100%',
    gap: SPACING.sm,
  },
  confirmButton: {
    backgroundColor: '#DC2626',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  countdownContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cancelButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  optionCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    fontSize: 32,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
