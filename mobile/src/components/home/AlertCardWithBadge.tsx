/**
 * AlertCardWithBadge - Alert card component with integrated badge support
 * 
 * This component wraps alert cards with badge functionality for the home screen.
 * It can display badges for unread alerts or other notification counts.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import ConnectedBadge from '../common/ConnectedBadge';

interface AlertCardWithBadgeProps {
  children: React.ReactNode;
  showBadge?: boolean;
  badgeCount?: number;
  style?: ViewStyle;
  testID?: string;
}

const AlertCardWithBadge: React.FC<AlertCardWithBadgeProps> = ({
  children,
  showBadge = true,
  badgeCount,
  style,
  testID = 'alert-card-with-badge',
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {children}
      {showBadge && (
        <ConnectedBadge 
          location="home_cards"
          size="small"
          position="top-right"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});

export default AlertCardWithBadge;