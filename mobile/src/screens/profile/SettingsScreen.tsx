import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationSettingsManager } from '../../services/notifications/NotificationSettingsManager';
import { audioAlertService } from '../../services/notifications/AudioAlertService';
import { hapticFeedbackService } from '../../services/notifications/HapticFeedbackService';

export const SettingsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Load notification settings on component mount
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settings = await notificationSettingsManager.getSettings();
      setSoundEnabled(settings.soundEnabled);
      setVibrationEnabled(settings.vibrationEnabled);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleSoundToggle = async (enabled: boolean) => {
    try {
      setSoundEnabled(enabled);
      await notificationSettingsManager.setSoundEnabled(enabled);
      audioAlertService.setEnabled(enabled);
    } catch (error) {
      console.error('Error updating sound setting:', error);
      setSoundEnabled(!enabled); // Revert on error
    }
  };

  const handleVibrationToggle = async (enabled: boolean) => {
    try {
      setVibrationEnabled(enabled);
      await notificationSettingsManager.setVibrationEnabled(enabled);
      hapticFeedbackService.setEnabled(enabled);
    } catch (error) {
      console.error('Error updating vibration setting:', error);
      setVibrationEnabled(!enabled); // Revert on error
    }
  };

  const handlePreviewSound = async () => {
    try {
      await notificationSettingsManager.previewSound('high');
    } catch (error) {
      console.error('Error previewing sound:', error);
      Alert.alert('Error', 'Failed to preview sound');
    }
  };

  const handlePreviewVibration = async () => {
    try {
      await notificationSettingsManager.previewVibration('high');
    } catch (error) {
      console.error('Error previewing vibration:', error);
      Alert.alert('Error', 'Failed to preview vibration');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color={COLORS.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive disaster alerts and updates</Text>
            </View>
          </View>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={COLORS.white} />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="volume-high" size={24} color={COLORS.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Sound</Text>
              <Text style={styles.settingDescription}>Play sound for notifications</Text>
            </View>
          </View>
          <View style={styles.settingControls}>
            <TouchableOpacity 
              style={styles.previewButton} 
              onPress={handlePreviewSound}
              disabled={!soundEnabled}
            >
              <Text style={[styles.previewText, !soundEnabled && styles.previewTextDisabled]}>
                Test
              </Text>
            </TouchableOpacity>
            <Switch 
              value={soundEnabled} 
              onValueChange={handleSoundToggle} 
              trackColor={{ false: COLORS.border, true: COLORS.primary }} 
              thumbColor={COLORS.white} 
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="phone-portrait" size={24} color={COLORS.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Text style={styles.settingDescription}>Vibrate for notifications</Text>
            </View>
          </View>
          <View style={styles.settingControls}>
            <TouchableOpacity 
              style={styles.previewButton} 
              onPress={handlePreviewVibration}
              disabled={!vibrationEnabled}
            >
              <Text style={[styles.previewText, !vibrationEnabled && styles.previewTextDisabled]}>
                Test
              </Text>
            </TouchableOpacity>
            <Switch 
              value={vibrationEnabled} 
              onValueChange={handleVibrationToggle} 
              trackColor={{ false: COLORS.border, true: COLORS.primary }} 
              thumbColor={COLORS.white} 
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="location" size={24} color={COLORS.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Location Sharing</Text>
              <Text style={styles.settingDescription}>Share location with family groups</Text>
            </View>
          </View>
          <Switch value={locationSharing} onValueChange={setLocationSharing} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={COLORS.white} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Storage</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleClearCache}>
          <Ionicons name="trash" size={24} color={COLORS.error} />
          <Text style={[styles.menuText, { color: COLORS.error }]}>Clear Cache</Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Build</Text>
          <Text style={styles.infoValue}>2025.01.07</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { padding: SPACING.md, marginBottom: SPACING.sm },
  sectionTitle: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold, color: COLORS.text, marginBottom: SPACING.md },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: SPACING.borderRadius, marginBottom: SPACING.sm, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: SPACING.md, flex: 1 },
  settingLabel: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold, color: COLORS.text },
  settingDescription: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  settingControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  previewButton: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: SPACING.xs, 
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  previewText: { 
    fontSize: TYPOGRAPHY.sizes.xs, 
    fontWeight: TYPOGRAPHY.weights.semibold, 
    color: COLORS.white 
  },
  previewTextDisabled: { 
    color: COLORS.textSecondary 
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: SPACING.borderRadius, marginBottom: SPACING.sm, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  menuText: { flex: 1, fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.medium, marginLeft: SPACING.md },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: SPACING.borderRadius, marginBottom: SPACING.sm },
  infoLabel: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.semibold, color: COLORS.text },
});
