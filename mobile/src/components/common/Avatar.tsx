// Avatar Component - Displays user avatar with fallback

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { User } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  showInitials?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  firstName,
  lastName,
  imageUrl = 'https://img.freepik.com/free-psd/3d-rendering-avatar_23-2150833560.jpg',
  size = 'medium',
  style,
  showInitials = true,
}) => {
  const sizeStyles = {
    small: { width: 40, height: 40, fontSize: 16, iconSize: 24 },
    medium: { width: 60, height: 60, fontSize: 24, iconSize: 36 },
    large: { width: 80, height: 80, fontSize: 32, iconSize: 48 },
    xlarge: { width: 120, height: 120, fontSize: 48, iconSize: 72 },
  };

  const { width, height, fontSize, iconSize } = sizeStyles[size];

  // Get initials for fallback
  const getInitials = () => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  const initials = getInitials();

  return (
    <View style={[styles.container, { width, height }, style]}>
      {imageUrl ? (
        // User uploaded avatar
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width, height }]}
          resizeMode="cover"
        />
      ) : (
        // Default avatar with icon or initials
        <View style={[styles.defaultContainer, { width, height }]}>
          {showInitials && initials ? (
            // Show initials
            <View style={styles.initialsContainer}>
              <Text style={[styles.initials, { fontSize }]}>
                {initials}
              </Text>
            </View>
          ) : (
            // Show user icon
            <User 
              color={COLORS.primary} 
              size={iconSize} 
              strokeWidth={2} 
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 999, // Fully circular
    overflow: 'hidden',
    backgroundColor: COLORS.border,
    position: 'relative',
  },
  image: {
    borderRadius: 999,
  },
  defaultContainer: {
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
