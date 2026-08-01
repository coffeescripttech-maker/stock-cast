// Location Context

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { Location as LocationModel } from '../types/models';
import { STORAGE_KEYS } from '../constants/config';
import { storeData, getData } from '../utils/storage';
import { getCurrentLocation } from '../utils/location';
import { useAuth } from './AuthContext';

interface LocationContextData {
  location: LocationModel | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  updateLocation: () => Promise<void>;
  setManualLocation: (location: LocationModel) => void;
}

const LocationContext = createContext<LocationContextData>({} as LocationContextData);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [location, setLocation] = useState<LocationModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Load cached location on mount
  useEffect(() => {
    loadCachedLocation();
    checkPermission();
  }, []);

  // Load user profile location as fallback when GPS is unavailable
  useEffect(() => {
    if (!location && !isLoading && profile) {
      loadProfileLocation();
    }
  }, [location, isLoading, profile]);

  const loadProfileLocation = () => {
    try {
      if (profile?.latitude && profile?.longitude) {
        const profileLat = typeof profile.latitude === 'string' 
          ? parseFloat(profile.latitude) 
          : profile.latitude;
        const profileLng = typeof profile.longitude === 'string'
          ? parseFloat(profile.longitude)
          : profile.longitude;
        
        // Only use if valid coordinates (not 0,0 and not null)
        if (profileLat && profileLng && profileLat !== 0 && profileLng !== 0) {
          console.log('Using profile location as fallback:', profileLat, profileLng);
          const profileLocation: LocationModel = {
            latitude: profileLat,
            longitude: profileLng,
            accuracy: undefined,
            timestamp: Date.now(),
          };
          setLocation(profileLocation);
        }
      }
    } catch (error) {
      console.error('Error loading profile location:', error);
    }
  };

  const loadCachedLocation = async () => {
    try {
      const cached = await getData<LocationModel>(STORAGE_KEYS.LAST_LOCATION);
      // Only use cached location if it has valid coordinates (not 0,0)
      if (cached && cached.latitude !== 0 && cached.longitude !== 0) {
        setLocation(cached);
      }
    } catch (error) {
      console.error('Error loading cached location:', error);
    }
  };

  const checkPermission = async () => {
    try {
      // Check permission status without prompting
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        await updateLocation();
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      // This will prompt the user for permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        await updateLocation();
      }
      
      return granted;
    } catch (err) {
      setError('Failed to request location permission');
      return false;
    }
  };

  const updateLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newLocation = await getCurrentLocation();
      
      if (newLocation) {
        setLocation(newLocation);
        // Cache location only if valid
        await storeData(STORAGE_KEYS.LAST_LOCATION, newLocation);
      } else {
        // GPS returned null (invalid coordinates or permission denied)
        setError('Unable to get valid location. Please check GPS settings.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      console.error('Error updating location:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const setManualLocation = (newLocation: LocationModel) => {
    setLocation(newLocation);
    storeData(STORAGE_KEYS.LAST_LOCATION, newLocation);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        error,
        hasPermission,
        requestPermission,
        updateLocation,
        setManualLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};
