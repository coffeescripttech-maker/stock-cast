// Geocoding Service - Mobile App
// Uses OpenStreetMap Nominatim API for reverse geocoding

import axios from 'axios';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'SafeHaven-DisasterApp/1.0';

export interface AddressComponents {
  road?: string;
  suburb?: string;
  city?: string;
  municipality?: string;
  province?: string;
  region?: string;
  country?: string;
  postcode?: string;
}

export interface ReverseGeocodeResult {
  displayName: string;
  address: AddressComponents;
}

export const geocodingService = {
  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    try {
      const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
          zoom: 18
        },
        headers: {
          'User-Agent': USER_AGENT
        },
        timeout: 5000
      });

      if (response.data && response.data.display_name) {
        return {
          displayName: response.data.display_name,
          address: response.data.address || {}
        };
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  },

  /**
   * Format address for display (shorter version)
   */
  formatShortAddress(address: AddressComponents): string {
    const parts = [
      address.suburb || address.road,
      address.city || address.municipality,
      address.province
    ].filter(Boolean);

    return parts.join(', ') || 'Unknown location';
  },

  /**
   * Format full address for display
   */
  formatFullAddress(result: ReverseGeocodeResult): string {
    return result.displayName;
  }
};
