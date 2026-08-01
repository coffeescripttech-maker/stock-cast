// AsyncStorage Helper Functions

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Store data in AsyncStorage
 */
export const storeData = async <T>(key: string, value: T): Promise<void> => {
  try {
    // Don't store null or undefined values
    if (value === null || value === undefined) {
      console.warn(`Attempted to store null/undefined for key: ${key}`);
      return;
    }
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Error storing data:', error);
    throw error;
  }
};

/**
 * Retrieve data from AsyncStorage
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
};

/**
 * Remove data from AsyncStorage
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing data:', error);
    throw error;
  }
};

/**
 * Clear all data from AsyncStorage
 */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};

/**
 * Store multiple items
 */
export const storeMultiple = async (items: [string, any][]): Promise<void> => {
  try {
    const pairs = items.map(([key, value]) => [key, JSON.stringify(value)]);
    await AsyncStorage.multiSet(pairs);
  } catch (error) {
    console.error('Error storing multiple items:', error);
    throw error;
  }
};

/**
 * Get multiple items
 */
export const getMultiple = async <T>(keys: string[]): Promise<Record<string, T | null>> => {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    const result: Record<string, T | null> = {};
    
    pairs.forEach(([key, value]) => {
      result[key] = value ? JSON.parse(value) : null;
    });
    
    return result;
  } catch (error) {
    console.error('Error getting multiple items:', error);
    return {};
  }
};

export default {
  storeData,
  getData,
  removeData,
  clearAll,
  storeMultiple,
  getMultiple,
};
