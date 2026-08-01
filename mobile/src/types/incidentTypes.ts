// Incident Types for SOS Alerts

export interface IncidentType {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  responders: IncidentResponder[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IncidentResponder {
  id: number;
  incidentTypeId: number;
  agency: 'MDRRMO' | 'BFP' | 'PNP' | 'LGU' | 'BARANGAY';
  action: string;
  isPrimary: boolean;
}

export interface IncidentTypeResponse {
  status: string;
  data: IncidentType | IncidentType[];
  message?: string;
}
