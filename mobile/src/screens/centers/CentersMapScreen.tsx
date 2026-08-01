import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert as RNAlert,
} from 'react-native';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { EvacuationCenter } from '../../types/models';
import { CentersStackParamList } from '../../types/navigation';
import { centersService } from '../../services/centers';
import { useLocation } from '../../store/LocationContext';
import { getDirections, formatDistance, formatDuration, RouteData } from '../../services/mapbox';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';

type NavigationProp = NativeStackNavigationProp<CentersStackParamList, 'CentersMap'>;

export const CentersMapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { location, requestPermission } = useLocation();
  const mapRef = useRef<MapView>(null);

  const [centers, setCenters] = useState<EvacuationCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<EvacuationCenter | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    loadCenters();
  }, [location]);

  const loadCenters = async () => {
    try {
      setLoading(true);
      if (location) {
        const data = await centersService.getNearby({
          lat: location.latitude,
          lng: location.longitude,
          radius: 50,
        });
        setCenters(data);
      } else {
        const response = await centersService.getCenters();
        setCenters(response.centers);
      }
    } catch (error) {
      console.error('Error loading centers:', error);
      RNAlert.alert('Error', 'Failed to load evacuation centers');
    } finally {
      setLoading(false);
    }
  };

  const handleCenterPress = async (center: EvacuationCenter) => {
    setSelectedCenter(center);
    setRouteData(null); // Clear previous route
    
    if (mapRef.current && center.latitude && center.longitude) {
      mapRef.current.animateToRegion({
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }

    // Auto-load route when center is selected
    await loadRouteToCenter(center);
  };

  const loadRouteToCenter = async (center: EvacuationCenter) => {
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
      console.log('📍 Getting current location for route...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation(location);
      console.log('✅ Current location:', location.coords);

      // Fetch route from Mapbox
      console.log('🗺️ Fetching route to center...');
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
        console.log(`   Distance: ${formatDistance(route.distance)}`);
        console.log(`   Duration: ${formatDuration(route.duration)}`);
        
        // Fit map to show entire route
        if (mapRef.current && route.coordinates.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(route.coordinates, {
              edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
              animated: true,
            });
          }, 500);
        }
      } else {
        console.log('⚠️ No route found');
      }
    } catch (error) {
      console.error('❌ Error loading route:', error);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleMyLocation = async () => {
    if (!location) {
      const granted = await requestPermission();
      if (!granted) {
        RNAlert.alert('Permission Required', 'Location permission is needed to show your position');
        return;
      }
    }

    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const getMarkerColor = (center: EvacuationCenter): string => {
    if (center.isFull) return '#EF4444'; // Red
    if (center.occupancyPercentage && center.occupancyPercentage > 80) return '#F59E0B'; // Orange
    return '#10B981'; // Green
  };

  const initialRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : {
        latitude: 10.3157, // Cebu City default
        longitude: 123.8854,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {centers && centers.length > 0 && centers.map((center) => (
          center.latitude && center.longitude && (
            <Marker
              key={center.id}
              coordinate={{
                latitude: center.latitude,
                longitude: center.longitude,
              }}
              pinColor={getMarkerColor(center)}
              onPress={() => handleCenterPress(center)}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.marker, { backgroundColor: getMarkerColor(center) }]}>
                  <Ionicons name="business" size={20} color="#FFFFFF" />
                </View>
              </View>
            </Marker>
          )
        ))}

        {location && (
          <Circle
            center={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            radius={5000}
            strokeColor="rgba(0, 56, 168, 0.3)"
            fillColor="rgba(0, 56, 168, 0.1)"
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

      {/* List View Button */}
      <TouchableOpacity
        style={styles.listButton}
        onPress={() => navigation.navigate('CentersList')}
      >
        <Ionicons name="list" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* My Location Button */}
      <TouchableOpacity style={styles.locationButton} onPress={handleMyLocation}>
        <Ionicons name="locate" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Selected Center Card */}
      {selectedCenter && (
        <View style={styles.centerCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.centerName}>{selectedCenter.name}</Text>
              <Text style={styles.centerAddress}>{selectedCenter.address}</Text>
              <View style={styles.capacityRow}>
                <Text style={styles.capacityText}>
                  {selectedCenter.currentOccupancy || 0} / {selectedCenter.capacity}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: selectedCenter.isFull
                        ? '#FEE2E2'
                        : '#DCFCE7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: selectedCenter.isFull ? '#DC2626' : '#16A34A' },
                    ]}
                  >
                    {selectedCenter.isFull ? 'Full' : 'Available'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelectedCenter(null)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Route Info */}
          {routeData && (
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
          )}

          {/* Loading Route */}
          {loadingRoute && (
            <View style={styles.loadingRouteCard}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingRouteText}>Loading route...</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() =>
              navigation.navigate('CenterDetails', { centerId: selectedCenter.id })
            }
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listButton: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButton: {
    position: 'absolute',
    top: SPACING.lg + 60,
    right: SPACING.lg,
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  centerCard: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  cardInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  centerAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  capacityText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
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
  loadingRouteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingRouteText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
