// Home Screen - Dashboard

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { useAlerts } from '../../store/AlertContext';
import { useLocation } from '../../store/LocationContext';
import { useNotifications } from '../../store/NotificationContext';
import { useBadgeCounter } from '../../store/BadgeContext';
import { websocketService } from '../../services/websocket.service';
import { NotificationManager } from '../../services/notifications/NotificationManager';
import { badgeCounterService } from '../../services/notifications/BadgeCounterService';
import { ProtectedComponent } from '../../components/common/ProtectedComponent';
import ConnectedBadge from '../../components/common/ConnectedBadge';
import { Avatar } from '../../components/common/Avatar';
import { centersService } from '../../services/centers';
import { weatherService, WeatherData } from '../../services/weather';
import { geocodingService } from '../../services/geocoding';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { EvacuationCenter } from '../../types/models';
import { MainTabParamList } from '../../types/navigation';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { formatDistance } from '../../utils/formatting';
import { 
  MapPin, 
  Bell, 
  AlertTriangle, 
  Building2, 
  Phone, 
  User, 
  ChevronRight,
  BookOpen,
  FileText,
  Users,
  Shield,
  Sparkles,
  BarChart3,
  Settings,
  Clock
} from 'lucide-react-native';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { alerts, fetchAlerts } = useAlerts();
  const { location, requestPermission, hasPermission } = useLocation();
  const { hasPermission: hasNotificationPermission, requestPermission: requestNotificationPermission } = useNotifications();
  const { updateBadgeCount } = useBadgeCounter();
  const [nearestCenter, setNearestCenter] = useState<EvacuationCenter | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationName, setLocationName] = useState<string>('Fetching location...');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [alertUpdateTrigger, setAlertUpdateTrigger] = useState(0);

  // Listen for real-time alert updates via WebSocket
  useEffect(() => {
    console.log('🏠 [HomeScreen] Setting up WebSocket listener for new alerts');
    
    const unsubscribe = websocketService.on('new_alert', (data) => {
      console.log('🏠 [HomeScreen] Received new alert via WebSocket:', data);
      // Trigger re-render by updating state
      setAlertUpdateTrigger(prev => prev + 1);
    });

    return () => {
      console.log('🏠 [HomeScreen] Cleaning up WebSocket listener');
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reverse geocode location to get address and fetch weather
  useEffect(() => {
    if (location) {
      reverseGeocode(location.latitude, location.longitude);
      fetchWeather(location.latitude, location.longitude);
    }
  }, [location]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const result = await geocodingService.reverseGeocode(lat, lng);
      if (result) {
        const shortAddress = geocodingService.formatShortAddress(result.address);
        setLocationName(shortAddress);
      } else {
        setLocationName(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setLocationName('Location unavailable');
    }
  };

  const fetchWeather = async (lat: number, lng: number) => {
    try {
      setIsLoadingWeather(true);
      const weatherData = await weatherService.getLocationWeather(lat, lng);
      setWeather(weatherData);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeather(null);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    if (location) {
      loadNearestCenter();
    }
  }, [location]);

  const loadNearestCenter = async () => {
    if (!location) return;
    
    try {
      const centers = await centersService.getNearby({
        lat: location.latitude,
        lng: location.longitude,
        radius: 50,
      });
      if (centers.length > 0) {
        setNearestCenter(centers[0]);
      }
    } catch (error) {
      console.error('Error loading nearest center:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNearestCenter();
    if (location) {
      await fetchWeather(location.latitude, location.longitude);
    }
    setIsRefreshing(false);
  };

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const alertTime = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(alertTime.getTime())) {
      return 'Unknown time';
    }
    
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // For older dates, show the actual date
    return alertTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter critical alerts by location and sort by time
  const criticalAlerts = alerts
    .filter(a => a.severity === 'critical')
    .filter(a => {
      // If alert has location data and user has location
      if (a.latitude && a.longitude && location) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          a.latitude,
          a.longitude
        );
        // Show alerts within radius (alert's radiusKm or default 100km)
        const alertRadius = a.radiusKm || 100;
        return distance <= alertRadius;
      }
      // If no location data, show all critical alerts (fallback)
      return true;
    })
    .sort((a, b) => {
      // Sort by most recent first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const activeAlerts = alerts.filter(a => a.isActive);

  // Update home cards badge count based on critical alerts
  useEffect(() => {
    updateBadgeCount('home_cards', criticalAlerts.length);
  }, [criticalAlerts.length]); // Remove updateBadgeCount from dependencies

  // Format date and time
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* Enhanced Date, Time, Location & Weather Widget */}
      <View style={styles.dateTimeLocationCard}>
        {/* Welcome Message */}
        <View style={styles.welcomeInWidget}>
          <Avatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            size="medium"
            style={styles.welcomeAvatar}
          />
          <View style={styles.welcomeTextSmall}>
            <Text style={styles.greetingSmall}>Hello, {user?.firstName}! 👋</Text>
            <View style={styles.subtitleRowSmall}>
              <Sparkles color={COLORS.primary} size={14} strokeWidth={2} />
              <Text style={styles.subtitleSmall}>Stay safe and informed</Text>
            </View>
          </View>
        </View>

        {/* Date & Time Section */}
        <View style={styles.dateTimeSection}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
        </View>
        
        {/* Location & Weather Section */}
        {location && (
          <View style={styles.locationWeatherSection}>
            {/* Location */}
            <View style={styles.locationSection}>
              <View style={styles.locationHeader}>
                <MapPin color={COLORS.primary} size={18} strokeWidth={2.5} />
                <Text style={styles.locationLabel}>Current Location</Text>
              </View>
              <Text style={styles.locationText} numberOfLines={2}>
                {locationName}
              </Text>
              <View style={styles.coordinatesRow}>
                <Text style={styles.coordinatesText}>
                  {location.latitude.toFixed(6)}°N, {location.longitude.toFixed(6)}°E
                </Text>
              </View>
            </View>

            {/* Weather */}
            {weather && !isLoadingWeather && (
              <View style={styles.weatherSection}>
                <View style={styles.weatherHeader}>
                  <Text style={styles.weatherIcon}>{weather.weatherIcon}</Text>
                  <View style={styles.weatherInfo}>
                    <Text style={styles.weatherTemp}>{Math.round(weather.temperature)}°C</Text>
                    <Text style={styles.weatherDesc}>{weather.weatherDescription}</Text>
                  </View>
                </View>
                <View style={styles.weatherDetails}>
                  <View style={styles.weatherDetailItem}>
                    <Text style={styles.weatherDetailLabel}>Feels like</Text>
                    <Text style={styles.weatherDetailValue}>{Math.round(weather.apparentTemperature)}°C</Text>
                  </View>
                  <View style={styles.weatherDetailItem}>
                    <Text style={styles.weatherDetailLabel}>Humidity</Text>
                    <Text style={styles.weatherDetailValue}>{weather.humidity}%</Text>
                  </View>
                  <View style={styles.weatherDetailItem}>
                    <Text style={styles.weatherDetailLabel}>Wind</Text>
                    <Text style={styles.weatherDetailValue}>{Math.round(weather.windSpeed)} km/h</Text>
                  </View>
                </View>
              </View>
            )}

            {isLoadingWeather && (
              <View style={styles.weatherLoading}>
                <Text style={styles.weatherLoadingText}>Loading weather...</Text>
              </View>
            )}
          </View>
        )}
        
        {!location && (
          <TouchableOpacity 
            style={styles.locationDisabled}
            onPress={requestPermission}
          >
            <MapPin color={COLORS.textSecondary} size={18} strokeWidth={2} />
            <Text style={styles.locationDisabledText}>
              Enable location to see your current position and weather
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Location Permission */}
      {!hasPermission && (
        <TouchableOpacity style={styles.permissionCard} onPress={requestPermission}>
          <View style={styles.permissionIconContainer}>
            <MapPin color={COLORS.primary} size={24} strokeWidth={2} />
          </View>
          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>Enable Location</Text>
            <Text style={styles.permissionSubtitle}>Get alerts and centers near you</Text>
          </View>
          <ChevronRight color={COLORS.textSecondary} size={20} />
        </TouchableOpacity>
      )}

      {/* Notification Permission */}
      {/* {!hasNotificationPermission && (
        <TouchableOpacity style={styles.permissionCard} onPress={requestNotificationPermission}>
          <View style={styles.permissionIconContainer}>
            <Bell color={COLORS.primary} size={24} strokeWidth={2} />
          </View>
          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>Enable Notifications</Text>
            <Text style={styles.permissionSubtitle}>Get instant disaster alerts</Text>
          </View>
          <ChevronRight color={COLORS.textSecondary} size={20} />
        </TouchableOpacity>
      )} */}

      {/* Critical Alerts - Modern Card Design */}
      <View style={styles.criticalSection}>
        <View style={styles.criticalSectionHeader}>
          <View style={styles.criticalHeaderLeft}>
            <View style={styles.criticalIconBadge}>
              <AlertTriangle color={COLORS.error} size={20} strokeWidth={2.5} />
              {/* <ConnectedBadge 
                location="home_cards"
                size="small"
                position="top-right"re
              /> */}
            </View>
            <Text style={styles.criticalSectionTitle}>Critical Alerts</Text>
          </View>
          {/* {criticalAlerts.length > 0 && (
            <View style={styles.criticalCountBadge}>
              <Text style={styles.criticalCountText}>{criticalAlerts.length}</Text>
            </View>
          )} */}
        </View>

        {criticalAlerts.length > 0 ? (
          <View style={styles.criticalAlertsContainer}>
            {criticalAlerts.slice(0, 2).map((alert, index) => {
              // Calculate distance if location available
              let distance: number | null = null;
              if (alert.latitude && alert.longitude && location) {
                distance = calculateDistance(
                  location.latitude,
                  location.longitude,
                  alert.latitude,
                  alert.longitude
                );
              }

              // Format time ago
              const timeAgo = formatTimeAgo(alert.startTime || alert.createdAt);

              return (
                <TouchableOpacity
                  key={`${alert.id}-${alert.alertType}-${index}`}
                  style={styles.criticalAlertCard}
                  onPress={() => navigation.navigate('Alerts', {
                    screen: 'AlertDetails',
                    params: { alertId: alert.id }
                  })}
                >
                  {/* Alert Type Badge */}
                  <View style={styles.alertTypeBadge}>
                    <Text style={styles.alertTypeBadgeText}>
                      {alert.alertType?.toUpperCase()}
                    </Text>
                  </View>

                  {/* Alert Content */}
                  <View style={styles.criticalAlertContent}>
                    <View style={styles.criticalAlertHeader}>
                      <Text style={styles.criticalAlertTitle} numberOfLines={2}>
                        {alert.title}
                      </Text>
                    </View>
                    
                    {/* Meta Information */}
                    <View style={styles.criticalAlertMeta}>
                      <View style={styles.metaItem}>
                        <Clock color={COLORS.textSecondary} size={14} strokeWidth={2} />
                        <Text style={styles.metaText}>{timeAgo}</Text>
                      </View>
                      
                      {distance !== null && (
                        <View style={styles.metaItem}>
                          <MapPin color={COLORS.textSecondary} size={14} strokeWidth={2} />
                          <Text style={styles.metaText}>{distance.toFixed(1)} km away</Text>
                        </View>
                      )}
                    </View>

                    {/* Debug: Show start_time timestamp */}
                    <View style={styles.debugTimestamp}>
                      <Text style={styles.debugTimestampText}>
                        Start: {new Date(alert.startTime || alert.createdAt).toLocaleString('en-PH', { 
                          timeZone: 'Asia/Manila',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </Text>
                    </View>

                    {/* Affected Areas */}
                    {alert.affectedAreas && alert.affectedAreas.length > 0 && (
                      <View style={styles.affectedAreasContainer}>
                        <Text style={styles.affectedAreasLabel}>Affected areas:</Text>
                        <Text style={styles.affectedAreasText} numberOfLines={1}>
                          {alert.affectedAreas.join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Severity Indicator */}
                  <View style={styles.severityIndicator} />
                </TouchableOpacity>
              );
            })}

            {criticalAlerts.length > 2 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('Alerts')}
              >
                <Text style={styles.viewAllText}>
                  View all {criticalAlerts.length} critical alerts
                </Text>
                <ChevronRight color={COLORS.primary} size={18} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.noCriticalAlerts}>
            <View style={styles.noAlertsIconContainer}>
              <Shield color={COLORS.success} size={40} strokeWidth={2} />
            </View>
            <Text style={styles.noAlertsTitle}>All Clear!</Text>
            <Text style={styles.noAlertsSubtitle}>
              No critical alerts in your area at the moment
            </Text>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={[styles.statCard, styles.statCardAlert]}
          onPress={() => navigation.navigate('Alerts')}
        >
          <View style={styles.statIconContainer}>
            <AlertTriangle color={COLORS.white} size={28} strokeWidth={2.5} />
          </View>
          <Text style={styles.statNumber}>{activeAlerts.length}</Text>
          <Text style={styles.statLabel}>Active Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, styles.statCardCenter]}
          onPress={() => navigation.navigate('Centers')}
        >
          <View style={styles.statIconContainer}>
            <Building2 color={COLORS.white} size={28} strokeWidth={2.5} />
          </View>
          <Text style={styles.statNumber}>{nearestCenter ? '1' : '0'}</Text>
          <Text style={styles.statLabel}>Nearest Center</Text>
        </TouchableOpacity>
      </View>

      {/* Nearest Evacuation Center */}
      {nearestCenter && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearest Evacuation Center</Text>
          <TouchableOpacity
            style={styles.centerCard}
            onPress={() => navigation.navigate('Centers')}
          >
            <View style={styles.centerHeader}>
              <View style={styles.centerIconContainer}>
                <Building2 color={COLORS.primary} size={24} strokeWidth={2} />
              </View>
              <View style={styles.centerInfo}>
                <Text style={styles.centerName} numberOfLines={1}>
                  {nearestCenter.name}
                </Text>
                <Text style={styles.centerAddress} numberOfLines={1}>
                  {nearestCenter.city}, {nearestCenter.province}
                </Text>
              </View>
            </View>
            {nearestCenter.distance !== undefined && (
              <View style={styles.centerDistance}>
                <Text style={styles.distanceText}>{formatDistance(nearestCenter.distance)}</Text>
              </View>
            )}
            <View style={styles.centerCapacity}>
              <Text style={styles.capacityText}>
                {nearestCenter.currentOccupancy} / {nearestCenter.capacity} occupied
              </Text>
              <View style={styles.capacityBar}>
                <View
                  style={[
                    styles.capacityFill,
                    { width: `${nearestCenter.occupancyPercentage}%` },
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Alerts')}
          >
            <View style={styles.actionIconContainer}>
              <AlertTriangle color={COLORS.primary} size={28} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>View Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Centers')}
          >
            <View style={styles.actionIconContainer}>
              <Building2 color={COLORS.primary} size={28} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Find Centers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile', { screen: 'ProfileMain' })}
          >
            <View style={styles.actionIconContainer}>
              <BookOpen color={COLORS.primary} size={28} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Guides</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile', { screen: 'ProfileMain' })}
          >
            <View style={styles.actionIconContainer}>
              <FileText color={COLORS.primary} size={28} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Report Incident</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile', { screen: 'ProfileMain' })}
          >
            <View style={styles.actionIconContainer}>
              <Phone color={COLORS.primary} size={28} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile', { screen: 'ProfileMain' })}
          >
            <View style={styles.actionIconContainer}>
              <Users color={COLORS.primary} size={28} strokeWidth={2} />
            </View>
            <Text style={styles.actionLabel}>Family Locator</Text>
          </TouchableOpacity>

          {/* Admin/MDRRMO Only - Analytics */}
          <ProtectedComponent requiredRole={['super_admin', 'admin', 'mdrrmo']}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                // Navigate to analytics (placeholder)
                console.log('Navigate to analytics');
              }}
            >
              <View style={styles.actionIconContainer}>
                <BarChart3 color={COLORS.primary} size={28} strokeWidth={2} />
              </View>
              <Text style={styles.actionLabel}>Analytics</Text>
            </TouchableOpacity>
          </ProtectedComponent>

          {/* Super Admin Only - System Settings */}
          <ProtectedComponent requiredRole={['super_admin']}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                // Navigate to system settings (placeholder)
                console.log('Navigate to system settings');
              }}
            >
              <View style={styles.actionIconContainer}>
                <Settings color={COLORS.primary} size={28} strokeWidth={2} />
              </View>
              <Text style={styles.actionLabel}>Settings</Text>
            </TouchableOpacity>
          </ProtectedComponent>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  dateTimeLocationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 20,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  welcomeInWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: SPACING.md,
  },
  welcomeAvatar: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  welcomeTextSmall: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingSmall: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  subtitleRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtitleSmall: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    lineHeight: 18,
  },
  dateTimeSection: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeContainer: {
    marginBottom: SPACING.xs,
  },
  timeText: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  locationWeatherSection: {
    marginTop: SPACING.xs,
  },
  locationSection: {
    marginBottom: SPACING.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  locationLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  locationText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordinatesText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  locationDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: SPACING.xs,
  },
  locationDisabledText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  weatherSection: {
    backgroundColor: '#F0F9FF',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: SPACING.md,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  weatherDesc: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    textTransform: 'capitalize',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  weatherDetailItem: {
    alignItems: 'center',
  },
  weatherDetailLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  weatherDetailValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  weatherLoading: {
    backgroundColor: '#F9FAFB',
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  weatherLoadingText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  welcomeSection: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  permissionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  permissionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  criticalSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  criticalSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  criticalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  criticalIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  criticalSectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
  },
  criticalCountBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  criticalCountText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  criticalAlertsContainer: {
    gap: SPACING.sm,
  },
  criticalAlertCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    position: 'relative',
  },
  alertTypeBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  alertTypeBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.error,
  },
  criticalAlertContent: {
    paddingRight: 80,
  },
  criticalAlertHeader: {
    marginBottom: SPACING.sm,
  },
  criticalAlertTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    lineHeight: 20,
  },
  criticalAlertMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  affectedAreasContainer: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  affectedAreasLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 2,
  },
  affectedAreasText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  debugTimestamp: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  debugTimestampText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  severityIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    marginTop: SPACING.md,
    marginRight: SPACING.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: SPACING.xs,
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  noCriticalAlerts: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  noAlertsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  noAlertsTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  noAlertsSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardAlert: {
    backgroundColor: COLORS.error,
  },
  statCardCenter: {
    backgroundColor: COLORS.primary,
  },
  statIconContainer: {
    marginBottom: SPACING.sm,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  centerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  centerHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  centerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
  },
  centerAddress: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  centerDistance: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  centerCapacity: {
    marginTop: SPACING.sm,
  },
  capacityText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  capacityBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    width: '30%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 16,
  },
});
