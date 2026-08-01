// SOS Service - Handle SOS alert creation

import api from './api';

export interface CreateSOSRequest {
  incidentTypeId?: number;
  incidentDescription?: string;
  latitude?: number;
  longitude?: number;
  message: string;
  userInfo: {
    name: string;
    phone: string;
  };
  targetAgency: 'barangay' | 'lgu' | 'bfp' | 'pnp' | 'mdrrmo' | 'all';
}

export interface SOSAlert {
  id: number;
  status: string;
  targetAgency: string;
  createdAt: string;
}

class SOSService {
  /**
   * Create a new SOS alert
   * @param data - SOS alert data including optional incident type
   * @returns Promise with created SOS alert
   */
  async createSOS(data: CreateSOSRequest): Promise<SOSAlert> {
    try {
      console.log('📡 [SOSService] Creating SOS alert:', {
        hasIncidentType: !!data.incidentTypeId,
        incidentTypeId: data.incidentTypeId,
        targetAgency: data.targetAgency,
        hasLocation: !!(data.latitude && data.longitude),
      });

      const response = await api.post('/sos', {
        latitude: data.latitude,
        longitude: data.longitude,
        message: data.message,
        userInfo: data.userInfo,
        targetAgency: data.targetAgency,
        incidentTypeId: data.incidentTypeId,
        incidentDescription: data.incidentDescription,
      });

      console.log('✅ [SOSService] SOS alert created successfully:', response.data);

      return response.data.data;
    } catch (error: any) {
      console.error('❌ [SOSService] Error creating SOS alert:', error);
      
      // Extract error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send SOS alert';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all SOS alerts for current user
   */
  async getMySOS(): Promise<any[]> {
    try {
      const response = await api.get('/sos/my-alerts');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching SOS alerts:', error);
      throw error;
    }
  }

  /**
   * Get specific SOS alert by ID
   */
  async getSOSById(id: number): Promise<any> {
    try {
      const response = await api.get(`/sos/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching SOS alert:', error);
      throw error;
    }
  }
}

export default new SOSService();
