import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

export const zustandStorage: StateStorage = {
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(name, stringValue);
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};