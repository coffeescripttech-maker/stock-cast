// Reservation Card Component
// Displays reservation information with actions

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Reservation } from '../../services/reservation';
import CenterStatusBadge from './CenterStatusBadge';
import ReservationCountdown from './ReservationCountdown';

interface ReservationCardProps {
  reservation: Reservation;
  onCancel: (id: number) => void;
  onRefresh: () => void;
}

const STATUS_CONFIG = {
  pending: {
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    text: 'Pending',
  },
  confirmed: {
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    text: 'Confirmed',
  },
  cancelled: {
    color: '#6B7280',
    bgColor: '#F3F4F6',
    text: 'Cancelled',
  },
  expired: {
    color: '#EF4444',
    bgColor: '#FEE2E2',
    text: 'Expired',
  },
  arrived: {
    color: '#10B981',
    bgColor: '#D1FAE5',
    text: 'Arrived',
  },
};

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onCancel,
  onRefresh,
}) => {
  const statusConfig = STATUS_CONFIG[reservation.status];

  const handleCancel = () => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this reservation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => onCancel(reservation.id),
        },
      ]
    );
  };

  const handleGetDirections = () => {
    if (reservation.centerAddress) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        reservation.centerAddress
      )}`;
      Linking.openURL(url);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const canCancel = ['pending', 'confirmed'].includes(reservation.status);
  const showCountdown = reservation.status === 'pending';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.centerName} numberOfLines={1}>
          {reservation.centerName}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusConfig.bgColor },
          ]}
        >
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.text}
          </Text>
        </View>
      </View>

      {/* Address */}
      {reservation.centerAddress && (
        <Text style={styles.address} numberOfLines={2}>
          📍 {reservation.centerAddress}
        </Text>
      )}

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Group Size:</Text>
          <Text style={styles.detailValue}>
            {reservation.groupSize} {reservation.groupSize === 1 ? 'person' : 'people'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Estimated Arrival:</Text>
          <Text style={styles.detailValue}>
            {formatDate(reservation.estimatedArrival)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reserved:</Text>
          <Text style={styles.detailValue}>
            {formatDate(reservation.reservedAt)}
          </Text>
        </View>

        {reservation.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <Text style={styles.notesText}>{reservation.notes}</Text>
          </View>
        )}

        {reservation.cancellationReason && (
          <View style={styles.notesContainer}>
            <Text style={styles.detailLabel}>Cancellation Reason:</Text>
            <Text style={styles.notesText}>{reservation.cancellationReason}</Text>
          </View>
        )}
      </View>

      {/* Countdown Timer */}
      {showCountdown && (
        <View style={styles.countdownContainer}>
          <ReservationCountdown
            expiresAt={reservation.expiresAt}
            onExpired={onRefresh}
            size="medium"
          />
        </View>
      )}

      {/* Actions */}
      {canCancel && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.directionsButton]}
            onPress={handleGetDirections}
          >
            <Text style={styles.directionsButtonText}>🗺 Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  centerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  notesContainer: {
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 4,
    fontStyle: 'italic',
  },
  countdownContainer: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  directionsButton: {
    backgroundColor: '#3B82F6',
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default ReservationCard;
