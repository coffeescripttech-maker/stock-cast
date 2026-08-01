// SOS Confirmation Screen - Success message after sending SOS

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { IncidentType } from '../../types/incidentTypes';

export const SOSConfirmationScreen = ({ route, navigation }: any) => {
  const { incidentType } = route.params as { incidentType: IncidentType };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const handleViewAlerts = () => {
    navigation.navigate('SOSAlerts');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✅</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>SOS Alert Sent!</Text>

        {/* Message */}
        <Text style={styles.message}>
          Your emergency alert for{' '}
          <Text style={styles.incidentName}>{incidentType.name}</Text> has been
          successfully sent to emergency responders.
        </Text>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>1.</Text>
            <Text style={styles.infoText}>
              Emergency responders have been notified
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>2.</Text>
            <Text style={styles.infoText}>
              They will contact you shortly
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>3.</Text>
            <Text style={styles.infoText}>
              Keep your phone accessible and stay safe
            </Text>
          </View>
        </View>

        {/* Responders Notified */}
        <View style={styles.respondersBox}>
          <Text style={styles.respondersTitle}>Responders Notified:</Text>
          <View style={styles.respondersList}>
            {incidentType.responders.map((responder, index) => (
              <View key={index} style={styles.responderBadge}>
                <Text style={styles.responderText}>{responder.agency}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoHome}
          >
            <Text style={styles.primaryButtonText}>Go to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewAlerts}
          >
            <Text style={styles.secondaryButtonText}>View My Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Contact */}
        <View style={styles.emergencyBox}>
          <Text style={styles.emergencyIcon}>📞</Text>
          <Text style={styles.emergencyText}>
            In case of immediate danger, call 911
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  incidentName: {
    fontWeight: '600',
    color: '#EF4444',
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginRight: 8,
    width: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  respondersBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  respondersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  respondersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  responderBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  responderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emergencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  emergencyIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  emergencyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
  },
});

export default SOSConfirmationScreen;
