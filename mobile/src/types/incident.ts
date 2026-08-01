// Incident Report Types

export type IncidentType = 'damage' | 'injury' | 'missing_person' | 'hazard' | 'other';
export type IncidentSeverity = 'low' | 'moderate' | 'high' | 'critical';
export type IncidentStatus = 'pending' | 'verified' | 'in_progress' | 'resolved';
export type TargetAgency = 'pnp' | 'bfp' | 'mdrrmo' | 'lgu';

export interface IncidentReport {
  id: number;
  userId: number;
  incidentType: IncidentType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  photos: string[];
  assignedTo?: number;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  userName?: string;
  userPhone?: string;
}

export interface CreateIncidentRequest {
  incidentType: IncidentType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  severity: IncidentSeverity;
  photos?: string[]; // Base64 encoded images
  targetAgency?: TargetAgency;
}

export interface IncidentFilters {
  type?: IncidentType;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  userId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
