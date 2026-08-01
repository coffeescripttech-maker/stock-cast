// Alerts Context

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { DisasterAlert, AlertType, AlertSeverity } from '../types/models';
import { alertsService } from '../services/alerts';
import { STORAGE_KEYS, REFRESH_INTERVALS } from '../constants/config';
import { storeData, getData } from '../utils/storage';
import { handleApiError } from '../services/api';
import { cacheService, CACHE_KEYS, CACHE_EXPIRY } from '../services/cache';
import { useNetwork } from './NetworkContext';

interface AlertContextData {
  alerts: DisasterAlert[];
  isLoading: boolean;
  error: string | null;
  fetchAlerts: (filters?: {
    type?: AlertType;
    severity?: AlertSeverity;
    lat?: number;
    lng?: number;
    radius?: number;
  }) => Promise<void>;
  getAlertById: (id: number) => Promise<DisasterAlert>;
  searchAlerts: (query: string) => Promise<DisasterAlert[]>;
  refreshAlerts: () => Promise<void>;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetwork();

  // Load cached alerts on mount
  useEffect(() => {
    // Clear old cache on mount to ensure fresh structure
    cacheService.remove(CACHE_KEYS.ALERTS);
    
    // Initial fetch of alerts
    fetchAlerts();
    
    // Auto-refresh alerts
    const interval = setInterval(() => {
      refreshAlerts();
    }, REFRESH_INTERVALS.ALERTS);

    return () => clearInterval(interval);
  }, []);

  const loadCachedAlerts = async () => {
    try {
      const cached = await cacheService.get<DisasterAlert[]>(CACHE_KEYS.ALERTS);
      if (cached) {
        setAlerts(cached);
      }
    } catch (error) {
      console.error('Error loading cached alerts:', error);
    }
  };

  const fetchAlerts = async (filters?: {
    type?: AlertType;
    severity?: AlertSeverity;
    lat?: number;
    lng?: number;
    radius?: number;
  }) => {
    // Clear old cache to force fresh data with correct structure
    await cacheService.remove(CACHE_KEYS.ALERTS);
    
    // If offline, show error
    if (!isOnline) {
      setIsLoading(false);
      setError('No internet connection. Please connect to fetch alerts.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { alerts: fetchedAlerts } = await alertsService.getAlerts({
        ...filters,
        isActive: true,
      });
      
      console.log('✅ Fetched alerts in context:', fetchedAlerts.length);
      
      // Filter out invalid alerts (those with ID 0 or missing required fields)
      const validAlerts = (fetchedAlerts || []).filter(alert => 
        alert && 
        alert.id && 
        alert.id > 0 && 
        alert.title && 
        alert.alertType
      );
      
      console.log('✅ Valid alerts after filtering:', validAlerts.length);
      setAlerts(validAlerts);
      
      // Cache for offline use
      if (validAlerts && validAlerts.length > 0) {
        await cacheService.set(CACHE_KEYS.ALERTS, validAlerts, CACHE_EXPIRY.ALERTS);
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Error fetching alerts:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertById = async (id: number): Promise<DisasterAlert> => {
    try {
      return await alertsService.getAlertById(id);
    } catch (err) {
      throw new Error(handleApiError(err));
    }
  };

  const searchAlerts = async (query: string): Promise<DisasterAlert[]> => {
    try {
      return await alertsService.searchAlerts({ q: query });
    } catch (err) {
      throw new Error(handleApiError(err));
    }
  };

  const refreshAlerts = async () => {
    if (!isOnline) {
      console.log('Offline - skipping refresh');
      return;
    }

    // Clear cache to force fresh data
    await cacheService.remove(CACHE_KEYS.ALERTS);

    try {
      const { alerts: fetchedAlerts } = await alertsService.getAlerts({
        isActive: true,
      });
      
      console.log('✅ Refreshed alerts:', fetchedAlerts.length);
      
      // Filter out invalid alerts
      const validAlerts = (fetchedAlerts || []).filter(alert => 
        alert && 
        alert.id && 
        alert.id > 0 && 
        alert.title && 
        alert.alertType
      );
      
      console.log('✅ Valid alerts after filtering:', validAlerts.length);
      setAlerts(validAlerts);
      
      // Cache for offline use
      if (validAlerts && validAlerts.length > 0) {
        await cacheService.set(CACHE_KEYS.ALERTS, validAlerts, CACHE_EXPIRY.ALERTS);
      }
    } catch (err) {
      console.error('Error refreshing alerts:', handleApiError(err));
    }
  };

  return (
    <AlertContext.Provider
      value={{
        alerts,
        isLoading,
        error,
        fetchAlerts,
        getAlertById,
        searchAlerts,
        refreshAlerts,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertProvider');
  }
  return context;
};
