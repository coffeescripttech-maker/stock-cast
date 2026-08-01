import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import api from '../../services/api';

export const EditProfileScreen: React.FC = ({ navigation }: any) => {
  const { user, profile, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    province: profile?.province || '',
    barangay: profile?.barangay || '',
    bloodType: profile?.bloodType || '',
    emergencyContactName: profile?.emergencyContactName || '',
    emergencyContactPhone: profile?.emergencyContactPhone || '',
    medicalConditions: profile?.medicalConditions || '',
  });

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await api.put('/auth/profile', formData);
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Input label="First Name" value={formData.firstName} onChangeText={(text) => setFormData({ ...formData, firstName: text })} placeholder="Enter first name" />
        <Input label="Last Name" value={formData.lastName} onChangeText={(text) => setFormData({ ...formData, lastName: text })} placeholder="Enter last name" />
        <Input label="Phone" value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} placeholder="09XXXXXXXXX" keyboardType="phone-pad" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <Input label="Street Address" value={formData.address} onChangeText={(text) => setFormData({ ...formData, address: text })} placeholder="Enter street address" multiline />
        <Input label="Barangay" value={formData.barangay} onChangeText={(text) => setFormData({ ...formData, barangay: text })} placeholder="Enter barangay" />
        <Input label="City" value={formData.city} onChangeText={(text) => setFormData({ ...formData, city: text })} placeholder="Enter city" />
        <Input label="Province" value={formData.province} onChangeText={(text) => setFormData({ ...formData, province: text })} placeholder="Enter province" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        <Input label="Blood Type" value={formData.bloodType} onChangeText={(text) => setFormData({ ...formData, bloodType: text })} placeholder="e.g., O+, A-, B+" />
        <Input label="Medical Conditions" value={formData.medicalConditions} onChangeText={(text) => setFormData({ ...formData, medicalConditions: text })} placeholder="List any medical conditions" multiline />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        <Input label="Contact Name" value={formData.emergencyContactName} onChangeText={(text) => setFormData({ ...formData, emergencyContactName: text })} placeholder="Enter contact name" />
        <Input label="Contact Phone" value={formData.emergencyContactPhone} onChangeText={(text) => setFormData({ ...formData, emergencyContactPhone: text })} placeholder="09XXXXXXXXX" keyboardType="phone-pad" />
      </View>

      <View style={styles.section}>
        <Button title={loading ? 'Updating...' : 'Update Profile'} onPress={handleUpdate} disabled={loading} fullWidth />
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="secondary" fullWidth />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { padding: SPACING.md },
  sectionTitle: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold, color: COLORS.text, marginBottom: SPACING.md },
});
