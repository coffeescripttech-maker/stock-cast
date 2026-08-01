import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { incidentService } from '../../services/incidents';
import { IncidentReport } from '../../types/incident';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { format } from 'date-fns';

type RouteParams = {
  IncidentDetails: {
    incidentId: number;
  };
};

const { width } = Dimensions.get('window');

export const IncidentDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'IncidentDetails'>>();
  const { incidentId } = route.params;
  const [incident, setIncident] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncident();
  }, [incidentId]);

  const loadIncident = async () => {
    try {
      const data = await incidentService.getIncidentById(incidentId);
      setIncident(data);
    } catch (error) {
      console.error('Error loading incident:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'damage': return '🏚️';
      case 'injury': return '🚑';
      case 'missing_person': return '🔍';
      case 'hazard': return '⚠️';
      default: return '📝';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#10B981';
      case 'moderate': return '#F59E0B';
      case 'high': return '#EF4444';
      case 'critical': return '#7C3AED';
      default: return COLORS.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'verified': return '#3B82F6';
      case 'in_progress': return '#8B5CF6';
      case 'resolved': return '#10B981';
      default: return COLORS.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Incident not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{getTypeIcon(incident.incidentType)}</Text>
        <Text style={styles.title}>{incident.title}</Text>
        
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: getSeverityColor(incident.severity) }]}>
            <Text style={styles.badgeText}>{incident.severity.toUpperCase()}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getStatusColor(incident.status) }]}>
            <Text style={styles.badgeText}>
              {incident.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{incident.description}</Text>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        {incident.address && (
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{incident.address}</Text>
          </View>
        )}
        {incident.latitude != null && incident.longitude != null && (
          <>
            <View style={styles.infoRow}>
              <Ionicons name="navigate" size={20} color={COLORS.textSecondary} />
              <Text style={styles.infoTextSmall}>
                {Number(incident.latitude).toFixed(6)}, {Number(incident.longitude).toFixed(6)}
              </Text>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={{
                  latitude: Number(incident.latitude),
                  longitude: Number(incident.longitude),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: Number(incident.latitude),
                    longitude: Number(incident.longitude),
                  }}
                  title={incident.title}
                />
              </MapView>
            </View>
          </>
        )}
      </View>

      {/* Photos */}
      {incident.photos && incident.photos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos ({incident.photos.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosContainer}>
              {incident.photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Reporter Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reported By</Text>
        {incident.userName && (
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{incident.userName}</Text>
          </View>
        )}
        {incident.userPhone && (
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{incident.userPhone}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="time" size={20} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            {incident.createdAt ? format(new Date(incident.createdAt), 'MMM dd, yyyy hh:mm a') : 'Unknown date'}
          </Text>
        </View>
      </View>

      {/* Notice */}
      <View style={styles.notice}>
        <Ionicons name="information-circle" size={24} color={COLORS.primary} />
        <Text style={styles.noticeText}>
          This incident has been reported to local authorities. Updates will be provided as the situation develops.
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.error,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  infoTextSmall: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  mapContainer: {
    marginTop: SPACING.md,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  photo: {
    width: width * 0.7,
    height: 200,
    borderRadius: 8,
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    lineHeight: 20,
  },
});
