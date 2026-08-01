// Family/Group Locator Service

import api from './api';
import { ApiResponse } from '../types/api';
import {
  Group,
  GroupMember,
  GroupAlert,
  CreateGroupRequest,
  JoinGroupRequest,
  ShareLocationRequest,
  SendGroupAlertRequest,
  UpdateMemberRequest,
} from '../types/group';

export const groupService = {
  // Get user's groups
  getMyGroups: async (): Promise<Group[]> => {
    const response = await api.get<ApiResponse<Group[]>>('/groups/my');
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch groups');
  },

  // Create new group
  createGroup: async (data: CreateGroupRequest): Promise<Group> => {
    const response = await api.post<ApiResponse<Group>>('/groups', data);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create group');
  },

  // Join group with invite code
  joinGroup: async (data: JoinGroupRequest): Promise<Group> => {
    const response = await api.post<ApiResponse<Group>>('/groups/join', data);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to join group');
  },

  // Get group details
  getGroupById: async (id: number): Promise<Group> => {
    const response = await api.get<ApiResponse<Group>>(`/groups/${id}`);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch group');
  },

  // Get group members with locations
  getGroupMembers: async (groupId: number): Promise<GroupMember[]> => {
    const response = await api.get<ApiResponse<GroupMember[]>>(`/groups/${groupId}/members`);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch members');
  },

  // Share location with group
  shareLocation: async (data: ShareLocationRequest): Promise<void> => {
    const response = await api.post<ApiResponse<void>>('/groups/location', data);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to share location');
    }
  },

  // Send alert to group
  sendGroupAlert: async (data: SendGroupAlertRequest): Promise<GroupAlert> => {
    const response = await api.post<ApiResponse<GroupAlert>>('/groups/alerts', data);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to send alert');
  },

  // Get group alerts
  getGroupAlerts: async (groupId: number): Promise<GroupAlert[]> => {
    const response = await api.get<ApiResponse<GroupAlert[]>>(`/groups/${groupId}/alerts`);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch alerts');
  },

  // Update member settings
  updateMember: async (groupId: number, data: UpdateMemberRequest): Promise<void> => {
    const response = await api.patch<ApiResponse<void>>(`/groups/${groupId}/member`, data);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to update settings');
    }
  },

  // Leave group
  leaveGroup: async (groupId: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/groups/${groupId}/leave`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to leave group');
    }
  },

  // Remove member (admin only)
  removeMember: async (groupId: number, userId: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/groups/${groupId}/members/${userId}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to remove member');
    }
  },
};
