// Mapbox Directions API Service
// Fetches route data from user location to destination

import Constants from 'expo-constants';

const MAPBOX_TOKEN = Constants.expoConfig?.extra?.EXPO_PUBLIC_MAPBOX_TOKEN || 
                     process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteData {
  coordinates: RouteCoordinate[];
  distance: number; // in meters
  duration: number; // in seconds
}

export interface DirectionsResponse {
  routes: Array<{
    geometry: {
      coordinates: number[][]; // [lng, lat]
    };
    distance: number;
    duration: number;
  }>;
}

/**
 * Fetch route from origin to destination using Mapbox Directions API
 */
export async function getDirections(
  origin: RouteCoordinate,
  destination: RouteCoordinate
): Promise<RouteData | null> {
  try {
    if (!MAPBOX_TOKEN) {
      console.error('❌ Mapbox token not configured');
      return null;
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    console.log('🗺️ Fetching route from Mapbox...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('❌ Mapbox API error:', response.status);
      return null;
    }

    const data: DirectionsResponse = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.error('❌ No routes found');
      return null;
    }

    const route = data.routes[0];

    // Convert coordinates from [lng, lat] to {latitude, longitude}
    const coordinates: RouteCoordinate[] = route.geometry.coordinates.map(
      ([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      })
    );

    console.log('✅ Route fetched:', {
      points: coordinates.length,
      distance: `${(route.distance / 1000).toFixed(2)} km`,
      duration: `${Math.round(route.duration / 60)} mins`,
    });

    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
    };
  } catch (error) {
    console.error('❌ Error fetching directions:', error);
    return null;
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
