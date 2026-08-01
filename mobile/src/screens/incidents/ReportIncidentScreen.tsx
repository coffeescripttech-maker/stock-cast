import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocation } from '../../store/LocationContext';
import { useNetwork } from '../../store/NetworkContext';
import { incidentService } from '../../services/incidents';
import { offlineQueue } from '../../services/offlineQueue';
import { IncidentType, IncidentSeverity, TargetAgency } from '../../types/incident';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { Button } from '../../components/common/Button';

// Try to load ImagePicker, but don't crash if it's not available
let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
  console.log('✅ ImagePicker loaded');
} catch (error) {
  console.log('⚠️ ImagePicker not available');
}

export const ReportIncidentScreen: React.FC = () => {
  const navigation = useNavigation();
  const { location } = useLocation();
  const { isOnline } = useNetwork();

  const [incidentType, setIncidentType] = useState<IncidentType>('damage');
  const [severity, setSeverity] = useState<IncidentSeverity>('moderate');
  const [selectedAgency, setSelectedAgency] = useState<TargetAgency>('mdrrmo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const incidentTypes = [
    { value: 'damage' as IncidentType, label: 'Property Damage', icon: '🏚️' },
    { value: 'injury' as IncidentType, label: 'Injury/Casualty', icon: '🚑' },
    { value: 'missing_person' as IncidentType, label: 'Missing Person', icon: '🔍' },
    { value: 'hazard' as IncidentType, label: 'Hazard/Danger', icon: '⚠️' },
    { value: 'other' as IncidentType, label: 'Other', icon: '📝' },
  ];

  const severityLevels = [
    { value: 'low' as IncidentSeverity, label: 'Low', color: '#10B981' },
    { value: 'moderate' as IncidentSeverity, label: 'Moderate', color: '#F59E0B' },
    { value: 'high' as IncidentSeverity, label: 'High', color: '#EF4444' },
    { value: 'critical' as IncidentSeverity, label: 'Critical', color: '#7C3AED' },
  ];

  const agencies = [
    { value: 'pnp' as TargetAgency, label: 'PNP', icon: '👮', description: 'Police matters' },
    { value: 'bfp' as TargetAgency, label: 'BFP', icon: '🚒', description: 'Fire & rescue' },
    { value: 'mdrrmo' as TargetAgency, label: 'MDRRMO', icon: '🆘', description: 'Disaster response' },
    { value: 'lgu' as TargetAgency, label: 'LGU', icon: '🏛️', description: 'Local government' },
  ];

  // Auto-suggest agency based on incident type
  const handleIncidentTypeChange = (type: IncidentType) => {
    setIncidentType(type);
    
    // Auto-suggest agency based on incident type
    const agencyMapping: Record<IncidentType, TargetAgency> = {
      damage: 'lgu',
      injury: 'bfp',
      missing_person: 'pnp',
      hazard: 'bfp',
      other: 'mdrrmo',
    };
    
    setSelectedAgency(agencyMapping[type]);
  };

  const pickImage = async () => {
    if (!ImagePicker) {
      Alert.alert('Not Available', 'Photo upload is not available in this build');
      return;
    }

    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload up to 5 photos');
      return;
    }

    const { status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3, // Reduced from 0.7 to 0.3 for smaller file size
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhotos([...photos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description');
      return;
    }
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services');
      return;
    }

    const reportData = {
      incidentType,
      title: title.trim(),
      description: description.trim(),
      latitude: location.latitude,
      longitude: location.longitude,
      address: address.trim() || undefined,
      severity,
      photos: photos.length > 0 ? photos : undefined,
      targetAgency: selectedAgency,
    };

    try {
      setLoading(true);

      if (isOnline) {
        // Submit immediately if online
        await incidentService.createIncident(reportData);

        Alert.alert(
          'Report Submitted',
          'Your incident report has been submitted successfully. Authorities will be notified.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // Queue for later if offline
        await offlineQueue.addToQueue('incident', reportData);

        Alert.alert(
          'Report Saved',
          'You are offline. Your report has been saved and will be submitted automatically when you reconnect.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error submitting incident:', error);
      Alert.alert('Error', error.message || 'Failed to submit incident report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Incident Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Type</Text>
          <View style={styles.typeGrid}>
            {incidentTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeCard,
                  incidentType === type.value && styles.typeCardActive,
                ]}
                onPress={() => handleIncidentTypeChange(type.value)}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    incidentType === type.value && styles.typeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Agency Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report To</Text>
          <View style={styles.agencyRow}>
            {agencies.map((agency) => (
              <TouchableOpacity
                key={agency.value}
                style={[
                  styles.agencyCard,
                  selectedAgency === agency.value && styles.agencyCardActive,
                ]}
                onPress={() => setSelectedAgency(agency.value)}
              >
                <Text style={styles.agencyIcon}>{agency.icon}</Text>
                <Text
                  style={[
                    styles.agencyLabel,
                    selectedAgency === agency.value && styles.agencyLabelActive,
                  ]}
                >
                  {agency.label}
                </Text>
                <Text style={styles.agencyDescription}>{agency.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Severity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity Level</Text>
          <View style={styles.severityRow}>
            {severityLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.severityChip,
                  severity === level.value && {
                    backgroundColor: level.color,
                    borderColor: level.color,
                  },
                ]}
                onPress={() => setSeverity(level.value)}
              >
                <Text
                  style={[
                    styles.severityLabel,
                    severity === level.value && styles.severityLabelActive,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of the incident"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide detailed information about the incident"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Street, Barangay, City"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos (Optional, max 5)</Text>
          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 5 && (
              <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
                <Ionicons name="camera" size={32} color={COLORS.textSecondary} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Location Info */}
        {location && (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.locationText}>
              Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <Button
          title={loading ? 'Submitting...' : 'Submit Report'}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        />

        {loading && <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  typeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  typeLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  agencyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  agencyCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  agencyCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  agencyIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  agencyLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  agencyLabelActive: {
    color: COLORS.primary,
  },
  agencyDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  severityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  severityChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  severityLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  severityLabelActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 120,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  addPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  addPhotoText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  locationText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  loader: {
    marginTop: SPACING.md,
  },
});
