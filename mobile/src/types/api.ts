// API Request/Response Types

import { User, UserProfile, DisasterAlert, EvacuationCenter, EmergencyContact, GroupedContacts } from './models';

// Generic API Response
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: string[];
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Auth Requests
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateProfileRequest {
  address?: string;
  city?: string;
  province?: string;
  barangay?: string;
  bloodType?: string;
  medicalConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  latitude?: number;
  longitude?: number;
}

// Auth Responses
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ProfileResponse {
  user: User;
  profile: UserProfile;
}

// Alert Requests
export interface AlertFilters {
  type?: string;
  severity?: string;
  isActive?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
}

export interface SearchAlertsRequest {
  q: string;
  startDate?: string;
  endDate?: string;
}

// Alert Responses
export type AlertsResponse = ApiResponse<PaginatedResponse<DisasterAlert>>;
export type AlertResponse = ApiResponse<DisasterAlert>;
export type SearchAlertsResponse = ApiResponse<DisasterAlert[]>;

// Center Requests
export interface CenterFilters {
  city?: string;
  province?: string;
  barangay?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface NearbyRequest {
  lat: number;
  lng: number;
  radius?: number;
}

export interface SearchCentersRequest {
  q: string;
  city?: string;
  province?: string;
}

// Center Responses
export type CentersResponse = ApiResponse<PaginatedResponse<EvacuationCenter>>;
export type CenterResponse = ApiResponse<EvacuationCenter>;
export type NearbyCentersResponse = ApiResponse<EvacuationCenter[]>;
export type SearchCentersResponse = ApiResponse<EvacuationCenter[]>;

// Contact Requests
export interface ContactFilters {
  category?: string;
  city?: string;
  province?: string;
  isNational?: boolean;
  isActive?: boolean;
}

export interface SearchContactsRequest {
  q: string;
  category?: string;
  city?: string;
  province?: string;
}

// Contact Responses
export type ContactsResponse = ApiResponse<GroupedContacts>;
export type ContactResponse = ApiResponse<EmergencyContact>;
export type CategoryContactsResponse = ApiResponse<EmergencyContact[]>;
export type CategoriesResponse = ApiResponse<string[]>;
export type SearchContactsResponse = ApiResponse<EmergencyContact[]>;

// Device Token
export interface RegisterDeviceTokenRequest {
  token: string;
  platform: 'android' | 'ios';
}

// Error Response
export interface ErrorResponse {
  status: 'error';
  message: string;
  errors?: string[];
}
