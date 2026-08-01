/**
 * ForegroundNotificationDisplay - In-app notification display component
 * Shows notifications when the app is in the foreground
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationData, AlertSeverity } from '../../types/notification';

interface ForegroundNotificationProps {
  notification: NotificationData | null;
  onPress?: (notification: NotificationData) => void;
  onDismiss?: () => void;
  autoHideDuration?: number;
}

export const ForegroundNotificationDisplay: React.FC<ForegroundNotificationProps> = ({
  notification,
  onPress,
  onDismiss,
  autoHideDuration = 4000,
}) => {
  const [slideAnim] = useState(new Animated.Value(-200));
  const [isVisible, setIsVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (notification) {
      showNotification();
    } else {
      hideNotification();
    }
  }, [notification]);

  const showNotification = () => {
    setIsVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Auto-hide after duration
    if (autoHideDuration > 0) {
      setTimeout(() => {
        hideNotification();
      }, autoHideDuration);
    }
  };

  const hideNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  };

  const handlePress = () => {
    if (notification && onPress) {
      onPress(notification);
      hideNotification();
    }
  };

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          backgroundColor: '#FF4444',
          borderColor: '#CC0000',
        };
      case 'high':
        return {
          backgroundColor: '#FF8C00',
          borderColor: '#E67300',
        };
      case 'medium':
        return {
          backgroundColor: '#FFD700',
          borderColor: '#E6C200',
        };
      case 'low':
        return {
          backgroundColor: '#4CAF50',
          borderColor: '#45A049',
        };
      default:
        return {
          backgroundColor: '#2196F3',
          borderColor: '#1976D2',
        };
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📢';
      case 'low':
        return 'ℹ️';
      default:
        return '📱';
    }
  };

  if (!notification || !isVisible) {
    return null;
  }

  const severityStyles = getSeverityStyles(notification.severity);
  const severityIcon = getSeverityIcon(notification.severity);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.notification, severityStyles]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{severityIcon}</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={hideNotification}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});