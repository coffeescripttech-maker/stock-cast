/**
 * BadgeCounterService - Manages badge count tracking for different UI locations
 * 
 * This service provides centralized badge count management for:
 * - Header notification bell
 * - Alerts tab in bottom navigation
 * - Home screen alert cards
 */

export type BadgeLocation = 'header' | 'alerts_tab' | 'home_cards';
export type BadgeUpdateCallback = (location: BadgeLocation, count: number) => void;

interface BadgeState {
  header: number;
  alerts_tab: number;
  home_cards: number;
}

class BadgeCounterService {
  private badgeCounts: BadgeState = {
    header: 0,
    alerts_tab: 0,
    home_cards: 0,
  };

  private subscribers: Map<string, BadgeUpdateCallback> = new Map();
  private nextSubscriberId = 0;

  /**
   * Update badge count for a specific location
   */
  updateBadgeCount(location: BadgeLocation, count: number): void {
    if (count < 0) {
      count = 0;
    }
    
    this.badgeCounts[location] = count;
    this.notifySubscribers(location, count);
  }

  /**
   * Get current badge count for a specific location
   */
  getBadgeCount(location: BadgeLocation): number {
    return this.badgeCounts[location];
  }

  /**
   * Clear badge for a specific location
   */
  clearBadge(location: BadgeLocation): void {
    this.updateBadgeCount(location, 0);
  }

  /**
   * Clear all badges across all locations
   */
  clearAllBadges(): void {
    Object.keys(this.badgeCounts).forEach(location => {
      this.clearBadge(location as BadgeLocation);
    });
  }

  /**
   * Subscribe to badge count updates
   * Returns unsubscribe function
   */
  subscribeToBadgeUpdates(callback: BadgeUpdateCallback): () => void {
    const subscriberId = `subscriber_${this.nextSubscriberId++}`;
    this.subscribers.set(subscriberId, callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriberId);
    };
  }

  /**
   * Get all current badge counts
   */
  getAllBadgeCounts(): BadgeState {
    return { ...this.badgeCounts };
  }

  /**
   * Increment badge count for a specific location
   */
  incrementBadgeCount(location: BadgeLocation, increment: number = 1): void {
    const currentCount = this.getBadgeCount(location);
    this.updateBadgeCount(location, currentCount + increment);
  }

  /**
   * Decrement badge count for a specific location
   */
  decrementBadgeCount(location: BadgeLocation, decrement: number = 1): void {
    const currentCount = this.getBadgeCount(location);
    this.updateBadgeCount(location, Math.max(0, currentCount - decrement));
  }

  private notifySubscribers(location: BadgeLocation, count: number): void {
    this.subscribers.forEach(callback => {
      try {
        callback(location, count);
      } catch (error) {
        console.error('Error in badge update callback:', error);
      }
    });
  }
}

// Export singleton instance
export const badgeCounterService = new BadgeCounterService();
export default badgeCounterService;