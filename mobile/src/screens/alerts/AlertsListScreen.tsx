// Alerts List Screen

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertCard } from '../../components/alerts/AlertCard';
import { Loading } from '../../components/common/Loading';
import { useAlerts } from '../../store/AlertContext';
import { useLocation } from '../../store/LocationContext';
import { useNotifications } from '../../store/NotificationContext';
import { useNetwork } from '../../store/NetworkContext';
import { useBadgeCounter } from '../../store/BadgeContext';
import { cacheService, CACHE_KEYS } from '../../services/cache';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { DisasterAlert, AlertType, AlertSeverity } from '../../types/models';
import { AlertsStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<AlertsStackParamList, 'AlertsList'>;

export const AlertsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { alerts, isLoading, error, fetchAlerts, refreshAlerts } = useAlerts();
  const { location } = useLocation();
  const { clearBadge } = useNotifications();
  const { isOnline } = useNetwork();
  const { clearBadge: clearBadgeCounter, updateBadgeCount } = useBadgeCounter();
  const [selectedType, setSelectedType] = useState<AlertType | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // Default: newest first
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    // Initial load and clear badges
    loadAlerts();
    loadLastUpdate();
    clearBadge();
    clearBadgeCounter('alerts_tab');
    clearBadgeCounter('header');
  }, []); // Run only once when component mounts

  // Reload when filters change
  useEffect(() => {
    loadAlerts();
  }, [selectedType, selectedSeverity]);

  const loadLastUpdate = async () => {
    const timestamp = await cacheService.getTimestamp(CACHE_KEYS.ALERTS);
    if (timestamp) {
      const minutes = Math.floor((Date.now() - timestamp) / 60000);
      if (minutes < 1) {
        setLastUpdate('Just now');
      } else if (minutes < 60) {
        setLastUpdate(`${minutes}m ago`);
      } else {
        const hours = Math.floor(minutes / 60);
        setLastUpdate(`${hours}h ago`);
      }
    }
  };

  const loadAlerts = () => {
    const filters: any = {};
    
    if (selectedType !== 'all') filters.type = selectedType;
    if (selectedSeverity !== 'all') filters.severity = selectedSeverity;
    if (location) {
      filters.lat = location.latitude;
      filters.lng = location.longitude;
    }

    fetchAlerts(filters);
  };

  const handleRefresh = async () => {
    await refreshAlerts();
    await loadLastUpdate();
  };

  const handleAlertPress = (alert: DisasterAlert) => {
    // Safety check
    if (!alert || !alert.id) {
      console.error('Invalid alert:', alert);
      return;
    }
    console.log('Navigating to alert:', alert.id);
    navigation.navigate('AlertDetails', { alertId: alert.id });
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>✅</Text>
      <Text style={styles.emptyText}>No active alerts</Text>
      <Text style={styles.emptySubtext}>You're safe for now</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>⚠️</Text>
      <Text style={styles.emptyText}>Failed to load alerts</Text>
      <Text style={styles.emptySubtext}>{error}</Text>
      <TouchableOpacity onPress={loadAlerts} style={styles.retryButton}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const filterTypes: Array<{ value: AlertType | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All', icon: '🌐' },
    { value: 'typhoon', label: 'Typhoon', icon: '🌀' },
    { value: 'earthquake', label: 'Quake', icon: '🌍' },
    { value: 'flood', label: 'Flood', icon: '🌊' },
  ];

  const filterSeverities: Array<{ value: AlertSeverity | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'low', label: 'Low' },
  ];

  const sortOptions: Array<{ value: 'desc' | 'asc'; label: string; icon: string }> = [
    { value: 'desc', label: 'Newest', icon: '📅' },
    { value: 'asc', label: 'Oldest', icon: '📆' },
  ];

  // Sort alerts by creation date
  const sortedAlerts = [...alerts].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.startTime).getTime();
    const dateB = new Date(b.createdAt || b.startTime).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  if (isLoading && alerts.length === 0) {
    return <Loading fullScreen message="Loading alerts..." />;
  }

  return (
    <View style={styles.container}>
      {/* Offline/Last Update Indicator */}
      {!isOnline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>📡 Offline - Showing cached data</Text>
        </View>
      )}
      {isOnline && lastUpdate && (
        <View style={styles.updateIndicator}>
          <Text style={styles.updateText}>🕐 Last updated {lastUpdate}</Text>
        </View>
      )}

      {/* Type Filters */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterTypes}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === item.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(item.value)}
            >
              <Text style={styles.filterIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.filterText,
                  selectedType === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Severity Filters */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterSeverities}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.severityChip,
                selectedSeverity === item.value && styles.severityChipActive,
              ]}
              onPress={() => setSelectedSeverity(item.value)}
            >
              <Text
                style={[
                  styles.severityText,
                  selectedSeverity === item.value && styles.severityTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Sort Options */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={sortOptions}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.sortChip,
                sortOrder === item.value && styles.sortChipActive,
              ]}
              onPress={() => setSortOrder(item.value)}
            >
              <Text style={styles.sortIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.sortText,
                  sortOrder === item.value && styles.sortTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Alerts List */}
      <FlatList
        data={sortedAlerts}
        keyExtractor={(item, index) => `${item.id}-${item.alertType}-${index}`}
        renderItem={({ item }) => (
          <AlertCard alert={item} onPress={() => handleAlertPress(item)} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={error ? renderError() : renderEmpty()}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterSection: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  filterText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  severityChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  severityChipActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  severityText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  severityTextActive: {
    color: COLORS.white,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  sortText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  sortTextActive: {
    color: COLORS.white,
  },
  list: {
    padding: SPACING.md,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.borderRadius,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  offlineIndicator: {
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  updateIndicator: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  updateText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.xs,
  },
});
