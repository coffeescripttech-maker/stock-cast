// Incident Types Service - Fetch incident types for SOS alerts

import api from './api';
import { IncidentType } from '../types/incidentTypes';

class IncidentTypesService {
  /**
   * Get all incident types
   */
  async getAll(): Promise<IncidentType[]> {
    try {
      const response = await api.get('/incident-types');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching incident types:', error);
      throw error;
    }
  }

  /**
   * Get incident type by ID
   */
  async getById(id: number): Promise<IncidentType> {
    try {
      const response = await api.get(`/incident-types/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching incident type ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get incident types by priority
   */
  async getByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): Promise<IncidentType[]> {
    try {
      const response = await api.get(`/incident-types/priority/${priority}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching incident types by priority ${priority}:`, error);
      throw error;
    }
  }
}

export default new IncidentTypesService();
