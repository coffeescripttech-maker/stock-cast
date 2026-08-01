// Protected Component - Role-based conditional rendering

import React, { ReactNode } from 'react';
import { useRole, Action } from '../../store/RoleContext';
import { Role } from '../../types/models';

interface ProtectedComponentProps {
  children: ReactNode;
  requiredRole?: Role[];
  requiredPermission?: {
    resource: string;
    action: Action;
  };
  fallback?: ReactNode;
}

/**
 * ProtectedComponent conditionally renders children based on user role and permissions.
 * 
 * Usage:
 * 
 * // Require specific roles
 * <ProtectedComponent requiredRole={['admin', 'super_admin']}>
 *   <AdminPanel />
 * </ProtectedComponent>
 * 
 * // Require specific permission
 * <ProtectedComponent requiredPermission={{ resource: 'alerts', action: 'create' }}>
 *   <CreateAlertButton />
 * </ProtectedComponent>
 * 
 * // With fallback content
 * <ProtectedComponent 
 *   requiredRole={['mdrrmo']} 
 *   fallback={<Text>Access Denied</Text>}
 * >
 *   <AnalyticsSection />
 * </ProtectedComponent>
 */
export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
}) => {
  const { canAccess, hasPermission, isLoading } = useRole();

  // Don't render anything while loading
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Check role-based access
  if (requiredRole && !canAccess(requiredRole)) {
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (requiredPermission) {
    const { resource, action } = requiredPermission;
    if (!hasPermission(resource, action)) {
      return <>{fallback}</>;
    }
  }

  // User is authorized, render children
  return <>{children}</>;
};
