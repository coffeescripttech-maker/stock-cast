import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { groupService } from '../../services/groups';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { Button } from '../../components/common/Button';

export const JoinGroupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Required', 'Please enter an invite code');
      return;
    }

    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 8) {
      Alert.alert('Invalid Code', 'Invite code must be 8 characters');
      return;
    }

    try {
      setLoading(true);
      const group = await groupService.joinGroup({ inviteCode: code });

      Alert.alert(
        'Joined Successfully!',
        `You've joined "${group.name}". You can now share your location with group members.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error joining group:', error);
      Alert.alert('Error', error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Join Family Group</Text>
      <Text style={styles.subtitle}>
        Enter the invite code shared by your family member to join their group
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Invite Code *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 8-character code"
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.toUpperCase())}
            maxLength={8}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!loading}
          />
          <Text style={styles.hint}>
            The code is case-insensitive and 8 characters long
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📱 How to get an invite code:</Text>
          <Text style={styles.infoText}>
            1. Ask a family member to create a group{'\n'}
            2. They'll receive an 8-character invite code{'\n'}
            3. Enter that code here to join
          </Text>
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyText}>
            🔒 By joining, you agree to share your location with group members during emergencies. You can disable location sharing anytime in group settings.
          </Text>
        </View>

        <Button
          title={loading ? 'Joining...' : 'Join Group'}
          onPress={handleJoin}
          disabled={loading || inviteCode.length !== 8}
          style={styles.joinButton}
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
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    letterSpacing: 4,
    textAlign: 'center',
  },
  hint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    lineHeight: 20,
  },
  privacyBox: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    borderRadius: 8,
  },
  privacyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#92400E',
    lineHeight: 20,
  },
  joinButton: {
    marginTop: SPACING.md,
  },
  loader: {
    marginTop: SPACING.md,
  },
});
