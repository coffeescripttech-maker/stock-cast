// Reservation Countdown Timer Component
// Shows time remaining for reservation with visual warning

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import reservationService from '../../services/reservation';

interface ReservationCountdownProps {
  expiresAt: string;
  onExpired?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const ReservationCountdown: React.FC<ReservationCountdownProps> = ({
  expiresAt,
  onExpired,
  size = 'medium',
}) => {
  // Parse the date string to ensure it's valid
  const parseExpiryDate = (dateStr: string): number => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.error('Invalid expiry date:', dateStr);
        return 0;
      }
      return date.getTime();
    } catch (error) {
      console.error('Error parsing expiry date:', error);
      return 0;
    }
  };

  const [timeRemaining, setTimeRemaining] = useState(() => {
    const expiryTime = parseExpiryDate(expiresAt);
    const now = Date.now();
    return Math.max(0, expiryTime - now);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const expiryTime = parseExpiryDate(expiresAt);
      const now = Date.now();
      const remaining = Math.max(0, expiryTime - now);
      
      setTimeRemaining(remaining);

      if (remaining === 0 && onExpired) {
        onExpired();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const isExpiringSoon = timeRemaining > 0 && timeRemaining < 5 * 60 * 1000; // 5 minutes
  const hasExpired = timeRemaining === 0;

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      time: styles.timeSmall,
      label: styles.labelSmall,
    },
    medium: {
      container: styles.containerMedium,
      time: styles.timeMedium,
      label: styles.labelMedium,
    },
    large: {
      container: styles.containerLarge,
      time: styles.timeLarge,
      label: styles.labelLarge,
    },
  };

  const currentSize = sizeStyles[size];

  const getColor = () => {
    if (hasExpired) return '#6B7280';
    if (isExpiringSoon) return '#EF4444';
    return '#10B981';
  };

  const getBgColor = () => {
    if (hasExpired) return '#F3F4F6';
    if (isExpiringSoon) return '#FEE2E2';
    return '#D1FAE5';
  };

  return (
    <View
      style={[
        styles.container,
        currentSize.container,
        {
          backgroundColor: getBgColor(),
          borderColor: getColor(),
        },
      ]}
    >
      <Text style={[styles.icon, { color: getColor() }]}>
        {hasExpired ? '⏱' : isExpiringSoon ? '⚠' : '⏰'}
      </Text>
      <View style={styles.textContainer}>
        <Text style={[styles.timeText, currentSize.time, { color: getColor() }]}>
          {hasExpired
            ? 'Expired'
            : `${minutes}:${seconds.toString().padStart(2, '0')}`}
        </Text>
        <Text style={[styles.labelText, currentSize.label]}>
          {hasExpired ? 'Reservation expired' : 'Time remaining'}
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
    fontSize: 20,
    marginRight: 8,
  },
  textContainer: {
    flexDirection: 'column',
  },
  timeText: {
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  timeSmall: {
    fontSize: 14,
  },
  timeMedium: {
    fontSize: 18,
  },
  timeLarge: {
    fontSize: 24,
  },
  labelText: {
    color: '#6B7280',
    marginTop: 2,
  },
  labelSmall: {
    fontSize: 10,
  },
  labelMedium: {
    fontSize: 12,
  },
  labelLarge: {
    fontSize: 14,
  },
});

export default ReservationCountdown;
