import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert as RNAlert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { format } from 'date-fns';

import { DisasterAlert } from '../../types/models';
import { AlertsStackParamList } from '../../types/navigation';
import { alertsService } from '../../services/alerts';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { Loading } from '../../components/common/Loading';

type RouteProps = RouteProp<AlertsStackParamList, 'AlertDetails'>;

export const AlertDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { alertId } = route.params;

  const [alert, setAlert] = useState<DisasterAlert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlert();
  }, [alertId]);

  const loadAlert = async () => {
    try {
      setLoading(true);
      console.log('Loading alert with ID:', alertId);
      
      if (!alertId || alertId === 0) {
        throw new Error('Invalid alert ID');
      }
      
      const data = await alertsService.getAlertById(alertId);
      console.log('Loaded alert data:', data);
      
      if (!data) {
        throw new Error('Alert not found or invalid data received');
      }
      
      // Additional validation
      if (!data.title || !data.alertType) {
        throw new Error('Alert data is incomplete');
      }
      
      setAlert(data);
    } catch (error: any) {
      console.error('Error loading alert:', error);
      RNAlert.alert(
        'Error', 
        error.message || 'Failed to load alert details. The alert may have been deleted or is unavailable.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading alert details..." />;
  }

  if (!alert) {
    console.error('Alert is null or undefined');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>⚠️</Text>
        <Text style={{ fontSize: 16, textAlign: 'center' }}>
          Unable to load alert details
        </Text>
      </View>
    );
  }

  // Validate critical fields
  if (!alert.title || !alert.alertType) {
    console.error('Alert missing critical fields:', alert);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>⚠️</Text>
        <Text style={{ fontSize: 16, textAlign: 'center' }}>
          Alert data is incomplete
        </Text>
      </View>
    );
  }

  console.log('Rendering alert:', {
    id: alert.id,
    title: alert.title,
    alertType: alert.alertType,
    severity: alert.severity,
    hasLatitude: !!alert.latitude,
    hasLongitude: !!alert.longitude,
  });

  const getSeverityColor = (severity?: string): string => {
    try {
      if (!severity) return '#6B7280';
      switch (severity.toLowerCase()) {
        case 'critical':
          return '#DC2626';
        case 'high':
          return '#F59E0B';
        case 'moderate':
          return '#3B82F6';
        case 'low':
          return '#10B981';
        default:
          return '#6B7280';
      }
    } catch (error) {
      console.error('Error in getSeverityColor:', error);
      return '#6B7280';
    }
  };

  const getAlertIcon = (type?: string): string => {
    try {
      if (!type) return 'alert-circle';
      switch (type.toLowerCase()) {
        case 'typhoon':
          return 'thunderstorm';
        case 'earthquake':
          return 'pulse';
        case 'flood':
          return 'water';
        case 'fire':
          return 'flame';
        case 'tsunami':
          return 'boat';
        case 'landslide':
          return 'warning';
        default:
          return 'alert-circle';
      }
    } catch (error) {
      console.error('Error in getAlertIcon:', error);
      return 'alert-circle';
    }
  };

  let severityColor = '#6B7280';
  try {
    severityColor = getSeverityColor(alert.severity);
    console.log('✅ Severity color:', severityColor);
  } catch (error) {
    console.error('❌ Error getting severity color:', error);
  }

  try {
    return (
      <ScrollView style={styles.container}>
      {/* Map with Affected Area */}
      {alert.latitude && alert.longitude && !isNaN(alert.latitude) && !isNaN(alert.longitude) && (
        <View style={styles.mapContainer}>
          {(() => {
            try {
              return (
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: Number(alert.latitude),
                    longitude: Number(alert.longitude),
                    latitudeDelta: alert.radiusKm ? alert.radiusKm / 50 : 0.5,
                    longitudeDelta: alert.radiusKm ? alert.radiusKm / 50 : 0.5,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  {alert.radiusKm && alert.radiusKm > 0 && (
                    <Circle
                      center={{
                        latitude: Number(alert.latitude),
                        longitude: Number(alert.longitude),
                      }}
                      radius={alert.radiusKm * 1000}
                      strokeColor={`${severityColor}80`}
                      fillColor={`${severityColor}20`}
                      strokeWidth={2}
                    />
                  )}
                </MapView>
              );
            } catch (error) {
              console.error('Error rendering map:', error);
              return null;
            }
          })()}
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.typeRow}>
          <View style={[styles.iconContainer, { backgroundColor: `${severityColor}20` }]}>
            <Ionicons
              name={getAlertIcon(alert.alertType) as any}
              size={32}
              color={severityColor}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.alertType}>
              {alert.alertType ? alert.alertType.charAt(0).toUpperCase() + alert.alertType.slice(1) : 'Alert'}
            </Text>
            <View
              style={[styles.severityBadge, { backgroundColor: `${severityColor}20` }]}
            >
              <Text style={[styles.severityText, { color: severityColor }]}>
                {alert.severity ? alert.severity.toUpperCase() : 'UNKNOWN'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.title}>{alert.title || 'No title'}</Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Description</Text>
        </View>
        <Text style={styles.description}>{alert.description || 'No description available'}</Text>
      </View>

      {/* Affected Areas */}
      {alert.affectedAreas && Array.isArray(alert.affectedAreas) && alert.affectedAreas.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Affected Areas</Text>
          </View>
          <View style={styles.areasContainer}>
            {alert.affectedAreas.map((area: string, index: number) => (
              <View key={`area-${index}-${area}`} style={styles.areaChip}>
                <Text style={styles.areaText}>{area || 'Unknown'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Timeline */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Timeline</Text>
        </View>
        {alert.startTime && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Start:</Text>
            <Text style={styles.timelineValue}>
              {(() => {
                try {
                  return format(new Date(alert.startTime), 'MMM dd, yyyy h:mm a');
                } catch (e) {
                  return alert.startTime;
                }
              })()}
            </Text>
          </View>
        )}
        {alert.endTime && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>End:</Text>
            <Text style={styles.timelineValue}>
              {(() => {
                try {
                  return format(new Date(alert.endTime), 'MMM dd, yyyy h:mm a');
                } catch (e) {
                  return alert.endTime;
                }
              })()}
            </Text>
          </View>
        )}
        {alert.createdAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Issued:</Text>
            <Text style={styles.timelineValue}>
              {(() => {
                try {
                  return format(new Date(alert.createdAt), 'MMM dd, yyyy h:mm a');
                } catch (e) {
                  return alert.createdAt;
                }
              })()}
            </Text>
          </View>
        )}
      </View>

      {/* Source */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Source</Text>
        </View>
        <Text style={styles.source}>{alert.source || 'Unknown source'}</Text>
      </View>

      {/* Additional Info */}
      {alert.metadata && typeof alert.metadata === 'object' && Object.keys(alert.metadata).length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Additional Information</Text>
          </View>
          {Object.entries(alert.metadata).map(([key, value]) => (
            <View key={`metadata-${key}`} style={styles.metadataItem}>
              <Text style={styles.metadataKey}>
                {key ? key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Unknown'}:
              </Text>
              <Text style={styles.metadataValue}>{value ? String(value) : 'N/A'}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Status */}
      <View style={styles.section}>
        <View
          style={[
            styles.statusContainer,
            { backgroundColor: alert.isActive ? '#DCFCE7' : '#F3F4F6' },
          ]}
        >
          <Ionicons
            name={alert.isActive ? 'checkmark-circle' : 'close-circle'}
            size={24}
            color={alert.isActive ? '#16A34A' : '#6B7280'}
          />
          <Text
            style={[
              styles.statusText,
              { color: alert.isActive ? '#16A34A' : '#6B7280' },
            ]}
          >
            {alert.isActive ? 'Active Alert' : 'Inactive Alert'}
          </Text>
        </View>
      </View>
    </ScrollView>
    );
  } catch (renderError) {
    console.error('❌ Error rendering alert details:', renderError);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>⚠️</Text>
        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 10 }}>
          Error displaying alert details
        </Text>
        <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
          {renderError instanceof Error ? renderError.message : 'Unknown error'}
        </Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapContainer: {
    height: 250,
    backgroundColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  alertType: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
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
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
  areasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  areaChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  areaText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    width: 80,
  },
  timelineValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  source: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  metadataItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  metadataKey: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    width: 150,
  },
  metadataValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
