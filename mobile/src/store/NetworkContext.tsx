// Network Context - Monitor network connectivity (Simplified for compatibility)

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface NetworkContextData {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
  isOnline: boolean;
}

const NetworkContext = createContext<NetworkContextData>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: 'unknown',
  isOnline: true,
});

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState('wifi');

  useEffect(() => {
    // Temporarily disable NetInfo to avoid NONE property error
    // TODO: Fix NetInfo compatibility issue
    console.log('NetworkProvider: Using fallback network detection');
    
    // Simple network check using fetch
    const checkNetwork = async () => {
      try {
        const response = await fetch('https://www.google.com', { 
          method: 'HEAD',
          timeout: 5000 
        });
        setIsConnected(true);
        setIsInternetReachable(true);
      } catch (error) {
        setIsConnected(false);
        setIsInternetReachable(false);
      }
    };

    // Check network every 30 seconds
    const interval = setInterval(checkNetwork, 30000);
    checkNetwork(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const isOnline = isConnected && (isInternetReachable === null || isInternetReachable === true);

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        connectionType,
        isOnline,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};
