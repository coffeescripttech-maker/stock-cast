/**
 * BadgeExamples - Example usage of the badge counter system
 * 
 * This file demonstrates how to integrate the badge system with different
 * parts of the application and provides usage examples for developers.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, AlertTriangle, Home } from 'lucide-react-native';
import BadgeIndicator from '../../components/common/BadgeIndicator';
import ConnectedBadge from '../../components/common/ConnectedBadge';
import { useBadgeCounter } from '../../store/BadgeContext';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';

/**
 * Example 1: Header Notification Bell with Badge
 */
export const HeaderNotificationExample: React.FC = () => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.notificationButton}>
        <Bell color={COLORS.white} size={22} />
        <ConnectedBadge 
          location="header"
          size="small"
          position="top-right"
        />
      </TouchableOpacity>
    </View>
  );
};

/**
 * Example 2: Tab Bar with Badge
 */
export const TabBarExample: React.FC = () => {
  return (
    <View style={styles.tabContainer}>
      <View style={styles.iconContainer}>
        <Bell color={COLORS.primary} size={24} />
        <ConnectedBadge 
          location="alerts_tab"
          size="small"
          position="top-right"
        />
      </View>
      <Text style={styles.tabLabel}>Alerts</Text>
    </View>
  );
};

/**
 * Example 3: Home Screen Alert Card with Badge
 */
export const AlertCardExample: React.FC = () => {
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertContent}>
        <AlertTriangle color={COLORS.error} size={20} />
        <Text style={styles.alertTitle}>Critical Weather Alert</Text>
      </View>
      <ConnectedBadge 
        location="home_cards"
        size="small"
        position="top-right"
      />
    </View>
  );
};

/**
 * Example 4: Standalone Badge Usage
 */
export const StandaloneBadgeExample: React.FC = () => {
  return (
    <View style={styles.exampleContainer}>
      <Text style={styles.exampleTitle}>Standalone Badge Examples</Text>
      
      <View style={styles.badgeRow}>
        <View style={styles.badgeExample}>
          <BadgeIndicator count={5} size="small" />
          <Text>Small (5)</Text>
        </View>
        
        <View style={styles.badgeExample}>
          <BadgeIndicator count={25} size="medium" />
          <Text>Medium (25)</Text>
        </View>
        
        <View style={styles.badgeExample}>
          <BadgeIndicator count={150} size="large" maxCount={99} />
          <Text>Large (99+)</Text>
        </View>
      </View>
      
      <View style={styles.badgeRow}>
        <View style={styles.badgeExample}>
          <BadgeIndicator count={3} color="#34C759" />
          <Text>Green</Text>
        </View>
        
        <View style={styles.badgeExample}>
          <BadgeIndicator count={7} color="#FF9500" />
          <Text>Orange</Text>
        </View>
        
        <View style={styles.badgeExample}>
          <BadgeIndicator count={0} />
          <Text>Hidden (0)</Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Example 5: Badge Management Controls
 */
export const BadgeControlsExample: React.FC = () => {
  const { badgeCounts, updateBadgeCount, clearAllBadges, incrementBadgeCount } = useBadgeCounter();

  return (
    <View style={styles.controlsContainer}>
      <Text style={styles.controlsTitle}>Badge Management Controls</Text>
      
      <View style={styles.countsDisplay}>
        <Text>Header: {badgeCounts.header}</Text>
        <Text>Alerts Tab: {badgeCounts.alerts_tab}</Text>
        <Text>Home Cards: {badgeCounts.home_cards}</Text>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => incrementBadgeCount('header')}
        >
          <Text style={styles.buttonText}>+1 Header</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => incrementBadgeCount('alerts_tab')}
        >
          <Text style={styles.buttonText}>+1 Alerts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => incrementBadgeCount('home_cards')}
        >
          <Text style={styles.buttonText}>+1 Home</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.controlButton, styles.clearButton]}
        onPress={clearAllBadges}
      >
        <Text style={[styles.buttonText, styles.clearButtonText]}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabContainer: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.primary,
  },
  alertCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    margin: SPACING.sm,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  exampleContainer: {
    padding: SPACING.md,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  badgeExample: {
    alignItems: 'center',
    gap: SPACING.sm,
    position: 'relative',
    width: 60,
    height: 60,
    justifyContent: 'center',
  },
  controlsContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  countsDisplay: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  controlButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: COLORS.error,
  },
  clearButtonText: {
    color: COLORS.white,
  },
});

export default {
  HeaderNotificationExample,
  TabBarExample,
  AlertCardExample,
  StandaloneBadgeExample,
  BadgeControlsExample,
};