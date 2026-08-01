// Authentication API Service

import api from './api';
import {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  AuthResponse,
  ProfileResponse,
  RegisterDeviceTokenRequest,
  ApiResponse,
} from '../types/api';

export const authService = {
  // Register new user
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  },

  // Login user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data!;
  },

  // Get current user profile
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get<ApiResponse<ProfileResponse>>('/auth/me');
    return response.data.data!;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileRequest): Promise<ProfileResponse> => {
    const response = await api.put<ApiResponse<ProfileResponse>>('/auth/profile', data);
    return response.data.data!;
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh-token',
      { refreshToken }
    );
    return response.data.data!;
  },

  // Register device token for push notifications
  registerDeviceToken: async (data: RegisterDeviceTokenRequest): Promise<void> => {
    await api.post('/auth/device-token', data);
  },

  // Logout (client-side only)
  logout: async (): Promise<void> => {
    // Backend doesn't have logout endpoint, just clear local data
    // This is handled in AuthContext
  },
};

export default authService;
