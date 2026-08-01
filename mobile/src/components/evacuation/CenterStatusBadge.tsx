// Center Status Badge Component
// Color-coded badge showing evacuation center availability

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CenterStatusBadgeProps {
  statusLevel: 'available' | 'limited' | 'critical' | 'full';
  availableSlots: number;
  size?: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG = {
  available: {
    color: '#10B981',
    bgColor: '#D1FAE5',
    text: 'Available',
    icon: '✓',
  },
  limited: {
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    text: 'Limited',
    icon: '⚠',
  },
  critical: {
    color: '#EF4444',
    bgColor: '#FEE2E2',
    text: 'Critical',
    icon: '!',
  },
  full: {
    color: '#6B7280',
    bgColor: '#F3F4F6',
    text: 'Full',
    icon: '✕',
  },
};

export const CenterStatusBadge: React.FC<CenterStatusBadgeProps> = ({
  statusLevel,
  availableSlots,
  size = 'medium',
}) => {
  const config = STATUS_CONFIG[statusLevel];

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      text: styles.textSmall,
      slots: styles.slotsSmall,
    },
    medium: {
      container: styles.containerMedium,
      text: styles.textMedium,
      slots: styles.slotsMedium,
    },
    large: {
      container: styles.containerLarge,
      text: styles.textLarge,
      slots: styles.slotsLarge,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        currentSize.container,
        { backgroundColor: config.bgColor, borderColor: config.color },
      ]}
    >
      <Text style={[styles.icon, { color: config.color }]}>
        {config.icon}
      </Text>
      <View style={styles.textContainer}>
        <Text style={[styles.statusText, currentSize.text, { color: config.color }]}>
          {config.text}
        </Text>
        <Text style={[styles.slotsText, currentSize.slots]}>
          {availableSlots} {availableSlots === 1 ? 'slot' : 'slots'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  containerLarge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  icon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  textContainer: {
    flexDirection: 'column',
  },
  statusText: {
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
  slotsText: {
    color: '#6B7280',
    marginTop: 2,
  },
  slotsSmall: {
    fontSize: 10,
  },
  slotsMedium: {
    fontSize: 12,
  },
  slotsLarge: {
    fontSize: 14,
  },
});

export default CenterStatusBadge;
