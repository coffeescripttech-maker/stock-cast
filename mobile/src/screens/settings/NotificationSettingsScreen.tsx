/**
 * NotificationSettingsScreen - Manage notification preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Bell, Volume2, Vibrate, TestTube, Settings, Shield } from 'lucide-react-native';
import { notificationIntegration } from '../../services/notifications/NotificationIntegration';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

interface NotificationSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const NotificationSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    vibrationEnabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [isTestingVibration, setIsTestingVibration] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const currentSettings = await notificationIntegration.getNotificationSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      setIsSaving(true);
      
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      await notificationIntegration.updateNotificationSettings({
        [key]: value
      });

      console.log(`${key} updated to:`, value);
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      
      // Revert the change on error
      setSettings(settings);
      
      Alert.alert('Error', `Failed to update ${key} setting`);
    } finally {
      setIsSaving(false);
    }
  };

  const testSound = async () => {
    try {
      setIsTestingSound(true);
      await notificationIntegration.testNotification('medium');
      Alert.alert('Test Complete', 'Sound notification test sent!');
    } catch (error) {
      console.error('Error testing sound:', error);
      Alert.alert('Error', 'Failed to test sound notification');
    } finally {
      setIsTestingSound(false);
    }
  };

  const testVibration = async () => {
    try {
      setIsTestingVibration(true);
      await notificationIntegration.testNotification('high');
      Alert.alert('Test Complete', 'Vibration notification test sent!');
    } catch (error) {
      console.error('Error testing vibration:', error);
      Alert.alert('Error', 'Failed to test vibration notification');
    } finally {
      setIsTestingVibration(false);
    }
  };

  const testCriticalAlert = async () => {
    try {
      await notificationIntegration.testNotification('critical');
      Alert.alert('Test Complete', 'Critical alert test sent with sound and vibration!');
    } catch (error) {
      console.error('Error testing critical alert:', error);
      Alert.alert('Error', 'Failed to test critical alert');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Bell color={COLORS.primary} size={32} strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <Text style={styles.headerSubtitle}>
          Customize how you receive emergency alerts and notifications
        </Text>
      </View>

      {/* Alert Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Preferences</Text>
        
        {/* Sound Setting */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={styles.settingIconContainer}>
              <Volume2 color={COLORS.primary} size={24} strokeWidth={2} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sound Alerts</Text>
              <Text style={styles.settingDescription}>
                Play different sounds based on alert severity
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => updateSetting('soundEnabled', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '40' }}
              thumbColor={settings.soundEnabled ? COLORS.primary : COLORS.textSecondary}
              disabled={isSaving}
            />
          </View>
          
          {settings.soundEnabled && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={testSound}
              disabled={isTestingSound}
            >
              {isTestingSound ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <TestTube color={COLORS.primary} size={16} strokeWidth={2} />
              )}
              <Text style={styles.testButtonText}>
                {isTestingSound ? 'Testing...' : 'Test Sound'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Vibration Setting */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={styles.settingIconContainer}>
              <Vibrate color={COLORS.primary} size={24} strokeWidth={2} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Vibration</Text>
              <Text style={styles.settingDescription}>
                Vibrate with different patterns for alert types
              </Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => updateSetting('vibrationEnabled', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '40' }}
              thumbColor={settings.vibrationEnabled ? COLORS.primary : COLORS.textSecondary}
              disabled={isSaving}
            />
          </View>
          
          {settings.vibrationEnabled && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={testVibration}
              disabled={isTestingVibration}
            >
              {isTestingVibration ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <TestTube color={COLORS.primary} size={16} strokeWidth={2} />
              )}
              <Text style={styles.testButtonText}>
                {isTestingVibration ? 'Testing...' : 'Test Vibration'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Test Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        
        <TouchableOpacity
          style={styles.criticalTestButton}
          onPress={testCriticalAlert}
        >
          <View style={styles.criticalTestIcon}>
            <Shield color={COLORS.white} size={24} strokeWidth={2} />
          </View>
          <View style={styles.criticalTestInfo}>
            <Text style={styles.criticalTestTitle}>Test Critical Alert</Text>
            <Text style={styles.criticalTestDescription}>
              Test the full notification experience with sound and vibration
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Alert Severity Guide */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Severity Guide</Text>
        
        <View style={styles.severityGuide}>
          <View style={styles.severityItem}>
            <View style={[styles.severityDot, { backgroundColor: COLORS.error }]} />
            <View style={styles.severityInfo}>
              <Text style={styles.severityTitle}>Critical</Text>
              <Text style={styles.severityDescription}>Urgent sound + strong vibration</Text>
            </View>
          </View>
          
          <View style={styles.severityItem}>
            <View style={[styles.severityDot, { backgroundColor: '#FF8C00' }]} />
            <View style={styles.severityInfo}>
              <Text style={styles.severityTitle}>High</Text>
              <Text style={styles.severityDescription}>Alert sound + medium vibration</Text>
            </View>
          </View>
          
          <View style={styles.severityItem}>
            <View style={[styles.severityDot, { backgroundColor: '#FFD700' }]} />
            <View style={styles.severityInfo}>
              <Text style={styles.severityTitle}>Medium</Text>
              <Text style={styles.severityDescription}>Notification sound + light vibration</Text>
            </View>
          </View>
          
          <View style={styles.severityItem}>
            <View style={[styles.severityDot, { backgroundColor: COLORS.textSecondary }]} />
            <View style={styles.severityInfo}>
              <Text style={styles.severityTitle}>Low</Text>
              <Text style={styles.severityDescription}>Subtle sound + light vibration</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoIcon}>
          <Settings color={COLORS.primary} size={20} strokeWidth={2} />
        </View>
        <Text style={styles.infoText}>
          These settings only affect sounds and vibrations. You'll still receive all emergency 
          alerts regardless of these preferences to ensure your safety.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  settingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: SPACING.sm,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  testButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  criticalTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 16,
    padding: SPACING.md,
  },
  criticalTestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  criticalTestInfo: {
    flex: 1,
  },
  criticalTestTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginBottom: 2,
  },
  criticalTestDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
    lineHeight: 18,
  },
  severityGuide: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  severityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  severityInfo: {
    flex: 1,
  },
  severityTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  severityDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: SPACING.xl,
  },
  infoIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;