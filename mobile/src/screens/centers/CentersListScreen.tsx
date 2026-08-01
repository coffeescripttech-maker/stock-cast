// Centers List Screen

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CenterCard } from '../../components/centers/CenterCard';
import { Loading } from '../../components/common/Loading';
import { centersService } from '../../services/centers';
import { useLocation } from '../../store/LocationContext';
import { useNetwork } from '../../store/NetworkContext';
import { cacheService, CACHE_KEYS, CACHE_EXPIRY } from '../../services/cache';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { EvacuationCenter } from '../../types/models';
import { CentersStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<CentersStackParamList, 'CentersList'>;

export const CentersListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { location } = useLocation();
  const { isOnline } = useNetwork();
  const [centers, setCenters] = useState<EvacuationCenter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    loadCenters();
  }, [location]);

  const loadLastUpdate = async () => {
    const timestamp = await cacheService.getTimestamp(CACHE_KEYS.CENTERS);
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

  useEffect(() => {
    // Add map and reservations buttons to header
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyReservations')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons name="calendar" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('CentersMap')}
          >
            <Ionicons name="map" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const loadCenters = async () => {
    // Load from cache first
    const cached = await cacheService.get<EvacuationCenter[]>(CACHE_KEYS.CENTERS);
    if (cached) {
      // Filter out invalid centers
      const validCached = cached.filter(c => c && c.id && c.name);
      setCenters(validCached);
      await loadLastUpdate();
    }

    // If offline, use cached data only
    if (!isOnline) {
      setIsLoading(false);
      if (!cached) {
        setError('No cached data available. Connect to internet to fetch centers.');
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      let fetchedCenters: EvacuationCenter[] = [];
      
      if (location) {
        fetchedCenters = await centersService.getNearby({
          lat: location.latitude,
          lng: location.longitude,
          radius: 500, // Increased to 500km to show all centers in the Philippines
        });
      } else {
        const { centers: allCenters } = await centersService.getCenters();
        fetchedCenters = allCenters;
      }
      
      // Filter out invalid centers (those with missing required fields)
      const validCenters = (fetchedCenters || []).filter(center => 
        center && 
        center.id && 
        center.name && 
        center.city
      );
      
      console.log('✅ Valid centers after filtering:', validCenters.length);
      setCenters(validCenters);
      
      // Cache for offline use
      if (validCenters && validCenters.length > 0) {
        await cacheService.set(CACHE_KEYS.CENTERS, validCenters, CACHE_EXPIRY.CENTERS);
        await loadLastUpdate();
      }
    } catch (err) {
      setError('Failed to load centers');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCenterPress = (center: EvacuationCenter) => {
    // Safety check
    if (!center || !center.id) {
      console.error('Invalid center:', center);
      return;
    }
    console.log('Navigating to center:', center.id);
    navigation.navigate('CenterDetails', { centerId: center.id });
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🏢</Text>
      <Text style={styles.emptyText}>No evacuation centers found</Text>
    </View>
  );

  // Count unique barangays
  const uniqueBarangays = new Set(
    centers
      .filter(c => c.barangay)
      .map(c => c.barangay)
  );
  const barangayCount = uniqueBarangays.size;

  if (isLoading && centers.length === 0) {
    return <Loading fullScreen message="Loading centers..." />;
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

      {/* Barangay Coverage Summary */}
      {barangayCount > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryIcon}>
              <Text style={styles.summaryIconText}>📍</Text>
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>Coverage Area</Text>
              <Text style={styles.summarySubtitle}>
                {barangayCount} {barangayCount === 1 ? 'Barangay' : 'Barangays'} • {centers.length} {centers.length === 1 ? 'Center' : 'Centers'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* My Reservations Quick Access */}
      <TouchableOpacity
        style={styles.reservationsCard}
        onPress={() => navigation.navigate('MyReservations')}
        activeOpacity={0.7}
      >
        <View style={styles.reservationsContent}>
          <View style={styles.reservationsIcon}>
            <Ionicons name="calendar" size={24} color="#fff" />
          </View>
          <View style={styles.reservationsText}>
            <Text style={styles.reservationsTitle}>My Reservations</Text>
            <Text style={styles.reservationsSubtitle}>View and manage your bookings</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>

      <FlatList
        data={centers}
        keyExtractor={(item, index) => `${item.id}-${item.name}-${index}`}
        renderItem={({ item }) => (
          <CenterCard center={item} onPress={() => handleCenterPress(item)} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty()}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadCenters} colors={[COLORS.primary]} />
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
  reservationsCard: {
    backgroundColor: '#fff',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reservationsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  reservationsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  reservationsText: {
    flex: 1,
  },
  reservationsTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  reservationsSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  summaryCard: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  summaryIconText: {
    fontSize: 24,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#1E40AF',
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#1E40AF',
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
