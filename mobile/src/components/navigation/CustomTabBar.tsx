// Custom Tab Bar with Center SOS Button

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Bell, Building2, Menu } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { SOSButton } from '../home/SOSButton';
import ConnectedBadge from '../common/ConnectedBadge';

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  
  // Define which tabs should be visible in the tab bar
  const visibleTabNames = ['Home', 'Alerts', 'Centers', 'Profile'];
  
  // Filter to only show the visible tabs
  const visibleRoutes = state.routes.filter((route) => visibleTabNames.includes(route.name));

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 5) }]}>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === state.routes.indexOf(route);

          // Add space for SOS button between Alerts (index 1) and Centers (index 2)
          if (index === 2) {
            return (
              <React.Fragment key={`sos-space-${route.key}`}>
                <View style={styles.centerSpace} />
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={() => {
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  }}
                  style={styles.tab}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <Building2 
                      color={isFocused ? COLORS.primary : COLORS.textSecondary} 
                      size={24} 
                      strokeWidth={isFocused ? 2.5 : 2} 
                    />
                  </View>
                  <Text style={[styles.label, isFocused && styles.labelFocused]}>
                    {typeof label === 'string' ? label : route.name}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          }

          // Get icon component based on route name
          const IconComponent = () => {
            const iconColor = isFocused ? COLORS.primary : COLORS.textSecondary;
            const iconSize = 24;
            const strokeWidth = isFocused ? 2.5 : 2;

            switch (route.name) {
              case 'Home':
                return <Home color={iconColor} size={iconSize} strokeWidth={strokeWidth} />;
              case 'Alerts':
                return <Bell color={iconColor} size={iconSize} strokeWidth={strokeWidth} />;
              case 'Profile':
                return <Menu color={iconColor} size={iconSize} strokeWidth={strokeWidth} />;
              default:
                return <Home color={iconColor} size={iconSize} strokeWidth={strokeWidth} />;
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <IconComponent />
                {route.name === 'Alerts' && (
                  <ConnectedBadge 
                    location="alerts_tab"
                    size="small"
                    position="top-right"
                  />
                )}
              </View>
              <Text style={[styles.label, isFocused && styles.labelFocused]}>
                {typeof label === 'string' ? label : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Center SOS Button - Elevated and Prominent */}
      <View style={styles.sosButtonContainer}>
        <View style={styles.sosButtonWrapper}>
          <SOSButton />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    height: 65,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
    borderTopWidth: 0,
    overflow: 'visible',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSpace: {
    flex: 1,
  },
  iconContainer: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  labelFocused: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sosButtonContainer: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -28,
    zIndex: 10,
  },
  sosButtonWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
});
