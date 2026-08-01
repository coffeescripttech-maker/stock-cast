// Profile Screen

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { useRole } from '../../store/RoleContext';
import { ProtectedComponent } from '../../components/common/ProtectedComponent';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { formatPhoneNumber } from '../../utils/formatting';
import { ProfileStackParamList } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../types/navigation';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>,
  BottomTabScreenProps<MainTabParamList>
>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, profile, logout } = useAuth();
  const { getRoleDisplayName, jurisdiction } = useRole();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar
          firstName={user?.firstName}
          lastName={user?.lastName}
          size="xlarge"
          style={styles.profileAvatar}
        />
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleDisplayName()}</Text>
        </View>
        {jurisdiction && (
          <View style={styles.jurisdictionBadge}>
            <Text style={styles.jurisdictionText}>📍 {jurisdiction}</Text>
          </View>
        )}
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>
              {user?.phone ? formatPhoneNumber(user.phone) : 'Not set'}
            </Text>
          </View>

          {profile?.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{profile.address}</Text>
            </View>
          )}

          {profile?.city && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>City</Text>
              <Text style={styles.infoValue}>{profile.city}</Text>
            </View>
          )}

          {profile?.province && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Province</Text>
              <Text style={styles.infoValue}>{profile.province}</Text>
            </View>
          )}

          {profile?.barangay && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Barangay</Text>
              <Text style={styles.infoValue}>{profile.barangay}</Text>
            </View>
          )}

          {profile?.bloodType && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Type</Text>
              <Text style={styles.infoValue}>{profile.bloodType}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Emergency Contact */}
      {(profile?.emergencyContactName || profile?.emergencyContactPhone) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <View style={styles.infoCard}>
            {profile.emergencyContactName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{profile.emergencyContactName}</Text>
              </View>
            )}

            {profile.emergencyContactPhone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>
                  {formatPhoneNumber(profile.emergencyContactPhone)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Medical Information */}
      {profile?.medicalConditions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Conditions</Text>
              <Text style={styles.infoValue}>{profile.medicalConditions}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Guides', { screen: 'GuidesList' })}>
          <Text style={styles.menuIcon}>📚</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Preparedness Guides</Text>
            <Text style={styles.menuSubtext}>Learn disaster preparedness</Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <ProtectedComponent requiredPermission={{ resource: 'incidents', action: 'create' }}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Incidents', { screen: 'IncidentsList' })}>
            <Text style={styles.menuIcon}>📋</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Report Incident</Text>
              <Text style={styles.menuSubtext}>Report disasters in your area</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </ProtectedComponent>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Family', { screen: 'GroupsList' })}>
          <Text style={styles.menuIcon}>👨‍👩‍👧</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Family Locator</Text>
            <Text style={styles.menuSubtext}>Track your family members</Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Contacts')}>
          <Text style={styles.menuIcon}>📞</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Emergency Contacts</Text>
            <Text style={styles.menuSubtext}>Important phone numbers</Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Weather', { screen: 'WeatherForecast' })}>
          <Text style={styles.menuIcon}>🌦️</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Weather Forecast</Text>
            <Text style={styles.menuSubtext}>24-hour weather predictions</Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        {/* Admin/MDRRMO Only - User Management */}
        <ProtectedComponent requiredRole={['super_admin', 'admin']}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              // Navigate to user management (placeholder)
              Alert.alert('User Management', 'This feature is available for administrators.');
            }}
          >
            <Text style={styles.menuIcon}>👥</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>User Management</Text>
              <Text style={styles.menuSubtext}>Manage system users</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </ProtectedComponent>

        {/* MDRRMO/Admin Only - Alert Management */}
        <ProtectedComponent requiredPermission={{ resource: 'alerts', action: 'create' }}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              // Navigate to alert management (placeholder)
              Alert.alert('Alert Management', 'Create and manage disaster alerts.');
            }}
          >
            <Text style={styles.menuIcon}>🚨</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Alert Management</Text>
              <Text style={styles.menuSubtext}>Create disaster alerts</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </ProtectedComponent>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.menuIcon}>✏️</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Edit Profile</Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.menuIcon}>⚙️</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Settings</Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('About')}>
          <Text style={styles.menuIcon}>ℹ️</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>About SafeHaven</Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          fullWidth
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SafeHaven v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  profileAvatar: {
    marginBottom: SPACING.md,
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  name: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    marginBottom: SPACING.xs,
  },
  roleText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
  },
  jurisdictionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  jurisdictionText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.white,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.borderRadius,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.medium,
    flex: 2,
    textAlign: 'right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: SPACING.borderRadius,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  menuSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
});
