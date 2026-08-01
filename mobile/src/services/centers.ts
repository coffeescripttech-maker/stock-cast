// Evacuation Centers API Service

import api from './api';
import {
  CenterFilters,
  NearbyRequest,
  SearchCentersRequest,
  CentersResponse,
  CenterResponse,
  NearbyCentersResponse,
  SearchCentersResponse,
} from '../types/api';
import { EvacuationCenter } from '../types/models';

export const centersService = {
  // Get all centers with filters
  getCenters: async (filters?: CenterFilters): Promise<{ centers: EvacuationCenter[]; total: number }> => {
    const params = new URLSearchParams();
    
    if (filters?.city) params.append('city', filters.city);
    if (filters?.province) params.append('province', filters.province);
    if (filters?.barangay) params.append('barangay', filters.barangay);
    if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get<CentersResponse>(`/evacuation-centers?${params.toString()}`);
    return {
      centers: response.data.data!.data,
      total: response.data.data!.total,
    };
  },

  // Get center by ID
  getCenterById: async (id: number): Promise<EvacuationCenter> => {
    const response = await api.get<CenterResponse>(`/evacuation-centers/${id}`);
    return response.data.data!;
  },

  // Find nearby centers
  getNearby: async (params: NearbyRequest): Promise<EvacuationCenter[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('lat', String(params.lat));
    queryParams.append('lng', String(params.lng));
    if (params.radius) queryParams.append('radius', String(params.radius));

    const response = await api.get<NearbyCentersResponse>(`/evacuation-centers/nearby?${queryParams.toString()}`);
    return response.data.data!;
  },

  // Search centers
  searchCenters: async (params: SearchCentersRequest): Promise<EvacuationCenter[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    if (params.city) queryParams.append('city', params.city);
    if (params.province) queryParams.append('province', params.province);

    const response = await api.get<SearchCentersResponse>(`/evacuation-centers/search?${queryParams.toString()}`);
    return response.data.data!;
  },
};

export default centersService;
