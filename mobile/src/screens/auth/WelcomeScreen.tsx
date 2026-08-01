// Welcome Screen

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { AuthStackParamList } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Shield } from 'lucide-react-native';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo Container with Background */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* App Name with Icon */}
        <View style={styles.titleContainer}>
          <Shield color={COLORS.primary} size={32} strokeWidth={2.5} />
          <Text style={styles.title}>SafeHaven</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.subtitle}>
          Your trusted companion for disaster preparedness and emergency response
        </Text>

        {/* Features List */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>🚨</Text>
            <Text style={styles.featureText}>Real-time emergency alerts</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>📍</Text>
            <Text style={styles.featureText}>Find nearest evacuation centers</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>🆘</Text>
            <Text style={styles.featureText}>Quick SOS assistance</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttons}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate('Register')}
          fullWidth
        />
        <Button
          title="I Have an Account"
          onPress={() => navigation.navigate('Login')}
          variant="outline"
          fullWidth
          style={styles.loginButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: SPACING.xl,
  },
  logoBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  logo: {
    width: 120,
    height: 120,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 40,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  features: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featureBullet: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  featureText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.medium,
    flex: 1,
  },
  buttons: {
    width: '100%',
  },
  loginButton: {
    marginTop: SPACING.md,
  },
});
