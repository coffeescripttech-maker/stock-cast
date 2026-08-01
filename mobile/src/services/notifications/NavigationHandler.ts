/**
 * NavigationHandler - Handles navigation from notifications with React Navigation integration
 * 
 * Features:
 * - Notification-type to screen mapping
 * - Deep linking support for all notification types
 * - Navigation failure handling with home screen fallback
 * - Badge counter updates when navigation occurs
 * 
 * Requirements: 6.1, 6.2, 6.4, 6.5, 6.6
 */

import { NavigationContainerRef } from '@react-navigation/native';
import { Linking } from 'react-native';
import { NotificationData, INavigationHandler, BadgeLocation } from '../../types/notification';
import { RootStackParamList } from '../../types/navigation';
import { badgeCounterService } from './BadgeCounterService';

export class NavigationHandler implements INavigationHandler {
  private navigationRef?: NavigationContainerRef<RootStackParamList>;

  constructor(navigationRef?: NavigationContainerRef<RootStackParamList>) {
    this.navigationRef = navigationRef;
  }

  /**
   * Set the navigation reference
   */
  setNavigationRef(navigationRef: NavigationContainerRef<RootStackParamList>): void {
    this.navigationRef = navigationRef;
  }

  /**
   * Handle notification press - navigate to appropriate screen and update badges
   * Implements notification-type to screen mapping with deep linking support
   */
  handleNotificationPress(notification: NotificationData): void {
    try {
      console.log('Handling notification press:', notification.type, notification.id);

      // Update badge counters when navigation occurs (Requirement 6.4)
      this.updateBadgeCountersOnNavigation(notification);

      // Navigate based on notification type (Requirements 6.1, 6.2)
      switch (notification.type) {
        case 'alert':
          if (notification.data?.alertId) {
            this.navigateToAlertDetails(notification.data.alertId);
          } else {
            this.navigateToAlerts();
          }
          break;
        case 'sos':
          if (notification.data?.incidentId) {
            this.navigateToSOSIncident(notification.data.incidentId);
          } else {
            this.navigateToSOS();
          }
          break;
        case 'incident':
          if (notification.data?.incidentId) {
            this.navigateToIncident(notification.data.incidentId);
          } else {
            this.navigateToIncidents();
          }
          break;
        default:
          console.warn('Unknown notification type:', notification.type);
          this.navigateToHome(); // Fallback (Requirement 6.6)
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
      this.navigateToHome(); // Navigation failure fallback (Requirement 6.6)
    }
  }

  /**
   * Handle deep linking from notification URLs (Requirement 6.5)
   */
  handleDeepLink(url: string): void {
    try {
      // Handle both full URLs and simple paths
      let parsedUrl: URL;
      
      if (url.startsWith('http') || url.includes('://')) {
        parsedUrl = new URL(url);
      } else {
        // Handle relative paths by creating a dummy URL
        parsedUrl = new URL(`safehaven://${url.startsWith('/') ? url.slice(1) : url}`);
      }
      
      const path = parsedUrl.pathname || parsedUrl.host;
      const params = Object.fromEntries(parsedUrl.searchParams);

      console.log('Handling deep link:', path, params);

      if (path.startsWith('alerts') || path === 'alerts') {
        if (params.alertId) {
          this.navigateToAlertDetails(params.alertId);
        } else {
          this.navigateToAlerts();
        }
      } else if (path.startsWith('sos') || path === 'sos') {
        if (params.incidentId) {
          this.navigateToSOSIncident(params.incidentId);
        } else {
          this.navigateToSOS();
        }
      } else if (path.startsWith('incidents') || path === 'incidents') {
        if (params.incidentId) {
          this.navigateToIncident(params.incidentId);
        } else {
          this.navigateToIncidents();
        }
      } else {
        this.navigateToHome();
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
      this.navigateToHome(); // Fallback on deep link failure
    }
  }

  /**
   * Update badge counters when navigation occurs (Requirement 6.4)
   */
  private updateBadgeCountersOnNavigation(notification: NotificationData): void {
    try {
      // Decrement relevant badge counters based on notification type
      switch (notification.type) {
        case 'alert':
          badgeCounterService.decrementBadgeCount('alerts_tab', 1);
          badgeCounterService.decrementBadgeCount('header', 1);
          badgeCounterService.decrementBadgeCount('home_cards', 1);
          break;
        case 'sos':
        case 'incident':
          badgeCounterService.decrementBadgeCount('header', 1);
          break;
      }
      
      console.log('Updated badge counters for navigation:', notification.type);
    } catch (error) {
      console.error('Error updating badge counters:', error);
    }
  }

  /**
   * Navigate to alerts screen
   */
  navigateToAlerts(): void {
    try {
      if (this.navigationRef?.isReady()) {
        this.navigationRef.navigate('Main', {
          screen: 'Alerts',
          params: {
            screen: 'AlertsList',
          },
        });
        console.log('Navigated to Alerts screen');
      } else {
        console.warn('Navigation not ready, cannot navigate to Alerts');
        this.handleNavigationFailure('Alerts');
      }
    } catch (error) {
      console.error('Error navigating to alerts:', error);
      this.handleNavigationFailure('Alerts');
    }
  }

  /**
   * Navigate to specific alert details with deep linking support
   */
  navigateToAlertDetails(alertId: string): void {
    try {
      if (!alertId) {
        console.warn('No alert ID provided, navigating to alerts list');
        this.navigateToAlerts();
        return;
      }

      if (this.navigationRef?.isReady()) {
        this.navigationRef.navigate('Main', {
          screen: 'Alerts',
          params: {
            screen: 'AlertDetails',
            params: { alertId: parseInt(alertId, 10) },
          },
        });
        console.log('Navigated to alert details:', alertId);
      } else {
        console.warn('Navigation not ready, cannot navigate to alert details');
        this.handleNavigationFailure('AlertDetails');
      }
    } catch (error) {
      console.error('Error navigating to alert details:', error);
      this.handleNavigationFailure('AlertDetails');
    }
  }

  /**
   * Navigate to specific incident details with enhanced deep linking
   */
  navigateToIncident(incidentId: string): void {
    try {
      if (!incidentId) {
        console.warn('No incident ID provided, navigating to incidents list');
        this.navigateToIncidents();
        return;
      }

      if (this.navigationRef?.isReady()) {
        this.navigationRef.navigate('Main', {
          screen: 'Incidents',
          params: {
            screen: 'IncidentDetails',
            params: { incidentId: parseInt(incidentId, 10) },
          },
        });
        console.log('Navigated to incident details:', incidentId);
      } else {
        console.warn('Navigation not ready, cannot navigate to incident');
        this.handleNavigationFailure('IncidentDetails');
      }
    } catch (error) {
      console.error('Error navigating to incident:', error);
      this.handleNavigationFailure('IncidentDetails');
    }
  }

  /**
   * Navigate to SOS incident details with enhanced deep linking
   */
  navigateToSOSIncident(incidentId: string): void {
    try {
      if (!incidentId) {
        console.warn('No SOS incident ID provided, navigating to SOS list');
        this.navigateToSOS();
        return;
      }

      if (this.navigationRef?.isReady()) {
        // Navigate to SOS screen - SOS doesn't accept params according to MainTabParamList
        this.navigationRef.navigate('Main', {
          screen: 'SOS',
        });
        console.log('Navigated to SOS incident details:', incidentId);
      } else {
        console.warn('Navigation not ready, cannot navigate to SOS incident');
        this.handleNavigationFailure('SOSDetails');
      }
    } catch (error) {
      console.error('Error navigating to SOS incident:', error);
      this.handleNavigationFailure('SOSDetails');
    }
  }

  /**
   * Navigate to incidents list
   */
  navigateToIncidents(): void {
    try {
      if (this.navigationRef?.isReady()) {
        this.navigationRef.navigate('Main', {
          screen: 'Incidents',
          params: {
            screen: 'IncidentsList',
          },
        });
        console.log('Navigated to Incidents screen');
      } else {
        console.warn('Navigation not ready, cannot navigate to Incidents');
        this.handleNavigationFailure('Incidents');
      }
    } catch (error) {
      console.error('Error navigating to incidents:', error);
      this.handleNavigationFailure('Incidents');
    }
  }

  /**
   * Navigate to SOS list
   */
  navigateToSOS(): void {
    try {
      if (this.navigationRef?.isReady()) {
        this.navigationRef.navigate('Main', {
          screen: 'SOS',
        });
        console.log('Navigated to SOS screen');
      } else {
        console.warn('Navigation not ready, cannot navigate to SOS');
        this.handleNavigationFailure('SOS');
      }
    } catch (error) {
      console.error('Error navigating to SOS:', error);
      this.handleNavigationFailure('SOS');
    }
  }

  /**
   * Navigate to home screen (fallback for navigation failures)
   * Requirement 6.6: Navigation failure fallback
   */
  navigateToHome(): void {
    try {
      if (this.navigationRef?.isReady()) {
        this.navigationRef.navigate('Main', {
          screen: 'Home',
        });
        console.log('Navigated to Home screen');
      } else {
        console.warn('Navigation not ready, cannot navigate to Home');
        // Last resort: try to reset to home using Linking
        this.handleCriticalNavigationFailure();
      }
    } catch (error) {
      console.error('Error navigating to home:', error);
      this.handleCriticalNavigationFailure();
    }
  }

  /**
   * Handle navigation failures with home screen fallback (Requirement 6.6)
   */
  private handleNavigationFailure(attemptedDestination: string): void {
    console.warn(`Navigation to ${attemptedDestination} failed, falling back to home`);
    this.navigateToHome();
  }

  /**
   * Handle critical navigation failures when even home navigation fails
   */
  private handleCriticalNavigationFailure(): void {
    console.error('Critical navigation failure - cannot navigate to any screen');
    // Could implement additional recovery mechanisms here
    // For now, just log the critical error
  }

  /**
   * Check if navigation is ready
   */
  isNavigationReady(): boolean {
    return this.navigationRef?.isReady() ?? false;
  }

  /**
   * Generate deep link URL for a notification
   * Supports deep linking for all notification types (Requirement 6.5)
   */
  generateDeepLinkUrl(notification: NotificationData): string {
    const baseUrl = 'safehaven://';
    
    switch (notification.type) {
      case 'alert':
        if (notification.data?.alertId) {
          return `${baseUrl}alerts?alertId=${notification.data.alertId}`;
        }
        return `${baseUrl}alerts`;
      case 'sos':
        if (notification.data?.incidentId) {
          return `${baseUrl}sos?incidentId=${notification.data.incidentId}`;
        }
        return `${baseUrl}sos`;
      case 'incident':
        if (notification.data?.incidentId) {
          return `${baseUrl}incidents?incidentId=${notification.data.incidentId}`;
        }
        return `${baseUrl}incidents`;
      default:
        return `${baseUrl}home`;
    }
  }

  /**
   * Register deep link handler for the app
   */
  registerDeepLinkHandler(): void {
    Linking.addEventListener('url', (event) => {
      this.handleDeepLink(event.url);
    });
  }

  /**
   * Get initial deep link URL if app was opened via deep link
   */
  async getInitialDeepLink(): Promise<string | null> {
    try {
      return await Linking.getInitialURL();
    } catch (error) {
      console.error('Error getting initial deep link:', error);
      return null;
    }
  }
}