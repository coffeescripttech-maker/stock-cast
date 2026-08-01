/**
 * Unit tests for BadgeCounterService
 * 
 * These tests verify specific functionality and edge cases for the badge counter system.
 */

import { badgeCounterService, BadgeLocation } from '../BadgeCounterService';

describe('BadgeCounterService', () => {
  beforeEach(() => {
    // Reset badge counts before each test
    badgeCounterService.clearAllBadges();
  });

  describe('Basic Badge Operations', () => {
    test('should initialize with zero badge counts', () => {
      const counts = badgeCounterService.getAllBadgeCounts();
      expect(counts.header).toBe(0);
      expect(counts.alerts_tab).toBe(0);
      expect(counts.home_cards).toBe(0);
    });

    test('should update badge count for specific location', () => {
      badgeCounterService.updateBadgeCount('header', 5);
      expect(badgeCounterService.getBadgeCount('header')).toBe(5);
      expect(badgeCounterService.getBadgeCount('alerts_tab')).toBe(0);
    });

    test('should not allow negative badge counts', () => {
      badgeCounterService.updateBadgeCount('header', -5);
      expect(badgeCounterService.getBadgeCount('header')).toBe(0);
    });

    test('should clear specific badge location', () => {
      badgeCounterService.updateBadgeCount('header', 10);
      badgeCounterService.clearBadge('header');
      expect(badgeCounterService.getBadgeCount('header')).toBe(0);
    });

    test('should clear all badges', () => {
      badgeCounterService.updateBadgeCount('header', 5);
      badgeCounterService.updateBadgeCount('alerts_tab', 3);
      badgeCounterService.updateBadgeCount('home_cards', 7);
      
      badgeCounterService.clearAllBadges();
      
      const counts = badgeCounterService.getAllBadgeCounts();
      expect(counts.header).toBe(0);
      expect(counts.alerts_tab).toBe(0);
      expect(counts.home_cards).toBe(0);
    });
  });

  describe('Increment and Decrement Operations', () => {
    test('should increment badge count', () => {
      badgeCounterService.incrementBadgeCount('header', 3);
      expect(badgeCounterService.getBadgeCount('header')).toBe(3);
      
      badgeCounterService.incrementBadgeCount('header', 2);
      expect(badgeCounterService.getBadgeCount('header')).toBe(5);
    });

    test('should increment by 1 when no increment specified', () => {
      badgeCounterService.incrementBadgeCount('header');
      expect(badgeCounterService.getBadgeCount('header')).toBe(1);
    });

    test('should decrement badge count', () => {
      badgeCounterService.updateBadgeCount('header', 10);
      badgeCounterService.decrementBadgeCount('header', 3);
      expect(badgeCounterService.getBadgeCount('header')).toBe(7);
    });

    test('should not decrement below zero', () => {
      badgeCounterService.updateBadgeCount('header', 5);
      badgeCounterService.decrementBadgeCount('header', 10);
      expect(badgeCounterService.getBadgeCount('header')).toBe(0);
    });

    test('should decrement by 1 when no decrement specified', () => {
      badgeCounterService.updateBadgeCount('header', 5);
      badgeCounterService.decrementBadgeCount('header');
      expect(badgeCounterService.getBadgeCount('header')).toBe(4);
    });
  });

  describe('Subscription System', () => {
    test('should notify subscribers when badge count changes', () => {
      const mockCallback = jest.fn();
      const unsubscribe = badgeCounterService.subscribeToBadgeUpdates(mockCallback);
      
      badgeCounterService.updateBadgeCount('header', 5);
      
      expect(mockCallback).toHaveBeenCalledWith('header', 5);
      unsubscribe();
    });

    test('should notify multiple subscribers', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      const unsubscribe1 = badgeCounterService.subscribeToBadgeUpdates(mockCallback1);
      const unsubscribe2 = badgeCounterService.subscribeToBadgeUpdates(mockCallback2);
      
      badgeCounterService.updateBadgeCount('alerts_tab', 3);
      
      expect(mockCallback1).toHaveBeenCalledWith('alerts_tab', 3);
      expect(mockCallback2).toHaveBeenCalledWith('alerts_tab', 3);
      
      unsubscribe1();
      unsubscribe2();
    });

    test('should stop notifying after unsubscribe', () => {
      const mockCallback = jest.fn();
      const unsubscribe = badgeCounterService.subscribeToBadgeUpdates(mockCallback);
      
      badgeCounterService.updateBadgeCount('header', 5);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      badgeCounterService.updateBadgeCount('header', 10);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    test('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();
      
      const unsubscribe1 = badgeCounterService.subscribeToBadgeUpdates(errorCallback);
      const unsubscribe2 = badgeCounterService.subscribeToBadgeUpdates(normalCallback);
      
      // Should not throw error and should still call normal callback
      expect(() => {
        badgeCounterService.updateBadgeCount('header', 5);
      }).not.toThrow();
      
      expect(normalCallback).toHaveBeenCalledWith('header', 5);
      
      unsubscribe1();
      unsubscribe2();
    });
  });

  describe('Edge Cases', () => {
    test('should handle large badge counts', () => {
      const largeCount = 999999;
      badgeCounterService.updateBadgeCount('header', largeCount);
      expect(badgeCounterService.getBadgeCount('header')).toBe(largeCount);
    });

    test('should handle rapid successive updates', () => {
      const mockCallback = jest.fn();
      const unsubscribe = badgeCounterService.subscribeToBadgeUpdates(mockCallback);
      
      // Rapid updates
      for (let i = 1; i <= 100; i++) {
        badgeCounterService.updateBadgeCount('header', i);
      }
      
      expect(badgeCounterService.getBadgeCount('header')).toBe(100);
      expect(mockCallback).toHaveBeenCalledTimes(100);
      
      unsubscribe();
    });

    test('should maintain separate counts for different locations', () => {
      badgeCounterService.updateBadgeCount('header', 5);
      badgeCounterService.updateBadgeCount('alerts_tab', 10);
      badgeCounterService.updateBadgeCount('home_cards', 15);
      
      expect(badgeCounterService.getBadgeCount('header')).toBe(5);
      expect(badgeCounterService.getBadgeCount('alerts_tab')).toBe(10);
      expect(badgeCounterService.getBadgeCount('home_cards')).toBe(15);
    });
  });

  describe('getAllBadgeCounts', () => {
    test('should return immutable copy of badge counts', () => {
      badgeCounterService.updateBadgeCount('header', 5);
      
      const counts1 = badgeCounterService.getAllBadgeCounts();
      const counts2 = badgeCounterService.getAllBadgeCounts();
      
      // Should be different objects (not same reference)
      expect(counts1).not.toBe(counts2);
      
      // But should have same values
      expect(counts1).toEqual(counts2);
      
      // Modifying returned object should not affect internal state
      counts1.header = 999;
      expect(badgeCounterService.getBadgeCount('header')).toBe(5);
    });
  });
});