// Contacts List Screen

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, RefreshControl, Linking, TouchableOpacity } from 'react-native';
import { Loading } from '../../components/common/Loading';
import { contactsService } from '../../services/contacts';
import { useNetwork } from '../../store/NetworkContext';
import { cacheService, CACHE_KEYS, CACHE_EXPIRY } from '../../services/cache';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { EmergencyContact, GroupedContacts } from '../../types/models';
import { MainTabParamList } from '../../types/navigation';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { formatPhoneNumber } from '../../utils/formatting';

type Props = BottomTabScreenProps<MainTabParamList, 'Contacts'>;

export const ContactsListScreen: React.FC<Props> = ({ navigation }) => {
  const { isOnline } = useNetwork();
  const [contacts, setContacts] = useState<GroupedContacts>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadLastUpdate = async () => {
    const timestamp = await cacheService.getTimestamp(CACHE_KEYS.CONTACTS);
    if (timestamp) {
      const minutes = Math.floor((Date.now() - timestamp) / 60000);
      if (minutes < 1) {
        setLastUpdate('Just now');
      } else if (minutes < 60) {
        setLastUpdate(`${minutes}m ago`);
      } else {
        const hours = Math.floor(minutes / 60);
        setLastUpdate(`${hours}h ago`);
      }
    }
  };

  const loadContacts = async () => {
    console.log('🔄 loadContacts called');
    
    // Load from cache first (for instant display)
    const cached = await cacheService.get<GroupedContacts>(CACHE_KEYS.CONTACTS);
    if (cached) {
      console.log('💾 Loaded from cache:', Object.keys(cached));
      setContacts(cached);
      await loadLastUpdate();
    }

    // If offline, use cached data only
    if (!isOnline) {
      console.log('📡 Offline - using cached data only');
      setIsLoading(false);
      if (!cached) {
        setError('No cached data available. Connect to internet to fetch contacts.');
      }
      return;
    }

    console.log('🌐 Online - fetching fresh data from API');
    setIsLoading(true);
    setError(null);
    
    try {
      // Clear old cache before fetching to ensure fresh data
      await cacheService.remove(CACHE_KEYS.CONTACTS);
      console.log('🗑️ Cleared old cache');
      
      const data = await contactsService.getContacts();
      console.log('✅ Received contacts data:', Object.keys(data));
      console.log('📊 Total categories:', Object.keys(data).length);
      Object.entries(data).forEach(([category, items]) => {
        console.log(`  - ${category}: ${items.length} contacts`);
        if (items.length > 0) {
          console.log(`    First contact phone: ${items[0].phone}`);
        }
      });
      
      // Update state with fresh data (this will trigger re-render)
      setContacts(data);
      
      // Cache the fresh data for offline use
      await cacheService.set(CACHE_KEYS.CONTACTS, data, CACHE_EXPIRY.CONTACTS);
      console.log('💾 Cached fresh contacts for offline use');
      await loadLastUpdate();
    } catch (err) {
      console.error('❌ Error loading contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const renderContact = ({ item }: { item: EmergencyContact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.isNational && (
          <View style={styles.nationalBadge}>
            <Text style={styles.nationalText}>NATIONAL</Text>
          </View>
        )}
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactPhone}>📞 {formatPhoneNumber(item.phone)}</Text>
        {item.alternatePhone && (
          <Text style={styles.contactPhone}>📞 {formatPhoneNumber(item.alternatePhone)}</Text>
        )}
        {item.email && <Text style={styles.contactEmail}>✉️ {item.email}</Text>}
        {item.address && <Text style={styles.contactAddress}>📍 {item.address}</Text>}
      </View>

      <View style={styles.contactActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCall(item.phone)}
        >
          <Text style={styles.actionIcon}>📞</Text>
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSMS(item.phone)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>SMS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const sections = Object.entries(contacts).map(([category, items]) => ({
    title: category,
    data: items,
  }));

  console.log('📱 Rendering sections:', sections.length);
  sections.forEach(section => {
    console.log(`  - ${section.title}: ${section.data.length} items`);
  });

  if (isLoading && sections.length === 0) {
    return <Loading fullScreen message="Loading contacts..." />;
  }

  if (error && sections.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadContacts} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isLoading && sections.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📞 No emergency contacts available</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Offline/Last Update Indicator */}
      {!isOnline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>📡 Offline - Showing cached data</Text>
        </View>
      )}
      {isOnline && lastUpdate && (
        <View style={styles.updateIndicator}>
          <Text style={styles.updateText}>🕐 Last updated {lastUpdate}</Text>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderContact}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadContacts} colors={[COLORS.primary]} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.md,
  },
  sectionHeader: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: SPACING.borderRadius,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  contactCard: {
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
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  contactName: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
  },
  nationalBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  nationalText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
  },
  contactInfo: {
    marginBottom: SPACING.sm,
  },
  contactPhone: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  contactEmail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  contactAddress: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  contactActions: {
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
  offlineIndicator: {
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  updateIndicator: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  updateText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.borderRadius,
  },
  retryText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
