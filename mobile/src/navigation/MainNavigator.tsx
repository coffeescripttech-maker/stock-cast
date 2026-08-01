// Main Tab Navigator

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { MainTabParamList, AlertsStackParamList, CentersStackParamList, GuidesStackParamList, IncidentsStackParamList, FamilyStackParamList, ProfileStackParamList, WeatherStackParamList } from '../types/navigation';
import { COLORS } from '../constants/colors';
import { HomeScreen } from '../screens/home/HomeScreen';
import { AlertsListScreen } from '../screens/alerts/AlertsListScreen';
import { AlertDetailsScreen } from '../screens/alerts/AlertDetailsScreen';
import IncidentTypeListScreen from '../screens/sos/IncidentTypeListScreen';
import IncidentTypeDetailScreen from '../screens/sos/IncidentTypeDetailScreen';
import SOSConfirmationScreen from '../screens/sos/SOSConfirmationScreen';
import { CentersMapScreen } from '../screens/centers/CentersMapScreen';
import { CentersListScreen } from '../screens/centers/CentersListScreen';
import { CenterDetailsScreen } from '../screens/centers/CenterDetailsScreen';
import { MyReservationsScreen } from '../screens/evacuation/MyReservationsScreen';
import { ContactsListScreen } from '../screens/contacts/ContactsListScreen';
import { GuidesListScreen } from '../screens/guides/GuidesListScreen';
import { GuideDetailsScreen } from '../screens/guides/GuideDetailsScreen';
import { IncidentsListScreen } from '../screens/incidents/IncidentsListScreen';
import { ReportIncidentScreen } from '../screens/incidents/ReportIncidentScreen';
import { IncidentDetailsScreen } from '../screens/incidents/IncidentDetailsScreen';
import { GroupsListScreen } from '../screens/family/GroupsListScreen';
import { CreateGroupScreen } from '../screens/family/CreateGroupScreen';
import { JoinGroupScreen } from '../screens/family/JoinGroupScreen';
import { GroupMapScreen } from '../screens/family/GroupMapScreen';
import { GroupDetailsScreen } from '../screens/family/GroupDetailsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { AboutScreen } from '../screens/profile/AboutScreen';
import { WeatherForecastScreen } from '../screens/weather/WeatherForecastScreen';
import { useNotifications } from '../store/NotificationContext';
import { CustomTabBar } from '../components/navigation/CustomTabBar';
import { CustomHeader } from '../components/navigation/CustomHeader';

const Tab = createBottomTabNavigator<MainTabParamList>();
const AlertsStack = createNativeStackNavigator<AlertsStackParamList>();
const CentersStack = createNativeStackNavigator<CentersStackParamList>();
const GuidesStack = createNativeStackNavigator<GuidesStackParamList>();
const IncidentsStack = createNativeStackNavigator<IncidentsStackParamList>();
const FamilyStack = createNativeStackNavigator<FamilyStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const WeatherStack = createNativeStackNavigator<WeatherStackParamList>();
const SOSStack = createNativeStackNavigator();

// SOS Stack Navigator
const SOSNavigator: React.FC = () => {
  return (
    <SOSStack.Navigator>
      <SOSStack.Screen
        name="IncidentTypeList"
        component={IncidentTypeListScreen}
        options={{ title: 'Select Incident Type' }}
      />
      <SOSStack.Screen
        name="IncidentTypeDetail"
        component={IncidentTypeDetailScreen}
        options={{ title: 'Incident Details' }}
      />
      <SOSStack.Screen
        name="SOSConfirmation"
        component={SOSConfirmationScreen}
        options={{ 
          title: 'Alert Sent',
          headerLeft: () => null, // Prevent going back
        }}
      />
    </SOSStack.Navigator>
  );
};

// Alerts Stack Navigator
const AlertsNavigator: React.FC = () => {
  return (
    <AlertsStack.Navigator>
      <AlertsStack.Screen
        name="AlertsList"
        component={AlertsListScreen}
        options={{ title: 'Disaster Alerts' }}
      />
      <AlertsStack.Screen
        name="AlertDetails"
        component={AlertDetailsScreen}
        options={{ title: 'Alert Details' }}
      />
    </AlertsStack.Navigator>
  );
};

// Centers Stack Navigator
const CentersNavigator: React.FC = () => {
  return (
    <CentersStack.Navigator>
      <CentersStack.Screen
        name="CentersMap"
        component={CentersMapScreen}
        options={{ title: 'Evacuation Centers' }}
      />
      <CentersStack.Screen
        name="CentersList"
        component={CentersListScreen}
        options={{ title: 'Centers List' }}
      />
      <CentersStack.Screen
        name="CenterDetails"
        component={CenterDetailsScreen}
        options={{ title: 'Center Details' }}
      />
      <CentersStack.Screen
        name="MyReservations"
        component={MyReservationsScreen}
        options={{ title: 'My Reservations' }}
      />
    </CentersStack.Navigator>
  );
};

// Guides Stack Navigator
const GuidesNavigator: React.FC = () => {
  return (
    <GuidesStack.Navigator>
      <GuidesStack.Screen
        name="GuidesList"
        component={GuidesListScreen}
        options={{ title: 'Preparedness Guides' }}
      />
      <GuidesStack.Screen
        name="GuideDetails"
        component={GuideDetailsScreen}
        options={{ title: 'Guide Details' }}
      />
    </GuidesStack.Navigator>
  );
};

// Incidents Stack Navigator
const IncidentsNavigator: React.FC = () => {
  return (
    <IncidentsStack.Navigator>
      <IncidentsStack.Screen
        name="IncidentsList"
        component={IncidentsListScreen}
        options={{ title: 'Incident Reports' }}
      />
      <IncidentsStack.Screen
        name="ReportIncident"
        component={ReportIncidentScreen}
        options={{ title: 'Report Incident' }}
      />
      <IncidentsStack.Screen
        name="IncidentDetails"
        component={IncidentDetailsScreen}
        options={{ title: 'Incident Details' }}
      />
    </IncidentsStack.Navigator>
  );
};

// Family Stack Navigator
const FamilyNavigator: React.FC = () => {
  return (
    <FamilyStack.Navigator>
      <FamilyStack.Screen
        name="GroupsList"
        component={GroupsListScreen}
        options={{ title: 'Family Groups' }}
      />
      <FamilyStack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Create Group' }}
      />
      <FamilyStack.Screen
        name="JoinGroup"
        component={JoinGroupScreen}
        options={{ title: 'Join Group' }}
      />
      <FamilyStack.Screen
        name="GroupMap"
        component={GroupMapScreen}
        options={{ title: 'Group Map' }}
      />
      <FamilyStack.Screen
        name="GroupDetails"
        component={GroupDetailsScreen}
        options={{ title: 'Group Details' }}
      />
    </FamilyStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'More' }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'About SafeHaven' }}
      />
    </ProfileStack.Navigator>
  );
};

// Weather Stack Navigator
const WeatherNavigator: React.FC = () => {
  return (
    <WeatherStack.Navigator>
      <WeatherStack.Screen
        name="WeatherForecast"
        component={WeatherForecastScreen}
        options={{ title: 'Weather Forecast' }}
      />
    </WeatherStack.Navigator>
  );
};

// Dummy screen for center tab (SOS button handles the action)
const SOSPlaceholder: React.FC = () => {
  return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
};

export const MainNavigator: React.FC = () => {
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: true,
        header: () => <CustomHeader />,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsNavigator}
        options={{
          tabBarLabel: 'Alerts',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="SOS"
        component={SOSNavigator}
        options={{
          tabBarLabel: 'SOS',
          tabBarButton: () => null, // Hide the tab button, we'll use custom SOS button
        }}
      />
      <Tab.Screen
        name="Centers"
        component={CentersNavigator}
        options={{
          tabBarLabel: 'Centers',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'More',
        }}
      />
      {/* Hidden navigators - accessible via navigation but not shown in tab bar */}
      <Tab.Screen
        name="Guides"
        component={GuidesNavigator}
        options={{
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
      <Tab.Screen
        name="Incidents"
        component={IncidentsNavigator}
        options={{
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyNavigator}
        options={{
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsListScreen}
        options={{
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
      <Tab.Screen
        name="Weather"
        component={WeatherNavigator}
        options={{
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
    </Tab.Navigator>
  );
};
