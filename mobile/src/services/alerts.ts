// Disaster Alerts API Service

import api from './api';
import {
  AlertFilters,
  SearchAlertsRequest,
  AlertsResponse,
  AlertResponse,
  SearchAlertsResponse,
} from '../types/api';
import { DisasterAlert } from '../types/models';

// Transform snake_case to camelCase
const transformAlert = (alert: any): DisasterAlert | null => {
  // Validate required fields
  if (!alert) {
    console.error('❌ Alert is null or undefined');
    return null;
  }
  
  if (!alert.id || alert.id === 0) {
    console.error('❌ Alert has invalid ID:', alert.id);
    return null;
  }
  
  if (!alert.title || alert.title.trim() === '') {
    console.error('❌ Alert missing title:', alert.id);
    return null;
  }
  
  console.log('🔄 Transforming alert:', alert.id, 'type:', alert.alert_type);
  
  try {
    // Handle empty strings and null values
    const severity = alert.severity && alert.severity.trim() !== '' ? alert.severity : 'moderate';
    const alertType = alert.alert_type && alert.alert_type.trim() !== '' ? alert.alert_type : 'unknown';
    const description = alert.description && alert.description.trim() !== '' ? alert.description : 'No description available';
    const source = alert.source && alert.source.trim() !== '' ? alert.source : 'Unknown';
    
    return {
      id: alert.id,
      alertType: alertType,
      severity: severity,
      title: alert.title.trim(),
      description: description,
      source: source,
      affectedAreas: Array.isArray(alert.affected_areas) ? alert.affected_areas : [],
      latitude: alert.latitude ? parseFloat(alert.latitude) : 0,
      longitude: alert.longitude ? parseFloat(alert.longitude) : 0,
      radiusKm: alert.radius_km || 0,
      startTime: alert.start_time || new Date().toISOString(),
      endTime: alert.end_time || null,
      isActive: Boolean(alert.is_active),
      advanceNoticeHours: alert.advance_notice_hours || undefined,
      forecastData: alert.forecast_data || undefined,
      metadata: alert.metadata || {},
      createdAt: alert.created_at || new Date().toISOString(),
      updatedAt: alert.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error transforming alert:', error);
    return null;
  }
};

export const alertsService = {
  // Get all alerts with filters
  getAlerts: async (filters?: AlertFilters): Promise<{ alerts: DisasterAlert[]; total: number }> => {
    const params = new URLSearchParams();
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));
    if (filters?.lat) params.append('lat', String(filters.lat));
    if (filters?.lng) params.append('lng', String(filters.lng));
    if (filters?.radius) params.append('radius', String(filters.radius));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    
    // Add cache-busting timestamp
    params.append('_t', Date.now().toString());

    console.log('📡 Fetching alerts from API...');
    const response = await api.get<AlertsResponse>(`/alerts?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    console.log('📦 Raw alerts response:', JSON.stringify(response.data, null, 2));
    
    // Backend returns { data: { alerts: [...], total, page, limit } }
    const responseData = response.data.data!;
    const alertsData = (responseData as any).alerts || [];
    
    // Transform and filter out null results
    const transformedAlerts = alertsData
      .map(transformAlert)
      .filter((alert: DisasterAlert | null): alert is DisasterAlert => alert !== null);
    
    console.log('✅ Transformed alerts:', transformedAlerts.length);
    
    return {
      alerts: transformedAlerts,
      total: (responseData as any).total || transformedAlerts.length,
    };
  },

  // Get alert by ID
  getAlertById: async (id: number): Promise<DisasterAlert> => {
    console.log('📡 Fetching alert by ID:', id);
    
    const response = await api.get<AlertResponse>(`/alerts/${id}`);
    console.log('📦 Raw alert response:', JSON.stringify(response.data, null, 2));
    
    const transformedAlert = transformAlert(response.data.data!);
    
    if (!transformedAlert) {
      throw new Error('Failed to load alert details - invalid data received');
    }
    
    return transformedAlert;
  },

  // Search alerts
  searchAlerts: async (params: SearchAlertsRequest): Promise<DisasterAlert[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);

    const response = await api.get<SearchAlertsResponse>(`/alerts/search?${queryParams.toString()}`);
    
    // Transform and filter out null results
    return (response.data.data! as any[])
      .map(transformAlert)
      .filter((alert: DisasterAlert | null): alert is DisasterAlert => alert !== null);
  },

  // Get active alerts for user's location
  getActiveAlertsNearby: async (lat: number, lng: number, radius: number = 50): Promise<DisasterAlert[]> => {
    const { alerts } = await alertsService.getAlerts({
      isActive: true,
      lat,
      lng,
      radius,
    });
    return alerts;
  },
};

export default alertsService;
