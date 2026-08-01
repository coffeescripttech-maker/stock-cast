// Protected Route - Role-based navigation protection

import React, { ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRole } from '../../store/RoleContext';
import { Role } from '../../types/models';
import { COLORS } from '../../constants/colors';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: Role[];
  redirectTo?: string;
  showError?: boolean;
}

/**
 * ProtectedRoute component for React Navigation screens.
 * Checks user role and redirects or shows error if unauthorized.
 * 
 * Usage in navigator:
 * 
 * <Stack.Screen name="AdminPanel">
 *   {() => (
 *     <ProtectedRoute requiredRole={['admin', 'super_admin']}>
 *       <AdminPanelScreen />
 *     </ProtectedRoute>
 *   )}
 * </Stack.Screen>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = 'Home',
  showError = true,
}) => {
  const { canAccess, isLoading, role } = useRole();
  const navigation = useNavigation();

  useEffect(() => {
    // Don't check while loading
    if (isLoading) return;

    // Check if user has required role
    if (requiredRole && !canAccess(requiredRole)) {
      console.log(`Access denied: User role '${role}' not in required roles [${requiredRole.join(', ')}]`);
      
      // Redirect to specified route
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // @ts-ignore - navigation.navigate exists but types may vary
        navigation.navigate(redirectTo);
      }
    }
  }, [isLoading, requiredRole, canAccess, role, navigation, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Check authorization
  if (requiredRole && !canAccess(requiredRole)) {
    if (showError) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorIcon}>🔒</Text>
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorMessage}>
            You don't have permission to access this page.
          </Text>
          <Text style={styles.roleInfo}>
            Your role: {role || 'None'}
          </Text>
        </View>
      );
    }
    return null;
  }

  // User is authorized
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  roleInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
