// Evacuation Center Card Component

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { EvacuationCenter } from '../../types/models';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { formatDistance } from '../../utils/formatting';

interface CenterCardProps {
  center: EvacuationCenter;
  onPress: () => void;
}

export const CenterCard: React.FC<CenterCardProps> = ({ center, onPress }) => {
  // Safety check
  if (!center) {
    return null;
  }

  const getCapacityColor = () => {
    const occupancy = center.occupancyPercentage || 0;
    if (occupancy >= 90) return COLORS.error;
    if (occupancy >= 70) return COLORS.warning;
    return COLORS.success;
  };

  const handleCall = () => {
    if (center.contactNumber) {
      Linking.openURL(`tel:${center.contactNumber}`);
    }
  };

  const handleDirections = () => {
    if (center.latitude && center.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`;
      Linking.openURL(url);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>🏢</Text>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={2}>{center.name || 'Unnamed Center'}</Text>
            {center.barangay && (
              <View style={styles.barangayBadge}>
                <Text style={styles.barangayIcon}>📍</Text>
                <Text style={styles.barangayText}>Brgy. {center.barangay}</Text>
              </View>
            )}
            <Text style={styles.address} numberOfLines={1}>
              {center.city || 'Unknown'}, {center.province || 'Unknown'}
            </Text>
          </View>
        </View>
        {center.distance !== undefined && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{formatDistance(center.distance)}</Text>
          </View>
        )}
      </View>

      {/* Capacity Bar */}
      <View style={styles.capacitySection}>
        <View style={styles.capacityHeader}>
          <Text style={styles.capacityLabel}>Capacity</Text>
          <Text style={styles.capacityValue}>
            {center.currentOccupancy || 0} / {center.capacity || 0}
          </Text>
        </View>
        <View style={styles.capacityBarContainer}>
          <View
            style={[
              styles.capacityBarFill,
              {
                width: `${center.occupancyPercentage || 0}%`,
                backgroundColor: getCapacityColor(),
              },
            ]}
          />
        </View>
        <Text style={[styles.capacityPercent, { color: getCapacityColor() }]}>
          {center.occupancyPercentage || 0}% occupied
          {center.isFull && ' • FULL'}
        </Text>
      </View>

      {/* Facilities */}
      {center.facilities && Array.isArray(center.facilities) && center.facilities.length > 0 && (
        <View style={styles.facilities}>
          {center.facilities.slice(0, 4).map((facility, index) => (
            <View key={`${facility}-${index}`} style={styles.facilityChip}>
              <Text style={styles.facilityText}>{facility || 'Unknown'}</Text>
            </View>
          ))}
          {center.facilities.length > 4 && (
            <Text style={styles.moreText}>+{center.facilities.length - 4} more</Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {center.contactNumber && (
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.borderRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  icon: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  barangayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  barangayIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  barangayText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#1E40AF',
  },
  address: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  distanceBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  capacitySection: {
    marginBottom: SPACING.md,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  capacityLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  capacityValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  capacityBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  capacityPercent: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  facilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  facilityChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  facilityText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text,
  },
  moreText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    alignSelf: 'center',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: SPACING.xs,
  },
  actionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
