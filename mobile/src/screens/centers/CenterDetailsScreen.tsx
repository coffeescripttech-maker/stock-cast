import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert as RNAlert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

import { EvacuationCenter } from '../../types/models';
import { CentersStackParamList } from '../../types/navigation';
import { centersService } from '../../services/centers';
import reservationService, { CenterStatus } from '../../services/reservation';
import websocketService from '../../services/websocket.service';
import { getDirections, formatDistance, formatDuration, RouteData } from '../../services/mapbox';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { Loading } from '../../components/common/Loading';
import CenterStatusBadge from '../../components/evacuation/CenterStatusBadge';
import ReservationModal from '../../components/evacuation/ReservationModal';
import ReservationCountdown from '../../components/evacuation/ReservationCountdown';

type RouteProps = RouteProp<CentersStackParamList, 'CenterDetails'>;
type NavigationProps = NativeStackNavigationProp<CentersStackParamList>;

export const CenterDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const { centerId } = route.params;

  const [center, setCenter] = useState<EvacuationCenter | null>(null);
  const [centerStatus, setCenterStatus] = useState<CenterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  
  // Route display states
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  
  // Map ref for fitting route
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadCenter();
    loadCenterStatus();
    
    // Subscribe to WebSocket capacity updates
    const unsubscribe = websocketService.on('capacity_updated', (data) => {
      if (data.data?.centerId === centerId) {
        console.log('📢 Capacity updated for this center:', data.data);
        loadCenterStatus();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [centerId]);

  // Auto-load route when center is loaded
  useEffect(() => {
    if (center?.latitude && center?.longitude) {
      console.log('🗺️ Center loaded, auto-loading route...');
      autoLoadRoute();
    }
  }, [center]);

  const loadCenter = async () => {
    try {
      setLoading(true);
      console.log('Loading center with ID:', centerId);
      
      if (!centerId) {
        throw new Error('No center ID provided');
      }
      
      const data = await centersService.getCenterById(centerId);
      console.log('Loaded center data:', data);
      
      if (!data) {
        throw new Error('Center not found');
      }
      
      setCenter(data);
    } catch (error) {
      console.error('Error loading center:', error);
      RNAlert.alert('Error', 'Failed to load center details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadCenterStatus = async () => {
    try {
      console.log('🔄 Loading center status for center:', centerId);
      const status = await reservationService.getCenterStatus(centerId);
      console.log('✅ Loaded center status:', status);
      console.log('   Available slots:', status.availableSlots);
      console.log('   Status level:', status.statusLevel);
      console.log('   Has reservation:', !!status.myReservation);
      setCenterStatus(status);
    } catch (error) {
      console.error('❌ Error loading center status:', error);
      // Set a default status so button isn't permanently disabled
      setCenterStatus({
        centerId,
        available: true,
        availableSlots: 0,
        statusLevel: 'full',
      });
    }
  };

  const handleViewStatus = async () => {
    try {
      setRefreshingStatus(true);
      await loadCenterStatus();
      
      // Show success feedback
      RNAlert.alert(
        '✅ Status Updated',
        centerStatus 
          ? `Available Slots: ${centerStatus.availableSlots}\nStatus: ${centerStatus.statusLevel.toUpperCase()}`
          : 'Status refreshed successfully',
        [{ text: 'OK' }]
      );
    } catch (error) {
      RNAlert.alert('Error', 'Failed to refresh status');
    } finally {
      setRefreshingStatus(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCenter(), loadCenterStatus()]);
    setRefreshing(false);
  };

  const autoLoadRoute = async () => {
    if (!center?.latitude || !center?.longitude) {
      return;
    }

    try {
      setLoadingRoute(true);

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('⚠️ Location permission not granted, skipping auto-route');
        return;
      }

      // Get current location
      console.log('📍 Getting current location for auto-route...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation(location);
      console.log('✅ Current location:', location.coords);

      // Fetch route from Mapbox
      console.log('🗺️ Fetching route automatically...');
      const route = await getDirections(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        {
          latitude: center.latitude,
          longitude: center.longitude,
        }
      );

      if (route) {
        setRouteData(route);
        console.log('✅ Route loaded automatically');
        console.log(`   Distance: ${formatDistance(route.distance)}`);
        console.log(`   Duration: ${formatDuration(route.duration)}`);
        
        // Fit map to show entire route
        if (mapRef.current && route.coordinates.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(route.coordinates, {
              edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }, 500);
        }
      } else {
        console.log('⚠️ No route found');
      }
    } catch (error) {
      console.error('❌ Error auto-loading route:', error);
      // Silently fail - user can still manually get directions
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleReserveSlot = () => {
    if (!centerStatus) {
      RNAlert.alert('Error', 'Unable to load center availability');
      return;
    }

    if (centerStatus.myReservation) {
      RNAlert.alert(
        'Active Reservation',
        'You already have an active reservation for this center. Please cancel it first or wait for it to expire.',
        [
          { text: 'OK' },
          {
            text: 'View Reservations',
            onPress: () => navigation.navigate('MyReservations'),
          },
        ]
      );
      return;
    }

    if (centerStatus.availableSlots <= 0) {
      RNAlert.alert('No Slots Available', 'This center is currently full. Please try another center.');
      return;
    }

    setShowReservationModal(true);
  };

  const handleReservationSuccess = () => {
    loadCenterStatus();
    RNAlert.alert(
      'Reservation Created',
      'Your reservation has been created successfully. You have 30 minutes to arrive.',
      [
        { text: 'OK' },
        {
          text: 'View Reservations',
          onPress: () => navigation.navigate('MyReservations'),
        },
      ]
    );
  };

  const handleCall = () => {
    if (center?.contactNumber) {
      Linking.openURL(`tel:${center.contactNumber}`);
    }
  };

  const handleDirections = async () => {
    if (!center?.latitude || !center?.longitude) {
      RNAlert.alert('Error', 'Center location not available');
      return;
    }

    try {
      setLoadingRoute(true);

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        RNAlert.alert(
          'Permission Required',
          'Location permission is needed to show directions',
          [
            { text: 'Cancel' },
            {
              text: 'Open in Maps',
              onPress: () => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`;
                Linking.openURL(url);
              },
            },
          ]
        );
        return;
      }

      // Get current location
      console.log('📍 Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation(location);
      console.log('✅ Current location:', location.coords);

      // Fetch route from Mapbox
      console.log('🗺️ Fetching route...');
      const route = await getDirections(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        {
          latitude: center.latitude,
          longitude: center.longitude,
        }
      );

      if (route) {
        setRouteData(route);
        console.log('✅ Route loaded successfully');
        
        // Fit map to show entire route
        if (mapRef.current && route.coordinates.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(route.coordinates, {
              edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }, 500);
        }
        
        RNAlert.alert(
          '🗺️ Route Found',
          `Distance: ${formatDistance(route.distance)}\nEstimated Time: ${formatDuration(route.duration)}`,
          [{ text: 'OK' }]
        );
      } else {
        RNAlert.alert(
          'Route Not Found',
          'Unable to calculate route. Would you like to open in Google Maps?',
          [
            { text: 'Cancel' },
            {
              text: 'Open Maps',
              onPress: () => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`;
                Linking.openURL(url);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error getting directions:', error);
      RNAlert.alert(
        'Error',
        'Failed to get directions. Would you like to open in Google Maps?',
        [
          { text: 'Cancel' },
          {
            text: 'Open Maps',
            onPress: () => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`;
              Linking.openURL(url);
            },
          },
        ]
      );
    } finally {
      setLoadingRoute(false);
    }
  };

  if (loading) {
    return <Loading message="Loading center details..." />;
  }

  if (!center) {
    console.error('Center is null or undefined');
    return null;
  }

  console.log('Rendering center:', {
    id: center.id,
    name: center.name,
    hasLatitude: !!center.latitude,
    hasLongitude: !!center.longitude,
    hasFacilities: !!center.facilities,
  });

  const occupancyPercentage = center.occupancyPercentage || 0;
  const getCapacityColor = () => {
    if (occupancyPercentage >= 90) return '#EF4444';
    if (occupancyPercentage >= 70) return '#F59E0B';
    return '#10B981';
  };

  const facilityIcons: Record<string, string> = {
    medical: 'medical',
    food: 'restaurant',
    water: 'water',
    restrooms: 'man',
    power: 'flash',
    wifi: 'wifi',
    shelter: 'home',
    security: 'shield-checkmark',
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Status Badge - NEW */}
      {centerStatus && (
        <View style={styles.statusBadgeContainer}>
          <CenterStatusBadge
            statusLevel={centerStatus.statusLevel}
            availableSlots={centerStatus.availableSlots}
            size="large"
          />
        </View>
      )}

      {/* Active Reservation - NEW */}
      {centerStatus?.myReservation && (
        <View style={styles.activeReservationContainer}>
          <View style={styles.activeReservationHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.activeReservationTitle}>Active Reservation</Text>
          </View>
          <Text style={styles.activeReservationText}>
            You have reserved {centerStatus.myReservation.groupSize} {centerStatus.myReservation.groupSize === 1 ? 'slot' : 'slots'}
          </Text>
          {centerStatus.myReservation.status === 'pending' && (
            <View style={styles.countdownContainer}>
              <ReservationCountdown
                expiresAt={centerStatus.myReservation.expiresAt}
                onExpired={loadCenterStatus}
                size="medium"
              />
            </View>
          )}
          <TouchableOpacity
            style={styles.viewReservationButton}
            onPress={() => navigation.navigate('MyReservations')}
          >
            <Text style={styles.viewReservationButtonText}>View My Reservations</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map Preview */}
      {center.latitude && center.longitude && !isNaN(center.latitude) && !isNaN(center.longitude) && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: Number(center.latitude),
              longitude: Number(center.longitude),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={true}
            zoomEnabled={true}
          >
            {/* Destination Marker */}
            <Marker
              coordinate={{
                latitude: Number(center.latitude),
                longitude: Number(center.longitude),
              }}
              pinColor={getCapacityColor()}
              title={center.name}
            />

            {/* User Location Marker */}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.coords.latitude,
                  longitude: userLocation.coords.longitude,
                }}
                pinColor="#3B82F6"
                title="Your Location"
              />
            )}

            {/* Route Polyline */}
            {routeData && routeData.coordinates.length > 0 && (
              <Polyline
                coordinates={routeData.coordinates}
                strokeColor="#3B82F6"
                strokeWidth={4}
              />
            )}
          </MapView>

          {/* Loading Indicator */}
          {loadingRoute && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading route...</Text>
              </View>
            </View>
          )}

          {/* Route Info Overlay */}
          {routeData && (
            <View style={styles.routeInfoOverlay}>
              <View style={styles.routeInfoCard}>
                <View style={styles.routeInfoHeader}>
                  <Ionicons name="navigate" size={16} color="#3B82F6" />
                  <Text style={styles.routeInfoHeaderText}>Auto-Navigation</Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <View style={styles.routeInfoItem}>
                    <Ionicons name="navigate" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.routeInfoText}>
                      {formatDistance(routeData.distance)}
                    </Text>
                  </View>
                  <View style={styles.routeInfoDivider} />
                  <View style={styles.routeInfoItem}>
                    <Ionicons name="time" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.routeInfoText}>
                      {formatDuration(routeData.duration)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* No Route Message */}
          {!loadingRoute && !routeData && userLocation && (
            <View style={styles.routeInfoOverlay}>
              <View style={[styles.routeInfoCard, styles.noRouteCard]}>
                <Ionicons name="information-circle" size={16} color="#F59E0B" />
                <Text style={styles.noRouteText}>
                  Tap "Get Directions" to view route
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{center.name || 'Unnamed Center'}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: center.isFull ? '#FEE2E2' : '#DCFCE7' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: center.isFull ? '#DC2626' : '#16A34A' },
            ]}
          >
            {center.isFull ? 'Full' : 'Available'}
          </Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Location</Text>
        </View>
        <Text style={styles.address}>{center.address || 'No address available'}</Text>
        {center.barangay && (
          <Text style={styles.locationDetail}>Barangay {center.barangay}</Text>
        )}
        <Text style={styles.locationDetail}>
          {center.city || 'Unknown'}, {center.province || 'Unknown'}
        </Text>
      </View>

      {/* Capacity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Capacity</Text>
        </View>
        <View style={styles.capacityInfo}>
          <Text style={styles.capacityText}>
            {center.currentOccupancy || 0} / {center.capacity} people
          </Text>
          <Text style={styles.capacityPercentage}>{occupancyPercentage}% full</Text>
        </View>
        <View style={styles.capacityBarContainer}>
          <View
            style={[
              styles.capacityBar,
              {
                width: `${occupancyPercentage}%`,
                backgroundColor: getCapacityColor(),
              },
            ]}
          />
        </View>
      </View>

      {/* Facilities */}
      {center.facilities && Array.isArray(center.facilities) && center.facilities.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Facilities</Text>
          </View>
          <View style={styles.facilitiesGrid}>
            {center.facilities.map((facility, index) => (
              <View key={`facility-${index}-${facility}`} style={styles.facilityChip}>
                <Ionicons
                  name={(facilityIcons[facility] as any) || 'checkmark'}
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.facilityText}>
                  {facility ? facility.charAt(0).toUpperCase() + facility.slice(1) : 'Unknown'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Contact */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="call" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Contact Information</Text>
        </View>
        {center.contactPerson && (
          <Text style={styles.contactInfo}>
            Contact Person: {center.contactPerson}
          </Text>
        )}
        {center.contactNumber && (
          <Text style={styles.contactInfo}>Phone: {center.contactNumber}</Text>
        )}
        {!center.contactPerson && !center.contactNumber && (
          <Text style={styles.contactInfo}>No contact information available</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Reserve Slot Button - Primary Action */}
        {!centerStatus?.myReservation && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.reserveButton,
              (!centerStatus || centerStatus.availableSlots <= 0) && styles.disabledButton,
            ]}
            onPress={handleReserveSlot}
            disabled={!centerStatus || centerStatus.availableSlots <= 0}
          >
            <Ionicons name="calendar" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {!centerStatus 
                ? 'Loading...' 
                : centerStatus.availableSlots <= 0 
                  ? 'No Slots Available' 
                  : 'Reserve Slot'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick Action Buttons Row */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.directionsButton]}
            onPress={handleDirections}
            disabled={!center.latitude || !center.longitude || loadingRoute}
          >
            {loadingRoute ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="navigate" size={24} color="#FFFFFF" />
            )}
            <Text style={styles.quickActionText}>
              {loadingRoute ? 'Loading...' : 'Get Directions'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, styles.statusButton]}
            onPress={handleViewStatus}
            disabled={refreshingStatus}
          >
            {refreshingStatus ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="stats-chart" size={24} color="#FFFFFF" />
            )}
            <Text style={styles.quickActionText}>
              {refreshingStatus ? 'Updating...' : 'View Status'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.groupButton]}
            onPress={() => setShowReservationModal(true)}
            disabled={!centerStatus || centerStatus.availableSlots <= 0 || !!centerStatus?.myReservation}
          >
            <Ionicons name="people" size={24} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Register Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, styles.joinButton]}
            onPress={() => navigation.navigate('MyReservations')}
          >
            <Ionicons name="enter" size={24} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Join Center</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Color-Coded Status Legend */}
      {/* <View style={styles.statusLegend}>
        <Text style={styles.legendTitle}>Availability Status:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>🟢 Green = Maraming slots</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>🟡 Yellow = Paubos na</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>🔴 Red = Full</Text>
          </View>
        </View>
      </View> */}

      {/* Debug Info - Remove after testing */}
      {__DEV__ && centerStatus && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>Debug Info:</Text>
          <Text style={styles.debugText}>Available Slots: {centerStatus.availableSlots}</Text>
          <Text style={styles.debugText}>Status Level: {centerStatus.statusLevel}</Text>
          <Text style={styles.debugText}>Has Reservation: {centerStatus.myReservation ? 'Yes' : 'No'}</Text>
        </View>
      )}

      {/* Reservation Modal - NEW */}
      {center && centerStatus && (
        <ReservationModal
          visible={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          onSuccess={handleReservationSuccess}
          centerId={center.id}
          centerName={center.name}
          availableSlots={centerStatus.availableSlots}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  routeInfoOverlay: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
  routeInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  routeInfoHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    textTransform: 'uppercase',
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  routeInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: SPACING.md,
  },
  routeInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  noRouteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
  },
  noRouteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  address: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  locationDetail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  capacityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  capacityText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  capacityPercentage: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  capacityBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityBar: {
    height: '100%',
    borderRadius: 4,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    gap: 6,
  },
  facilityText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  contactInfo: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  actions: {
    padding: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  reserveButton: {
    backgroundColor: '#3B82F6',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  directionsButton: {
    backgroundColor: COLORS.primary,
  },
  statusButton: {
    backgroundColor: '#8B5CF6',
  },
  groupButton: {
    backgroundColor: '#F59E0B',
  },
  joinButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusLegend: {
    backgroundColor: '#F3F4F6',
    padding: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  legendItems: {
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: COLORS.text,
  },
  statusBadgeContainer: {
    padding: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activeReservationContainer: {
    backgroundColor: '#D1FAE5',
    padding: SPACING.lg,
    marginTop: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  activeReservationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  activeReservationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
  },
  activeReservationText: {
    fontSize: 14,
    color: '#047857',
    marginBottom: SPACING.sm,
  },
  countdownContainer: {
    marginBottom: SPACING.sm,
  },
  viewReservationButton: {
    backgroundColor: '#10B981',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewReservationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    margin: SPACING.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
});
