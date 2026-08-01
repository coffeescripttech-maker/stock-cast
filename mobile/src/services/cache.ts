// Cache Service - Manage offline data caching

import { storeData, getData, removeData } from '../utils/storage';

interface CacheMetadata {
  timestamp: number;
  expiry: number; // milliseconds
}

interface CacheEntry<T> {
  data: T;
  metadata: CacheMetadata;
}

class CacheService {
  /**
   * Store data in cache with expiry
   */
  async set<T>(key: string, data: T, expiryMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        metadata: {
          timestamp: Date.now(),
          expiry: expiryMs,
        },
      };
      await storeData(`cache_${key}`, entry);
    } catch (error) {
      console.error(`Error caching data for key ${key}:`, error);
    }
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = await getData<CacheEntry<T>>(`cache_${key}`);
      
      if (!entry) {
        return null;
      }

      // Check if expired
      if (this.isExpired(entry.metadata)) {
        await this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`Error getting cached data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get data with metadata
   */
  async getWithMetadata<T>(key: string): Promise<{ data: T; timestamp: number } | null> {
    try {
      const entry = await getData<CacheEntry<T>>(`cache_${key}`);
      
      if (!entry) {
        return null;
      }

      // Check if expired
      if (this.isExpired(entry.metadata)) {
        await this.remove(key);
        return null;
      }

      return {
        data: entry.data,
        timestamp: entry.metadata.timestamp,
      };
    } catch (error) {
      console.error(`Error getting cached data with metadata for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from cache
   */
  async remove(key: string): Promise<void> {
    try {
      await removeData(`cache_${key}`);
    } catch (error) {
      console.error(`Error removing cached data for key ${key}:`, error);
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(metadata: CacheMetadata): boolean {
    const now = Date.now();
    const age = now - metadata.timestamp;
    return age > metadata.expiry;
  }

  /**
   * Get timestamp of cached data
   */
  async getTimestamp(key: string): Promise<number | null> {
    try {
      const entry = await getData<CacheEntry<any>>(`cache_${key}`);
      return entry?.metadata.timestamp || null;
    } catch (error) {
      console.error(`Error getting timestamp for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if data exists in cache (not expired)
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAll(): Promise<void> {
    // This would require tracking all cache keys
    // For now, we'll clear specific known keys
    console.warn('clearAll not fully implemented - clear specific keys instead');
  }
}

export const cacheService = new CacheService();

// Cache keys
export const CACHE_KEYS = {
  ALERTS: 'alerts',
  CENTERS: 'centers',
  CONTACTS: 'contacts',
  GUIDES: 'guides',
  USER_PROFILE: 'user_profile',
};

// Cache expiry times (in milliseconds)
export const CACHE_EXPIRY = {
  ALERTS: 6 * 60 * 60 * 1000, // 6 hours
  CENTERS: 7 * 24 * 60 * 60 * 1000, // 7 days
  CONTACTS: 30 * 24 * 60 * 60 * 1000, // 30 days (rarely changes)
  GUIDES: 30 * 24 * 60 * 60 * 1000, // 30 days
  USER_PROFILE: 24 * 60 * 60 * 1000, // 24 hours
};
