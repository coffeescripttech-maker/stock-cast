import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Switch, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Battery from 'expo-battery';
import { groupService } from '../../services/groups';
import { GroupMember, GroupAlertType } from '../../types/group';
import { useLocation } from '../../store/LocationContext';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { Button } from '../../components/common/Button';
import { formatDistanceToNow } from 'date-fns';

type RouteParams = {
  GroupMap: {
    groupId: number;
  };
};

export const GroupMapScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'GroupMap'>>();
  const navigation = useNavigation();
  const { groupId } = route.params;
  const { location } = useLocation();
  const mapRef = useRef<MapView>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingEnabled, setSharingEnabled] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState<GroupAlertType>('info');
  const [alertMessage, setAlertMessage] = useState('');
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    loadMembers();
    const interval = setInterval(loadMembers, 10000);
    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    if (sharingEnabled && location) {
      shareLocation();
      const interval = setInterval(shareLocation, 30000);
      return () => clearInterval(interval);
    }
  }, [sharingEnabled, location, groupId]);

  const loadMembers = async () => {
    try {
      const data = await groupService.getGroupMembers(groupId);
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareLocation = async () => {
    if (!location) return;
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      await groupService.shareLocation({
        groupId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        batteryLevel: Math.round(batteryLevel * 100),
      });
    } catch (error) {
      console.error('Error sharing location:', error);
    }
  };

  const handleToggleSharing = async (value: boolean) => {
    setSharingEnabled(value);
    try {
      await groupService.updateMember(groupId, { locationSharingEnabled: value });
    } catch (error) {
      console.error('Error updating sharing:', error);
    }
  };

  const handleSendAlert = async () => {
    if (!alertMessage.trim()) {
      Alert.alert('Required', 'Please enter a message');
      return;
    }
    try {
      setSendingAlert(true);
      await groupService.sendGroupAlert({
        groupId,
        alertType,
        message: alertMessage.trim(),
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      setShowAlertModal(false);
      setAlertMessage('');
      Alert.alert('Alert Sent', 'Your alert has been sent to all group members');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send alert');
    } finally {
      setSendingAlert(false);
    }
  };

  const getMarkerColor = (member: GroupMember) => {
    if (!member.locationUpdatedAt) return '#9CA3AF';
    const minutesAgo = (Date.now() - new Date(member.locationUpdatedAt).getTime()) / 60000;
    if (minutesAgo < 5) return '#10B981';
    if (minutesAgo < 30) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusText = (member: GroupMember) => {
    if (!member.locationUpdatedAt) return 'No location';
    const minutesAgo = (Date.now() - new Date(member.locationUpdatedAt).getTime()) / 60000;
    if (minutesAgo < 5) return 'Active';
    if (minutesAgo < 30) return 'Idle';
    return 'Offline';
  };

  const renderMember = ({ item }: { item: GroupMember }) => (
    <TouchableOpacity style={styles.memberCard}>
      <View style={[styles.statusDot, { backgroundColor: getMarkerColor(item) }]} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.userName}</Text>
        <Text style={styles.memberStatus}>
          {getStatusText(item)}
          {item.locationUpdatedAt && ` • ${formatDistanceToNow(new Date(item.locationUpdatedAt), { addSuffix: true })}`}
        </Text>
      </View>
      {item.batteryLevel != null && (
        <View style={styles.battery}>
          <Ionicons name="battery-half" size={16} color={COLORS.textSecondary} />
          <Text style={styles.batteryText}>{item.batteryLevel}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const initialRegion: Region = location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : {
    latitude: 14.5995,
    longitude: 120.9842,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} provider={PROVIDER_DEFAULT} initialRegion={initialRegion} showsUserLocation showsMyLocationButton>
        {members.map((member) => member.latitude && member.longitude ? (
          <Marker key={member.id} coordinate={{ latitude: member.latitude, longitude: member.longitude }} title={member.userName} description={getStatusText(member)} pinColor={getMarkerColor(member)} />
        ) : null)}
      </MapView>
      <View style={styles.controls}>
        <View style={styles.sharingControl}>
          <View style={styles.sharingInfo}>
            <Ionicons name={sharingEnabled ? 'location' : 'location-outline'} size={24} color={sharingEnabled ? COLORS.success : COLORS.textSecondary} />
            <Text style={styles.sharingText}>{sharingEnabled ? 'Sharing Location' : 'Location Sharing Off'}</Text>
          </View>
          <Switch value={sharingEnabled} onValueChange={handleToggleSharing} trackColor={{ false: '#D1D5DB', true: COLORS.success }} thumbColor={COLORS.white} />
        </View>
        <TouchableOpacity style={styles.alertButton} onPress={() => setShowAlertModal(true)}>
          <Ionicons name="alert-circle" size={24} color={COLORS.white} />
          <Text style={styles.alertButtonText}>Send Alert</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.membersList}>
        <View style={styles.membersHeader}>
          <Text style={styles.membersTitle}>Group Members ({members.length})</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('GroupDetails', { groupId })}>
            <Ionicons name="settings-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <FlatList data={members} keyExtractor={(item) => item.id.toString()} renderItem={renderMember} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersContent} />
      </View>
      <Modal visible={showAlertModal} transparent animationType="slide" onRequestClose={() => setShowAlertModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Alert to Group</Text>
              <TouchableOpacity onPress={() => setShowAlertModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.alertTypes}>
              {[
                { type: 'emergency' as GroupAlertType, label: 'Emergency', icon: '🚨', color: '#EF4444' },
                { type: 'help_needed' as GroupAlertType, label: 'Help Needed', icon: '🆘', color: '#F59E0B' },
                { type: 'safe' as GroupAlertType, label: "I'm Safe", icon: '✅', color: '#10B981' },
                { type: 'info' as GroupAlertType, label: 'Info', icon: 'ℹ️', color: '#3B82F6' },
              ].map((item) => (
                <TouchableOpacity key={item.type} style={[styles.alertTypeButton, alertType === item.type && { backgroundColor: item.color + '20', borderColor: item.color }]} onPress={() => setAlertType(item.type)}>
                  <Text style={styles.alertTypeIcon}>{item.icon}</Text>
                  <Text style={[styles.alertTypeLabel, alertType === item.type && { color: item.color }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.alertInput} placeholder="Enter your message..." value={alertMessage} onChangeText={setAlertMessage} multiline numberOfLines={4} textAlignVertical="top" maxLength={200} />
            <Button title={sendingAlert ? 'Sending...' : 'Send Alert'} onPress={handleSendAlert} disabled={sendingAlert} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1 },
  controls: { position: 'absolute', top: SPACING.md, left: SPACING.md, right: SPACING.md, gap: SPACING.sm },
  sharingControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: 12, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sharingInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sharingText: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold, color: COLORS.text },
  alertButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.error, padding: SPACING.md, borderRadius: 12, gap: SPACING.sm, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  alertButtonText: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.bold, color: COLORS.white },
  membersList: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: SPACING.md, paddingBottom: SPACING.lg, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  membersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  membersTitle: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold, color: COLORS.text },
  membersContent: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.md, borderRadius: 12, minWidth: 200, gap: SPACING.sm },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold, color: COLORS.text },
  memberStatus: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textSecondary },
  battery: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  batteryText: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.lg, gap: SPACING.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.bold, color: COLORS.text },
  alertTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  alertTypeButton: { flex: 1, minWidth: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.md, borderRadius: 8, borderWidth: 2, borderColor: COLORS.border, gap: SPACING.xs },
  alertTypeIcon: { fontSize: 20 },
  alertTypeLabel: { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.semibold, color: COLORS.text },
  alertInput: { backgroundColor: COLORS.background, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, fontSize: TYPOGRAPHY.sizes.md, minHeight: 100 },
});
