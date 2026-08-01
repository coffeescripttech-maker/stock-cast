// Data Models matching backend API

export type Role = 
  | 'super_admin'
  | 'admin'
  | 'pnp'
  | 'bfp'
  | 'mdrrmo'
  | 'lgu_officer'
  | 'citizen';

export interface User {
  id: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: Role;
  jurisdiction?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface UserProfile {
  id: number;
  userId: number;
  address?: string;
  city?: string;
  province?: string;
  barangay?: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  medicalConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  latitude?: number;
  longitude?: number;
}

export type AlertType = 
  | 'typhoon' 
  | 'earthquake' 
  | 'flood' 
  | 'storm_surge' 
  | 'volcanic' 
  | 'tsunami' 
  | 'landslide';

export type AlertSeverity = 'low' | 'moderate' | 'high' | 'critical';

export interface DisasterAlert {
  id: number;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: string;
  affectedAreas: string[];
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  advanceNoticeHours?: number; // Hours of advance notice for predictive alerts
  forecastData?: any; // Forecast data used for prediction
  metadata?: {
    windSpeed?: number;
    signalNumber?: number;
    magnitude?: number;
    depth?: number;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EvacuationCenter {
  id: number;
  name: string;
  address: string;
  city: string;
  province: string;
  barangay?: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy: number;
  occupancyPercentage: number;
  isFull: boolean;
  contactPerson?: string;
  contactNumber?: string;
  facilities: string[];
  isActive: boolean;
  distance?: number; // Added when searching nearby
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: number;
  category: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  isNational: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupedContacts {
  [category: string]: EmergencyContact[];
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: {
    alertId?: string;
    type?: string;
    [key: string]: any;
  };
  timestamp: number;
  read: boolean;
}
