// App Configuration

// Determine if we're in development mode - safe check for production builds
const isDev = (() => {
  try {
    return typeof __DEV__ !== 'undefined' && __DEV__ === true;
  } catch {
    return false;
  }
})();

// Get environment variables (Expo uses EXPO_PUBLIC_ prefix)
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // @ts-ignore - Expo injects these at build time
    return process.env[key] || fallback;
  } catch {
    return fallback;
  }
};

// API Configuration
export const API_CONFIG = {
  // Base URL - uses environment variable or fallback
  BASE_URL: getEnvVar(
    'EXPO_PUBLIC_API_URL',
   'https://capstone-safe-haven.onrender.com/api/v1'
    
    // 'https://margert-unespousable-asley.ngrok-free.dev/api/v1'
      // 'https://safe-haven-backend-api.onrender.com/api/v1'
    // 'http://192.168.29.101:3001/api/v1'
    // // 'https://safe-haven-backend-api.onrender.com/api/v1'
  ),
  
  TIMEOUT: 10000, // 10 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@safehaven:access_token',
  REFRESH_TOKEN: '@safehaven:refresh_token',
  USER_DATA: '@safehaven:user_data',
  FCM_TOKEN: '@safehaven:fcm_token',
  LAST_LOCATION: '@safehaven:last_location',
  OFFLINE_ALERTS: '@safehaven:offline_alerts',
  OFFLINE_CENTERS: '@safehaven:offline_centers',
  OFFLINE_CONTACTS: '@safehaven:offline_contacts',
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_REGION: {
    latitude: 12.8797,  // Philippines center
    longitude: 121.7740,
    latitudeDelta: 10,
    longitudeDelta: 10,
  },
  DEFAULT_ZOOM: 15,
  NEARBY_RADIUS: 50, // km
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'disaster-alerts',
  CHANNEL_NAME: 'Disaster Alerts',
  CHANNEL_DESCRIPTION: 'Critical disaster alerts and warnings',
  SOUND: 'default',
  PRIORITY: 'high',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  ALERTS: 60000,      // 1 minute
  CENTERS: 300000,    // 5 minutes
  CONTACTS: 3600000,  // 1 hour
};

// App Info
export const APP_INFO = {
  NAME: 'SafeHaven',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@safehaven.ph',
  PRIVACY_URL: 'https://safehaven.ph/privacy',
  TERMS_URL: 'https://safehaven.ph/terms',
};

export default {
  API_CONFIG,
  STORAGE_KEYS,
  MAP_CONFIG,
  NOTIFICATION_CONFIG,
  PAGINATION,
  REFRESH_INTERVALS,
  APP_INFO,
};
