/**
 * BadgeIndicator - Reusable badge component for notification counts
 * 
 * Features:
 * - Customizable size, color, and position
 * - Automatic visibility based on count
 * - Maximum count display (e.g., "99+")
 * - Accessible design with proper contrast
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

export interface BadgeIndicatorProps {
  count: number;
  maxCount?: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  visible?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const BadgeIndicator: React.FC<BadgeIndicatorProps> = ({
  count,
  maxCount = 99,
  size = 'medium',
  color = '#FF3B30', // iOS red
  textColor = '#FFFFFF',
  position = 'top-right',
  visible = true,
  style,
  testID = 'badge-indicator',
}) => {
  // Don't render if count is 0 or not visible
  if (count <= 0 || !visible) {
    return null;
  }

  // Format count with max limit
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  // Size configurations
  const sizeConfig = {
    small: { width: 16, height: 16, fontSize: 10, minWidth: 16 },
    medium: { width: 20, height: 20, fontSize: 12, minWidth: 20 },
    large: { width: 24, height: 24, fontSize: 14, minWidth: 24 },
  };

  const config = sizeConfig[size];

  // Position configurations
  const positionStyle: ViewStyle = {
    position: 'absolute',
    ...getPositionStyle(position),
  };

  const badgeStyle: ViewStyle = {
    backgroundColor: color,
    borderRadius: config.height / 2,
    minWidth: config.minWidth,
    height: config.height,
    paddingHorizontal: displayCount.length > 1 ? 4 : 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  };

  const textStyle: TextStyle = {
    color: textColor,
    fontSize: config.fontSize,
    fontWeight: 'bold',
    textAlign: 'center',
  };

  return (
    <View style={[positionStyle, badgeStyle, style]} testID={testID}>
      <Text style={textStyle} numberOfLines={1} adjustsFontSizeToFit>
        {displayCount}
      </Text>
    </View>
  );
};

function getPositionStyle(position: BadgeIndicatorProps['position']): ViewStyle {
  const offset = -8; // Offset to position badge outside parent bounds
  
  switch (position) {
    case 'top-right':
      return { top: offset, right: offset };
    case 'top-left':
      return { top: offset, left: offset };
    case 'bottom-right':
      return { bottom: offset, right: offset };
    case 'bottom-left':
      return { bottom: offset, left: offset };
    default:
      return { top: offset, right: offset };
  }
}

export default BadgeIndicator;