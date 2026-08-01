import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

export const AboutScreen: React.FC = () => {
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>🛡️</Text>
        </View>
        <Text style={styles.appName}>SafeHaven</Text>
        <Text style={styles.tagline}>Your Disaster Preparedness Companion</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About SafeHaven</Text>
        <Text style={styles.description}>
          SafeHaven is a comprehensive disaster preparedness and response application designed for the Philippines. 
          Our mission is to help communities stay safe, informed, and connected during emergencies.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🚨</Text>
          <Text style={styles.featureText}>Real-time disaster alerts and warnings</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🏢</Text>
          <Text style={styles.featureText}>Evacuation center locations and information</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📞</Text>
          <Text style={styles.featureText}>Emergency contacts and hotlines</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📚</Text>
          <Text style={styles.featureText}>Disaster preparedness guides</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📋</Text>
          <Text style={styles.featureText}>Incident reporting with photos</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>👨‍👩‍👧</Text>
          <Text style={styles.featureText}>Family location tracking</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🆘</Text>
          <Text style={styles.featureText}>Emergency SOS button</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <TouchableOpacity style={styles.contactItem} onPress={() => openLink('mailto:support@safehaven.ph')}>
          <Ionicons name="mail" size={24} color={COLORS.primary} />
          <Text style={styles.contactText}>support@safehaven.ph</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactItem} onPress={() => openLink('tel:+639171234567')}>
          <Ionicons name="call" size={24} color={COLORS.primary} />
          <Text style={styles.contactText}>+63 917 123 4567</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactItem} onPress={() => openLink('https://safehaven.ph')}>
          <Ionicons name="globe" size={24} color={COLORS.primary} />
          <Text style={styles.contactText}>www.safehaven.ph</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Open Source Licenses</Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ in the Philippines</Text>
        <Text style={styles.footerText}>© 2025 SafeHaven. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: SPACING.xl, alignItems: 'center' },
  logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  logoText: { fontSize: 48 },
  appName: { fontSize: TYPOGRAPHY.sizes.xxl, fontWeight: TYPOGRAPHY.weights.bold, color: COLORS.white, marginBottom: SPACING.xs },
  tagline: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.white, opacity: 0.9, marginBottom: SPACING.xs },
  version: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.white, opacity: 0.7 },
  section: { padding: SPACING.md, marginBottom: SPACING.sm },
  sectionTitle: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold, color: COLORS.text, marginBottom: SPACING.md },
  description: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, lineHeight: 22 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  featureIcon: { fontSize: 24, marginRight: SPACING.sm },
  featureText: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text, flex: 1 },
  contactItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: SPACING.borderRadius, marginBottom: SPACING.sm, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  contactText: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text, marginLeft: SPACING.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: SPACING.borderRadius, marginBottom: SPACING.sm, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  menuText: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text },
  footer: { padding: SPACING.xl, alignItems: 'center' },
  footerText: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textSecondary, marginBottom: SPACING.xs },
});
