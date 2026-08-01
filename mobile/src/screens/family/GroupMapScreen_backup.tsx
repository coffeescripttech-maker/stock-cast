import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { groupService } from '../../services/groups';
import { Group, GroupMember } from '../../types/group';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { Button } from '../../components/common/Button';
import { formatDistanceToNow } from 'date-fns';

type RouteParams = {
  GroupDetails: {
    groupId: number;
  };
};

export const GroupDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'GroupDetails'>>();
  const navigation = useNavigation();
  const { groupId } = route.params;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      const [groupData, membersData] = await Promise.all([
        groupService.getGroupById(groupId),
        groupService.getGroupMembers(groupId),
      ]);
      setGroup(groupData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading group:', error);
      Alert.alert('Error', 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const handleShareInvite = async () => {
    if (!group) return;

    try {
      await Share.share({
        message: `Join my SafeHaven family group "${group.name}"!\n\nInvite Code: ${group.inviteCode}\n\nDownload SafeHaven app and use this code to join.`,
        title: 'Join My Family Group',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group? You will no longer be able to see member locations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.leaveGroup(groupId);
              Alert.alert('Left Group', 'You have left the group', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member: GroupMember) => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.userName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.removeMember(groupId, member.userId);
              loadGroupData();
              Alert.alert('Success', 'Member removed from group');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Group Info */}
      <View style={styles.header}>
        <Text style={styles.groupIcon}>👨‍👩‍👧‍👦</Text>
        <Text style={styles.groupName}>{group.name}</Text>
        {group.description && (
          <Text style={styles.groupDescription}>{group.description}</Text>
        )}
      </View>

      {/* Invite Code */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite Code</Text>
        <View style={styles.inviteCodeContainer}>
          <View style={styles.inviteCodeBox}>
            <Text style={styles.inviteCode}>{group.inviteCode}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareInvite}>
            <Ionicons name="share-social" size={20} color={COLORS.primary} />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Members */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
        {members.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.userName}</Text>
              <Text style={styles.memberDetails}>
                {member.userPhone}
                {member.role === 'admin' && ' • Admin'}
              </Text>
              {member.lastSeen && (
                <Text style={styles.memberLastSeen}>
                  Last seen {formatDistanceToNow(new Date(member.lastSeen), { addSuffix: true })}
                </Text>
              )}
            </View>
            {group.isAdmin && member.role !== 'admin' && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMember(member)}
              >
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Leave Group"
          onPress={handleLeaveGroup}
          variant="outline"
          style={styles.leaveButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.error,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  groupIcon: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  groupName: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  groupDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  inviteCodeBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    padding: SPACING.md,
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    letterSpacing: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  memberDetails: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  memberLastSeen: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  actions: {
    padding: SPACING.lg,
  },
  leaveButton: {
    borderColor: COLORS.error,
  },
});
