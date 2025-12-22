import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

export const zustandStorage: StateStorage = {
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    try {
      // Helpful debug: show what's being read on app start/reload
      console.debug(`[zustandStorage] getItem ${name}:`, value);
    } catch (e) {
    }
    return value ?? null;
  },
  setItem: async (name, value) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      console.debug(`[zustandStorage] setItem ${name}:`, stringValue);
    } catch (e) {}
    await AsyncStorage.setItem(name, stringValue);
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};