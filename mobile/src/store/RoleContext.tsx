// Role-Based Access Control Context

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { Role } from '../types/models';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'execute';

export interface Permission {
  resource: string;
  action: Action;
}

interface RoleContextData {
  role: Role | null;
  jurisdiction: string | null;
  hasPermission: (resource: string, action: Action) => boolean;
  canAccess: (requiredRoles: Role[]) => boolean;
  getRoleDisplayName: () => string;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextData>({} as RoleContextData);

// Role-based permission matrix
// This mirrors the backend role_permissions table
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    // Super admin has all permissions - universal access
    { resource: '*', action: 'create' },
    { resource: '*', action: 'read' },
    { resource: '*', action: 'update' },
    { resource: '*', action: 'delete' },
    { resource: '*', action: 'execute' },
  ],
  admin: [
    // Admin has broad permissions except super_admin management
    { resource: 'alerts', action: 'create' },
    { resource: 'alerts', action: 'read' },
    { resource: 'alerts', action: 'update' },
    { resource: 'alerts', action: 'delete' },
    { resource: 'incidents', action: 'create' },
    { resource: 'incidents', action: 'read' },
    { resource: 'incidents', action: 'update' },
    { resource: 'incidents', action: 'delete' },
    { resource: 'sos_alerts', action: 'read' },
    { resource: 'sos_alerts', action: 'update' },
    { resource: 'evacuation_centers', action: 'create' },
    { resource: 'evacuation_centers', action: 'read' },
    { resource: 'evacuation_centers', action: 'update' },
    { resource: 'evacuation_centers', action: 'delete' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'analytics', action: 'read' },
    { resource: 'reports', action: 'create' },
    { resource: 'reports', action: 'read' },
  ],
  mdrrmo: [
    // MDRRMO has full disaster management permissions
    { resource: 'alerts', action: 'create' },
    { resource: 'alerts', action: 'read' },
    { resource: 'alerts', action: 'update' },
    { resource: 'alerts', action: 'delete' },
    { resource: 'incidents', action: 'create' },
    { resource: 'incidents', action: 'read' },
    { resource: 'incidents', action: 'update' },
    { resource: 'incidents', action: 'delete' },
    { resource: 'sos_alerts', action: 'read' },
    { resource: 'sos_alerts', action: 'update' },
    { resource: 'evacuation_centers', action: 'create' },
    { resource: 'evacuation_centers', action: 'read' },
    { resource: 'evacuation_centers', action: 'update' },
    { resource: 'evacuation_centers', action: 'delete' },
    { resource: 'analytics', action: 'read' },
    { resource: 'reports', action: 'create' },
    { resource: 'reports', action: 'read' },
  ],
  pnp: [
    // PNP has law enforcement response permissions
    { resource: 'incidents', action: 'read' },
    { resource: 'incidents', action: 'update' },
    { resource: 'sos_alerts', action: 'read' },
    { resource: 'sos_alerts', action: 'update' },
    { resource: 'evacuation_centers', action: 'read' },
    { resource: 'reports', action: 'create' },
    { resource: 'reports', action: 'read' },
  ],
  bfp: [
    // BFP has fire and rescue permissions
    { resource: 'incidents', action: 'read' },
    { resource: 'incidents', action: 'update' },
    { resource: 'sos_alerts', action: 'read' },
    { resource: 'sos_alerts', action: 'update' },
    { resource: 'evacuation_centers', action: 'read' },
    { resource: 'fire_stations', action: 'create' },
    { resource: 'fire_stations', action: 'read' },
    { resource: 'fire_stations', action: 'update' },
    { resource: 'fire_stations', action: 'delete' },
    { resource: 'reports', action: 'create' },
    { resource: 'reports', action: 'read' },
  ],
  lgu_officer: [
    // LGU Officer has local jurisdiction permissions
    { resource: 'alerts', action: 'create' }, // Requires approval
    { resource: 'alerts', action: 'read' },
    { resource: 'incidents', action: 'read' },
    { resource: 'incidents', action: 'update' },
    { resource: 'sos_alerts', action: 'read' },
    { resource: 'evacuation_centers', action: 'create' },
    { resource: 'evacuation_centers', action: 'read' },
    { resource: 'evacuation_centers', action: 'update' },
    { resource: 'evacuation_centers', action: 'delete' },
    { resource: 'reports', action: 'create' },
    { resource: 'reports', action: 'read' },
  ],
  citizen: [
    // Citizen has basic public access
    { resource: 'alerts', action: 'read' },
    { resource: 'sos_alerts', action: 'create' },
    { resource: 'incidents', action: 'create' },
    { resource: 'incidents', action: 'read' },
    { resource: 'evacuation_centers', action: 'read' },
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
  ],
};

// Role display names
const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  pnp: 'PNP Officer',
  bfp: 'BFP Officer',
  mdrrmo: 'MDRRMO Officer',
  lgu_officer: 'LGU Officer',
  citizen: 'Citizen',
};

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  const role = useMemo(() => user?.role || null, [user?.role]);
  const jurisdiction = useMemo(() => user?.jurisdiction || null, [user?.jurisdiction]);

  const hasPermission = (resource: string, action: Action): boolean => {
    if (!role) return false;

    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;

    // Check for universal access (super_admin)
    const hasUniversalAccess = permissions.some(
      (p) => p.resource === '*' && p.action === action
    );
    if (hasUniversalAccess) return true;

    // Check for specific permission
    return permissions.some(
      (p) => p.resource === resource && p.action === action
    );
  };

  const canAccess = (requiredRoles: Role[]): boolean => {
    if (!role) return false;
    
    // Super admin can access everything
    if (role === 'super_admin') return true;
    
    return requiredRoles.includes(role);
  };

  const getRoleDisplayName = (): string => {
    if (!role) return 'Guest';
    return ROLE_DISPLAY_NAMES[role] || role;
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        jurisdiction,
        hasPermission,
        canAccess,
        getRoleDisplayName,
        isLoading,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
};
