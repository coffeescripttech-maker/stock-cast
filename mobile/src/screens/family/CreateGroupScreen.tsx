import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { groupService } from '../../services/groups';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { Button } from '../../components/common/Button';

export const CreateGroupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<any>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a group name');
      return;
    }

    try {
      setLoading(true);
      const group = await groupService.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      setCreatedGroup(group);
      Alert.alert(
        'Group Created!',
        `Your group "${group.name}" has been created. Share the invite code with your family.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!createdGroup) return;

    try {
      await Share.share({
        message: `Join my SafeHaven family group "${createdGroup.name}"!\n\nInvite Code: ${createdGroup.inviteCode}\n\nDownload SafeHaven app and use this code to join.`,
        title: 'Join My Family Group',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDone = () => {
    navigation.goBack();
  };

  if (createdGroup) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Group Created!</Text>
        <Text style={styles.successSubtitle}>{createdGroup.name}</Text>

        <View style={styles.inviteCodeContainer}>
          <Text style={styles.inviteCodeLabel}>Invite Code</Text>
          <View style={styles.inviteCodeBox}>
            <Text style={styles.inviteCode}>{createdGroup.inviteCode}</Text>
          </View>
          <Text style={styles.inviteCodeHint}>
            Share this code with family members to join
          </Text>
        </View>

        <Button
          title="Share Invite Code"
          onPress={handleShare}
          style={styles.shareButton}
        />

        <Button
          title="Done"
          onPress={handleDone}
          variant="outline"
          style={styles.doneButton}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Family Group</Text>
      <Text style={styles.subtitle}>
        Create a group to share your location with family members during emergencies
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Miranda Family"
            value={name}
            onChangeText={setName}
            maxLength={50}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add a description for your group"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
            editable={!loading}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 After creating the group, you'll receive an invite code to share with family members.
          </Text>
        </View>

        <Button
          title={loading ? 'Creating...' : 'Create Group'}
          onPress={handleCreate}
          disabled={loading}
          style={styles.createButton}
        />

        {loading && (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        )}
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
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  form: {
    gap: SPACING.lg,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
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
    minHeight: 100,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    lineHeight: 20,
  },
  createButton: {
    marginTop: SPACING.md,
  },
  loader: {
    marginTop: SPACING.md,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  successSubtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  inviteCodeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  inviteCodeLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  inviteCodeBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    letterSpacing: 4,
  },
  inviteCodeHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  shareButton: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  doneButton: {
    width: '100%',
  },
});
