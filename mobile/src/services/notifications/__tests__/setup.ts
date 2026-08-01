/**
 * Test Setup for Notification Integration Tests
 * 
 * Configures the testing environment for notification system integration tests.
 */

import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo modules
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
  scheduleNotificationAsync: jest.fn(),
  cancelNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        sound: {
          playAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setIsLoopingAsync: jest.fn(),
          setVolumeAsync: jest.fn(),
        },
      })),
    },
    setAudioModeAsync: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    isFocused: jest.fn(() => true),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Lucide React Native icons
jest.mock('lucide-react-native', () => ({
  Bell: 'Bell',
  AlertTriangle: 'AlertTriangle',
  Home: 'Home',
  Building2: 'Building2',
  Menu: 'Menu',
  MapPin: 'MapPin',
  Phone: 'Phone',
  User: 'User',
  ChevronRight: 'ChevronRight',
  BookOpen: 'BookOpen',
  FileText: 'FileText',
  Users: 'Users',
  Shield: 'Shield',
  Sparkles: 'Sparkles',
  BarChart3: 'BarChart3',
  Settings: 'Settings',
  Clock: 'Clock',
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
}));

// Global test utilities
global.mockNotificationData = {
  critical: {
    id: 'critical-1',
    type: 'alert' as const,
    severity: 'critical' as const,
    title: 'Critical Emergency Alert',
    body: 'Immediate action required',
    data: { alertId: 'alert-critical-1' },
    timestamp: Date.now(),
  },
  high: {
    id: 'high-1',
    type: 'alert' as const,
    severity: 'high' as const,
    title: 'High Priority Alert',
    body: 'Important notification',
    data: { alertId: 'alert-high-1' },
    timestamp: Date.now(),
  },
  medium: {
    id: 'medium-1',
    type: 'sos' as const,
    severity: 'medium' as const,
    title: 'SOS Alert',
    body: 'Emergency assistance requested',
    data: { sosId: 'sos-medium-1' },
    timestamp: Date.now(),
  },
  low: {
    id: 'low-1',
    type: 'incident' as const,
    severity: 'low' as const,
    title: 'Incident Report',
    body: 'New incident reported',
    data: { incidentId: 'incident-low-1' },
    timestamp: Date.now(),
  },
};

// Console suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: componentWillReceiveProps has been renamed'))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ')
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});