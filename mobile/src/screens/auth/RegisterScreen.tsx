// Register Screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../store/AuthContext';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { validateEmail, validatePhoneNumber, validatePassword } from '../../utils/validation';
import { AuthStackParamList } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Eye, EyeOff } from 'lucide-react-native';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    address: '',
    barangay: '',
    city: '',
    province: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Invalid phone number (use 09XXXXXXXXX)';
    }

    // Address fields are required
    if (!formData.address) newErrors.address = 'Street address is required';
    if (!formData.barangay) newErrors.barangay = 'Barangay is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.province) newErrors.province = 'Province is required';

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        barangay: formData.barangay,
        city: formData.city,
        province: formData.province,
      });
      // Navigation handled by RootNavigator
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join SafeHaven today</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="First Name"
            placeholder="Juan"
            value={formData.firstName}
            onChangeText={(value) => updateField('firstName', value)}
            error={errors.firstName}
            autoCapitalize="words"
          />

          <Input
            label="Last Name"
            placeholder="Dela Cruz"
            value={formData.lastName}
            onChangeText={(value) => updateField('lastName', value)}
            error={errors.lastName}
            autoCapitalize="words"
          />

          <Input
            label="Email"
            placeholder="juan@example.com"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Phone Number"
            placeholder="09123456789"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            <Text style={styles.sectionSubtitle}>Required for location-based alerts and emergency services</Text>
          </View>

          <Input
            label="Street Address"
            placeholder="123 Main Street"
            value={formData.address}
            onChangeText={(value) => updateField('address', value)}
            error={errors.address}
            autoCapitalize="words"
            multiline
          />

          <Input
            label="Barangay"
            placeholder="Barangay Name"
            value={formData.barangay}
            onChangeText={(value) => updateField('barangay', value)}
            error={errors.barangay}
            autoCapitalize="words"
          />

          <Input
            label="City"
            placeholder="City Name"
            value={formData.city}
            onChangeText={(value) => updateField('city', value)}
            error={errors.city}
            autoCapitalize="words"
          />

          <Input
            label="Province"
            placeholder="Province Name"
            value={formData.province}
            onChangeText={(value) => updateField('province', value)}
            error={errors.province}
            autoCapitalize="words"
          />

          <Input
            label="Password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            error={errors.password}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            rightIcon={
              showPassword ? (
                <EyeOff color={COLORS.textSecondary} size={20} strokeWidth={2} />
              ) : (
                <Eye color={COLORS.textSecondary} size={20} strokeWidth={2} />
              )
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            error={errors.confirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            rightIcon={
              showConfirmPassword ? (
                <EyeOff color={COLORS.textSecondary} size={20} strokeWidth={2} />
              ) : (
                <Eye color={COLORS.textSecondary} size={20} strokeWidth={2} />
              )
            }
            onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            style={styles.registerButton}
          />

          <Button
            title="Already have an account? Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            fullWidth
            style={styles.loginButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  logo: {
    width: 100,
    height: 100,
  },
  header: {
    marginBottom: SPACING.lg,
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
  },
  form: {
    flex: 1,
  },
  sectionHeader: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  registerButton: {
    marginTop: SPACING.lg,
  },
  loginButton: {
    marginTop: SPACING.md,
  },
});
