// API Service - Axios instance with interceptors

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../constants/config';
import { getData, storeData, removeData } from '../utils/storage';
import { ApiResponse, ErrorResponse } from '../types/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning page
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getData<string>(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the complete URL being called
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('API Request:', config.method?.toUpperCase(), fullUrl);
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle NONE property errors specifically
    if (error.message && error.message.includes('NONE')) {
      console.warn('API NONE property error caught:', error.message);
      return Promise.reject(new Error('Network request failed. Please check your connection and try again.'));
    }

    // Log error details
    if (error.response) {
      console.log('API Error Response:', {
        status: error.response.status,
        url: `${error.config?.baseURL}${error.config?.url}`,
        message: error.response.data?.message || error.message,
        data: error.response.data
      });
    } else {
      console.log('API Error (No Response):', error.message);
    }

    // Handle 401 - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getData<string>(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          await storeData(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          await storeData(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Only clear tokens if refresh actually failed, not on other errors
        console.log('Token refresh failed');
        // Don't clear tokens here - let the app handle it
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  // Handle NONE property errors specifically
  if (error instanceof Error && error.message.includes('NONE')) {
    return 'Network connection issue. Please check your connection and try again.';
  }
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    if (axiosError.response?.data?.errors) {
      return axiosError.response.data.errors.join(', ');
    }
    
    if (axiosError.message) {
      // Handle NONE property errors in axios messages
      if (axiosError.message.includes('NONE')) {
        return 'Network connection issue. Please check your connection and try again.';
      }
      return axiosError.message;
    }
  }
  
  return 'An unexpected error occurred';
};

export default api;
