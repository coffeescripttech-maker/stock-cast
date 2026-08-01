/**
 * ForegroundNotificationProvider - React context provider for foreground notifications
 * Manages the display of in-app notifications when the app is in the foreground
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NotificationData } from '../types/notification';
import { ForegroundNotificationDisplay } from '../components/notifications/ForegroundNotificationDisplay';
import { foregroundNotificationHandler } from '../services/notifications/ForegroundNotificationHandler';

interface ForegroundNotificationContextType {
  showNotification: (notification: NotificationData) => void;
  hideNotification: () => void;
  currentNotification: NotificationData | null;
}

const ForegroundNotificationContext = createContext<ForegroundNotificationContextType | undefined>(undefined);

interface ForegroundNotificationProviderProps {
  children: ReactNode;
  onNotificationPress?: (notification: NotificationData) => void;
}

export const ForegroundNotificationProvider: React.FC<ForegroundNotificationProviderProps> = ({
  children,
  onNotificationPress,
}) => {
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    // Initialize the handler
    foregroundNotificationHandler.initialize();

    // Set up callbacks
    foregroundNotificationHandler.setNotificationCallback((notification: NotificationData) => {
      setCurrentNotification(notification);
    });

    foregroundNotificationHandler.setDismissCallback(() => {
      setCurrentNotification(null);
    });

    // Cleanup on unmount
    return () => {
      foregroundNotificationHandler.cleanup();
    };
  }, []);

  const showNotification = (notification: NotificationData) => {
    foregroundNotificationHandler.showNotification(notification);
  };

  const hideNotification = () => {
    foregroundNotificationHandler.hideNotification();
  };

  const handleNotificationPress = (notification: NotificationData) => {
    if (onNotificationPress) {
      onNotificationPress(notification);
    }
    hideNotification();
  };

  const handleNotificationDismiss = () => {
    setCurrentNotification(null);
    foregroundNotificationHandler.clearCurrentNotification();
  };

  const contextValue: ForegroundNotificationContextType = {
    showNotification,
    hideNotification,
    currentNotification,
  };

  return (
    <ForegroundNotificationContext.Provider value={contextValue}>
      {children}
      <ForegroundNotificationDisplay
        notification={currentNotification}
        onPress={handleNotificationPress}
        onDismiss={handleNotificationDismiss}
        autoHideDuration={4000}
      />
    </ForegroundNotificationContext.Provider>
  );
};

export const useForegroundNotification = (): ForegroundNotificationContextType => {
  const context = useContext(ForegroundNotificationContext);
  if (context === undefined) {
    throw new Error('useForegroundNotification must be used within a ForegroundNotificationProvider');
  }
  return context;
};