// My Reservations Screen
// View and manage user's evacuation center reservations

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import reservationService, { Reservation } from '../../services/reservation';
import ReservationCard from '../../components/evacuation/ReservationCard';

type FilterStatus = 'all' | 'active' | 'past';

export const MyReservationsScreen: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [reservations, filter]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getMyReservations();
      setReservations(data);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
  }, []);

  const applyFilter = () => {
    let filtered = [...reservations];

    if (filter === 'active') {
      filtered = filtered.filter(r => ['pending', 'confirmed'].includes(r.status));
    } else if (filter === 'past') {
      filtered = filtered.filter(r => ['cancelled', 'expired', 'arrived'].includes(r.status));
    }

    setFilteredReservations(filtered);
  };

  const handleCancel = async (reservationId: number) => {
    try {
      await reservationService.cancelReservation(reservationId, 'User cancelled');
      Alert.alert('Success', 'Reservation cancelled successfully');
      await loadReservations();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to cancel reservation');
    }
  };

  const renderFilterButton = (status: FilterStatus, label: string) => {
    const isActive = filter === status;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setFilter(status)}
      >
        <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    let message = 'No reservations found';
    if (filter === 'active') {
      message = 'No active reservations';
    } else if (filter === 'past') {
      message = 'No past reservations';
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>📋</Text>
        <Text style={styles.emptyStateText}>{message}</Text>
        <Text style={styles.emptyStateSubtext}>
          Reserve a slot at an evacuation center to see it here
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading reservations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Reservations</Text>
        <Text style={styles.subtitle}>
          {reservations.length} {reservations.length === 1 ? 'reservation' : 'reservations'}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('active', 'Active')}
        {renderFilterButton('past', 'Past')}
      </View>

      {/* Reservations List */}
      <FlatList
        data={filteredReservations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ReservationCard
            reservation={item}
            onCancel={handleCancel}
            onRefresh={handleRefresh}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default MyReservationsScreen;
