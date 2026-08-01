// Family/Group Locator Types

export type GroupRole = 'admin' | 'member';
export type GroupMemberStatus = 'active' | 'inactive';
export type GroupAlertType = 'emergency' | 'safe' | 'help_needed' | 'info';

export interface Group {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  isAdmin?: boolean;
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: GroupRole;
  status: GroupMemberStatus;
  locationSharingEnabled: boolean;
  joinedAt: string;
  lastSeen?: string;
  // User info
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  // Latest location
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  batteryLevel?: number;
  isMoving?: boolean;
  locationUpdatedAt?: string;
}

export interface LocationShare {
  id: number;
  userId: number;
  groupId: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  batteryLevel?: number;
  isMoving: boolean;
  sharedAt: string;
}

export interface GroupAlert {
  id: number;
  groupId: number;
  userId: number;
  alertType: GroupAlertType;
  message: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  userName?: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface JoinGroupRequest {
  inviteCode: string;
}

export interface ShareLocationRequest {
  groupId: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  batteryLevel?: number;
  isMoving?: boolean;
}

export interface SendGroupAlertRequest {
  groupId: number;
  alertType: GroupAlertType;
  message: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateMemberRequest {
  locationSharingEnabled?: boolean;
  status?: GroupMemberStatus;
}
