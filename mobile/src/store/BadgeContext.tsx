/**
 * BadgeContext - React Context for badge counter state management
 * 
 * Provides React integration for the BadgeCounterService with:
 * - Real-time badge count updates
 * - React hooks for component integration
 * - Automatic re-rendering when badge counts change
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { badgeCounterService, BadgeLocation, BadgeUpdateCallback } from '../services/notifications/BadgeCounterService';

interface BadgeState {
  header: number;
  alerts_tab: number;
  home_cards: number;
}

interface BadgeContextData {
  badgeCounts: BadgeState;
  updateBadgeCount: (location: BadgeLocation, count: number | ((prev: number) => number)) => void;
  getBadgeCount: (location: BadgeLocation) => number;
  clearBadge: (location: BadgeLocation) => void;
  clearAllBadges: () => void;
  incrementBadgeCount: (location: BadgeLocation, increment?: number) => void;
  decrementBadgeCount: (location: BadgeLocation, decrement?: number) => void;
}

const BadgeContext = createContext<BadgeContextData | undefined>(undefined);

export const BadgeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [badgeCounts, setBadgeCounts] = useState<BadgeState>(() => 
    badgeCounterService.getAllBadgeCounts()
  );

  useEffect(() => {
    // Subscribe to badge updates from the service
    const unsubscribe = badgeCounterService.subscribeToBadgeUpdates(
      (location: BadgeLocation, count: number) => {
        setBadgeCounts(prevCounts => ({
          ...prevCounts,
          [location]: count,
        }));
      }
    );

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []); // Empty dependency array to run only once

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue: BadgeContextData = React.useMemo(() => ({
    badgeCounts,
    updateBadgeCount: (location: BadgeLocation, count: number | ((prev: number) => number)) => {
      if (typeof count === 'function') {
        const currentCount = badgeCounterService.getBadgeCount(location);
        const newCount = count(currentCount);
        badgeCounterService.updateBadgeCount(location, newCount);
      } else {
        badgeCounterService.updateBadgeCount(location, count);
      }
    },
    getBadgeCount: (location: BadgeLocation) => {
      return badgeCounterService.getBadgeCount(location);
    },
    clearBadge: (location: BadgeLocation) => {
      badgeCounterService.clearBadge(location);
    },
    clearAllBadges: () => {
      badgeCounterService.clearAllBadges();
    },
    incrementBadgeCount: (location: BadgeLocation, increment?: number) => {
      badgeCounterService.incrementBadgeCount(location, increment);
    },
    decrementBadgeCount: (location: BadgeLocation, decrement?: number) => {
      badgeCounterService.decrementBadgeCount(location, decrement);
    },
  }), [badgeCounts]); // Only recreate when badgeCounts change

  return (
    <BadgeContext.Provider value={contextValue}>
      {children}
    </BadgeContext.Provider>
  );
};

export const useBadgeCounter = (): BadgeContextData => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadgeCounter must be used within a BadgeProvider');
  }
  return context;
};

export default BadgeContext;