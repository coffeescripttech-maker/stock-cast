/**
 * Property-based tests for BadgeCounterService
 * 
 * These tests verify universal properties that should hold across all inputs
 * using fast-check for comprehensive input coverage.
 */

import * as fc from 'fast-check';
import { badgeCounterService, BadgeLocation } from '../BadgeCounterService';

describe('BadgeCounterService Property Tests', () => {
  beforeEach(() => {
    // Reset badge counts before each test
    badgeCounterService.clearAllBadges();
  });

  describe('Property 1: Badge count accuracy', () => {
    /**
     * **Feature: notification-badges-alerts, Property 1: Badge count accuracy**
     * **Validates: Requirements 1.1, 1.2, 1.3**
     * 
     * For any number of unread alerts, the badge counter should display exactly 
     * that count across all UI locations (header bell, alerts tab, home cards)
     */
    test('badge counter displays exact count for any valid input', () => {
      fc.assert(
        fc.property(
          fc.record({
            location: fc.constantFrom('header', 'alerts_tab', 'home_cards'),
            count: fc.integer({ min: 0, max: 9999 })
          }),
          ({ location, count }) => {
            // When: Update badge count for a location
            badgeCounterService.updateBadgeCount(location as BadgeLocation, count);
            
            // Then: Badge count should exactly match the input
            const actualCount = badgeCounterService.getBadgeCount(location as BadgeLocation);
            expect(actualCount).toBe(count);
            
            // And: Other locations should remain unaffected
            const allCounts = badgeCounterService.getAllBadgeCounts();
            const otherLocations = (['header', 'alerts_tab', 'home_cards'] as BadgeLocation[])
              .filter(loc => loc !== location);
            
            otherLocations.forEach(otherLocation => {
              expect(allCounts[otherLocation]).toBe(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('badge counter handles multiple simultaneous location updates accurately', () => {
      fc.assert(
        fc.property(
          fc.record({
            headerCount: fc.integer({ min: 0, max: 999 }),
            alertsTabCount: fc.integer({ min: 0, max: 999 }),
            homeCardsCount: fc.integer({ min: 0, max: 999 })
          }),
          ({ headerCount, alertsTabCount, homeCardsCount }) => {
            // When: Update all badge locations simultaneously
            badgeCounterService.updateBadgeCount('header', headerCount);
            badgeCounterService.updateBadgeCount('alerts_tab', alertsTabCount);
            badgeCounterService.updateBadgeCount('home_cards', homeCardsCount);
            
            // Then: Each location should display its exact count
            expect(badgeCounterService.getBadgeCount('header')).toBe(headerCount);
            expect(badgeCounterService.getBadgeCount('alerts_tab')).toBe(alertsTabCount);
            expect(badgeCounterService.getBadgeCount('home_cards')).toBe(homeCardsCount);
            
            // And: getAllBadgeCounts should return all correct values
            const allCounts = badgeCounterService.getAllBadgeCounts();
            expect(allCounts.header).toBe(headerCount);
            expect(allCounts.alerts_tab).toBe(alertsTabCount);
            expect(allCounts.home_cards).toBe(homeCardsCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('negative counts are normalized to zero', () => {
      fc.assert(
        fc.property(
          fc.record({
            location: fc.constantFrom('header', 'alerts_tab', 'home_cards'),
            negativeCount: fc.integer({ min: -9999, max: -1 })
          }),
          ({ location, negativeCount }) => {
            // When: Attempt to set negative badge count
            badgeCounterService.updateBadgeCount(location as BadgeLocation, negativeCount);
            
            // Then: Badge count should be normalized to zero
            const actualCount = badgeCounterService.getBadgeCount(location as BadgeLocation);
            expect(actualCount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Badge count decrements correctly', () => {
    /**
     * **Feature: notification-badges-alerts, Property 2: Badge count decrements correctly**
     * **Validates: Requirements 1.4**
     * 
     * For any number of alerts viewed, the badge counter should decrease by 
     * exactly that number of viewed alerts
     */
    test('decrement operations maintain mathematical correctness', () => {
      fc.assert(
        fc.property(
          fc.record({
            location: fc.constantFrom('header', 'alerts_tab', 'home_cards'),
            initialCount: fc.integer({ min: 0, max: 999 }),
            decrementAmount: fc.integer({ min: 0, max: 999 })
          }),
          ({ location, initialCount, decrementAmount }) => {
            // Given: Initial badge count
            badgeCounterService.updateBadgeCount(location as BadgeLocation, initialCount);
            
            // When: Decrement badge count
            badgeCounterService.decrementBadgeCount(location as BadgeLocation, decrementAmount);
            
            // Then: Badge count should be correctly decremented (but not below zero)
            const expectedCount = Math.max(0, initialCount - decrementAmount);
            const actualCount = badgeCounterService.getBadgeCount(location as BadgeLocation);
            expect(actualCount).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('multiple decrements are cumulative and accurate', () => {
      fc.assert(
        fc.property(
          fc.record({
            location: fc.constantFrom('header', 'alerts_tab', 'home_cards'),
            initialCount: fc.integer({ min: 50, max: 999 }),
            decrements: fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 10 })
          }),
          ({ location, initialCount, decrements }) => {
            // Given: Initial badge count
            badgeCounterService.updateBadgeCount(location as BadgeLocation, initialCount);
            
            // When: Apply multiple decrements
            let expectedCount = initialCount;
            decrements.forEach(decrement => {
              badgeCounterService.decrementBadgeCount(location as BadgeLocation, decrement);
              expectedCount = Math.max(0, expectedCount - decrement);
            });
            
            // Then: Final count should match expected cumulative result
            const actualCount = badgeCounterService.getBadgeCount(location as BadgeLocation);
            expect(actualCount).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Badge visibility state', () => {
    /**
     * **Feature: notification-badges-alerts, Property 3: Badge visibility state**
     * **Validates: Requirements 1.5**
     * 
     * For any badge counter, when the count reaches zero, all badge indicators 
     * should be hidden, and when count is greater than zero, badges should be visible
     */
    test('badge visibility correlates with count state', () => {
      fc.assert(
        fc.property(
          fc.record({
            location: fc.constantFrom('header', 'alerts_tab', 'home_cards'),
            count: fc.integer({ min: 0, max: 999 })
          }),
          ({ location, count }) => {
            // When: Set badge count
            badgeCounterService.updateBadgeCount(location as BadgeLocation, count);
            
            // Then: Badge visibility should match count state
            const actualCount = badgeCounterService.getBadgeCount(location as BadgeLocation);
            
            if (count === 0) {
              // Badge should be considered "hidden" (count is 0)
              expect(actualCount).toBe(0);
            } else {
              // Badge should be considered "visible" (count > 0)
              expect(actualCount).toBeGreaterThan(0);
              expect(actualCount).toBe(count);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('clearBadge always results in hidden state', () => {
      fc.assert(
        fc.property(
          fc.record({
            location: fc.constantFrom('header', 'alerts_tab', 'home_cards'),
            initialCount: fc.integer({ min: 1, max: 999 })
          }),
          ({ location, initialCount }) => {
            // Given: Badge with positive count
            badgeCounterService.updateBadgeCount(location as BadgeLocation, initialCount);
            expect(badgeCounterService.getBadgeCount(location as BadgeLocation)).toBeGreaterThan(0);
            
            // When: Clear badge
            badgeCounterService.clearBadge(location as BadgeLocation);
            
            // Then: Badge should be in hidden state (count = 0)
            const actualCount = badgeCounterService.getBadgeCount(location as BadgeLocation);
            expect(actualCount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Real-time badge updates', () => {
    /**
     * **Feature: notification-badges-alerts, Property 4: Real-time badge updates**
     * **Validates: Requirements 1.6**
     * 
     * For any badge count change, the UI should reflect the new count immediately 
     * without requiring manual refresh
     */
    test('subscribers receive immediate notifications for any count change', () => {
      fc.assert(
        fc.property(
          fc.record({
            location: fc.constantFrom('header', 'alerts_tab', 'home_cards'),
            updates: fc.array(fc.integer({ min: 0, max: 99 }), { minLength: 1, maxLength: 10 })
          }),
          ({ location, updates }) => {
            const notifications: Array<{ location: BadgeLocation; count: number }> = [];
            
            // Given: Subscriber listening for updates
            const unsubscribe = badgeCounterService.subscribeToBadgeUpdates(
              (loc, count) => {
                notifications.push({ location: loc, count });
              }
            );
            
            // When: Apply series of updates
            updates.forEach(count => {
              badgeCounterService.updateBadgeCount(location as BadgeLocation, count);
            });
            
            // Then: Each update should trigger immediate notification
            expect(notifications).toHaveLength(updates.length);
            
            updates.forEach((expectedCount, index) => {
              expect(notifications[index].location).toBe(location);
              expect(notifications[index].count).toBe(expectedCount);
            });
            
            unsubscribe();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('increment and decrement operations trigger real-time updates', () => {
      fc.assert(
        fc.property(
          fc.record({
            location: fc.constantFrom('header', 'alerts_tab', 'home_cards'),
            initialCount: fc.integer({ min: 10, max: 50 }),
            incrementAmount: fc.integer({ min: 1, max: 10 }),
            decrementAmount: fc.integer({ min: 1, max: 10 })
          }),
          ({ location, initialCount, incrementAmount, decrementAmount }) => {
            const notifications: Array<{ location: BadgeLocation; count: number }> = [];
            
            // Given: Initial count and subscriber
            badgeCounterService.updateBadgeCount(location as BadgeLocation, initialCount);
            
            const unsubscribe = badgeCounterService.subscribeToBadgeUpdates(
              (loc, count) => {
                notifications.push({ location: loc, count });
              }
            );
            
            // When: Perform increment and decrement operations
            badgeCounterService.incrementBadgeCount(location as BadgeLocation, incrementAmount);
            badgeCounterService.decrementBadgeCount(location as BadgeLocation, decrementAmount);
            
            // Then: Should receive notifications for both operations
            expect(notifications).toHaveLength(2);
            
            const expectedAfterIncrement = initialCount + incrementAmount;
            const expectedAfterDecrement = Math.max(0, expectedAfterIncrement - decrementAmount);
            
            expect(notifications[0].count).toBe(expectedAfterIncrement);
            expect(notifications[1].count).toBe(expectedAfterDecrement);
            
            unsubscribe();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});