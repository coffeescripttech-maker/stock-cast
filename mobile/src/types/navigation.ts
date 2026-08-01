// Navigation Types

import { NavigatorScreenParams } from '@react-navigation/native';
import { DisasterAlert, EvacuationCenter, EmergencyContact } from './models';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  AlertDetails: { alert: DisasterAlert };
  CenterDetails: { center: EvacuationCenter };
  ContactDetails: { contact: EmergencyContact };
  Notifications: undefined;
  Settings: undefined;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Alerts: NavigatorScreenParams<AlertsStackParamList>;
  SOS: undefined;
  Centers: NavigatorScreenParams<CentersStackParamList>;
  Contacts: undefined;
  Guides: NavigatorScreenParams<GuidesStackParamList>;
  Incidents: NavigatorScreenParams<IncidentsStackParamList>;
  Family: NavigatorScreenParams<FamilyStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Weather: NavigatorScreenParams<WeatherStackParamList>;
};

// Alerts Stack Navigator
export type AlertsStackParamList = {
  AlertsList: undefined;
  AlertDetails: { alertId: number };
};

// Centers Stack Navigator
export type CentersStackParamList = {
  CentersMap: undefined;
  CentersList: undefined;
  CenterDetails: { centerId: number };
  MyReservations: undefined;
};

// Guides Stack Navigator
export type GuidesStackParamList = {
  GuidesList: undefined;
  GuideDetails: { guideId: number };
};

// Incidents Stack Navigator
export type IncidentsStackParamList = {
  IncidentsList: undefined;
  ReportIncident: undefined;
  IncidentDetails: { incidentId: number };
};

// Family Stack Navigator
export type FamilyStackParamList = {
  GroupsList: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
  GroupMap: { groupId: number };
  GroupDetails: { groupId: number };
  MemberDetails: { groupId: number; memberId: number };
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  About: undefined;
};

export type WeatherStackParamList = {
  WeatherForecast: undefined;
};

// Type helpers for navigation props
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

// Root Stack Navigation Props
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Auth Stack Navigation Props
export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// Main Tab Navigation Props
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Screen-specific navigation props
export type AlertDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AlertDetails'
>;
export type AlertDetailsRouteProp = RouteProp<RootStackParamList, 'AlertDetails'>;

export type CenterDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CenterDetails'
>;
export type CenterDetailsRouteProp = RouteProp<RootStackParamList, 'CenterDetails'>;

export type ContactDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ContactDetails'
>;
export type ContactDetailsRouteProp = RouteProp<RootStackParamList, 'ContactDetails'>;
