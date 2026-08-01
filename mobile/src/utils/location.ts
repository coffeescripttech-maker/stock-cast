// Location Utilities

import * as Location from 'expo-location';
import { Location as LocationType } from '../types/models';

/**
 * Request location permissions
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current location
 */
export const getCurrentLocation = async (): Promise<LocationType | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Validate coordinates - reject if 0,0 (invalid location)
    if (location.coords.latitude === 0 && location.coords.longitude === 0) {
      console.warn('Invalid location coordinates (0,0) received - GPS not available');
      return null;
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if location is within radius
 */
export const isWithinRadius = (
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
};

/**
 * Get region for map from coordinates and radius
 */
export const getMapRegion = (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
) => {
  // Approximate degrees per km
  const latitudeDelta = radiusKm / 111; // 1 degree latitude ≈ 111 km
  const longitudeDelta = radiusKm / (111 * Math.cos(latitude * (Math.PI / 180)));

  return {
    latitude,
    longitude,
    latitudeDelta: latitudeDelta * 2, // Show area around point
    longitudeDelta: longitudeDelta * 2,
  };
};

/**
 * Open device maps app with directions
 */
export const openMapsWithDirections = async (
  latitude: number,
  longitude: number,
  label?: string
) => {
  const scheme = Platform.select({
    ios: 'maps:0,0?q=',
    android: 'geo:0,0?q=',
  });
  const latLng = `${latitude},${longitude}`;
  const labelParam = label ? `(${label})` : '';
  const url = Platform.select({
    ios: `${scheme}${labelParam}@${latLng}`,
    android: `${scheme}${latLng}${labelParam}`,
  });

  if (url) {
    const { Linking } = await import('react-native');
    Linking.openURL(url);
  }
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (latitude: number, longitude: number): string => {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

import { Platform } from 'react-native';

export default {
  requestLocationPermission,
  getCurrentLocation,
  calculateDistance,
  isWithinRadius,
  getMapRegion,
  openMapsWithDirections,
  formatCoordinates,
};
