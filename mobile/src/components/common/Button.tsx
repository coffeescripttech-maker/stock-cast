// Custom Button Component

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...(fullWidth && styles.fullWidth),
    };

    // Size styles
    if (size === 'small') {
      baseStyle.paddingVertical = SPACING.xs;
      baseStyle.paddingHorizontal = SPACING.md;
    } else if (size === 'large') {
      baseStyle.paddingVertical = SPACING.lg;
      baseStyle.paddingHorizontal = SPACING.xl;
    }

    // Variant styles
    if (variant === 'primary') {
      baseStyle.backgroundColor = COLORS.primary;
    } else if (variant === 'secondary') {
      baseStyle.backgroundColor = COLORS.secondary;
    } else if (variant === 'outline') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 2;
      baseStyle.borderColor = COLORS.primary;
    } else if (variant === 'danger') {
      baseStyle.backgroundColor = COLORS.error;
    }

    // Disabled style
    if (disabled || loading) {
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...styles.text,
    };

    // Size styles
    if (size === 'small') {
      baseStyle.fontSize = TYPOGRAPHY.sizes.sm;
    } else if (size === 'large') {
      baseStyle.fontSize = TYPOGRAPHY.sizes.lg;
    }

    // Variant styles
    if (variant === 'outline') {
      baseStyle.color = COLORS.primary;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
