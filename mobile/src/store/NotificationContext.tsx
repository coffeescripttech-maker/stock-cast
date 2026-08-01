// Notification Context - Disabled for compatibility

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface NotificationContextData {
  hasPermission: boolean;
  fcmToken: string | null;
  unreadCount: number;
  requestPermission: () => Promise<boolean>;
  registerToken: () => Promise<void>;
  clearBadge: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextData>({
  hasPermission: false,
  fcmToken: null,
  unreadCount: 0,
  requestPermission: async () => false,
  registerToken: async () => {},
  clearBadge: async () => {},
});

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('⚠️ NotificationProvider: Push notifications are disabled');
  
  return (
    <NotificationContext.Provider
      value={{
        hasPermission: false,
        fcmToken: null,
        unreadCount: 0,
        requestPermission: async () => {
          console.log('⚠️ Notifications are disabled in this build');
          return false;
        },
        registerToken: async () => {
          console.log('⚠️ Notifications are disabled in this build');
        },
        clearBadge: async () => {
          console.log('⚠️ Notifications are disabled in this build');
        },
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
