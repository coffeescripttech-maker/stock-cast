// Incident Reporting Service

import api from './api';
import { ApiResponse, PaginatedResponse } from '../types/api';
import { IncidentReport, CreateIncidentRequest, IncidentFilters } from '../types/incident';

export const incidentService = {
  // Create incident report
  createIncident: async (data: CreateIncidentRequest): Promise<IncidentReport> => {
    const response = await api.post<ApiResponse<IncidentReport>>('/incidents', data);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create incident report');
  },

  // Get all incidents (with filters)
  getIncidents: async (filters?: IncidentFilters): Promise<PaginatedResponse<IncidentReport>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<IncidentReport>>>('/incidents', {
      params: filters,
    });
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch incidents');
  },

  // Get incident by ID
  getIncidentById: async (id: number): Promise<IncidentReport> => {
    const response = await api.get<ApiResponse<IncidentReport>>(`/incidents/${id}`);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch incident');
  },

  // Get user's incidents
  getMyIncidents: async (): Promise<IncidentReport[]> => {
    const response = await api.get<ApiResponse<IncidentReport[]>>('/incidents/my');
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch your incidents');
  },

  // Update incident status (admin only)
  updateIncidentStatus: async (
    id: number,
    status: string
  ): Promise<IncidentReport> => {
    const response = await api.patch<ApiResponse<IncidentReport>>(
      `/incidents/${id}/status`,
      { status }
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update incident status');
  },
};
