import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authRequest } from './authRequest';

const API = "https://www.usquery.com/api/notif";

export async function registerForPushNotifications() {
  // Ensure a notification channel exists on Android before requesting a token.
  // Android 13 requires a notification channel to be created before a push token
  // can be obtained and the OS may show the runtime permission prompt only
  // after a channel exists.
  const storedToken = await AsyncStorage.getItem("deviceToken");
  if (storedToken) {
    console.log('Using stored push token:', storedToken);
    try {
      await authRequest(`notif/register-device/`, {
        method: "POST",
        body: JSON.stringify({
          device_token: storedToken,
          platform: Platform.OS,
        }),
      });
    } catch (e) {
      console.warn('Failed to ensure stored token is registered:', e);
    }
    return storedToken;
  }
  if (Platform.OS === 'android') {
    console.log("Creating notification channel for Android");
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch (e) {
      console.log("Failed to create notification channel:", e);
      // ignore channel creation failures, continue to permission/token steps
    }
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  console.log("Notification permissions granted");
  // Warn if running in Expo Go - remote push tokens won't be available there
  try {
    if ((Constants as any).appOwnership === 'expo') {
      console.warn('App is running in Expo Go; remote push tokens are not supported. Use a dev client or standalone build.');
    }
  } catch (e) {
    // ignore
  }

  let token: string | null = null;
  try {
    const expoTokenResp = await Notifications.getExpoPushTokenAsync();
    token = expoTokenResp?.data ?? null;
    console.log('Obtained Expo push token:', token);
  } catch (err) {
    console.warn('getExpoPushTokenAsync failed:', err);
    // Try native device token as a fallback (returns {type, data})
    try {
      const deviceTokenResp: any = await Notifications.getDevicePushTokenAsync();
      token = deviceTokenResp?.data ?? deviceTokenResp?.token ?? null;
      console.log('Obtained device push token fallback:', token, deviceTokenResp);
    } catch (err2) {
      console.warn('getDevicePushTokenAsync fallback failed:', err2);
    }
  }
  if (!token) {
    console.warn('No push token available after attempts.');
    return null;
  }
  await AsyncStorage.setItem("deviceToken", token);
  console.log("Registered for push notifications with token:", token);
  await authRequest(`notif/register-device/`, {
    method: "POST",
    body: JSON.stringify({
      device_token: token,
      platform: Platform.OS,
    }),
  });

  return token;
}


export async function unregisterForPushNotifications() {
  // If we have a stored token, use it directly and avoid querying device APIs.
  try {
    const storedToken = await AsyncStorage.getItem("deviceToken");
    if (storedToken) {
      console.log('Using stored push token for unregister:', storedToken);
      try {
        await authRequest(`notif/unregister-device/`, {
          method: "POST",
          body: JSON.stringify({
            device_token: storedToken,
          }),
        });
      } catch (e) {
        console.warn('Failed to unregister stored token:', e);
      }
      try {
        await AsyncStorage.removeItem("deviceToken");
      } catch (e) {
        // ignore removal errors
      }
      return storedToken;
    }
  } catch (e) {
    // ignore AsyncStorage read errors and fall back to device queries below
  }
  // Ensure a notification channel exists on Android before requesting a token.
  // Android 13 requires a notification channel to be created before a push token
  // can be obtained and the OS may show the runtime permission prompt only
  // after a channel exists.
  if (Platform.OS === 'android') {
    console.log("Creating notification channel for Android");
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch (e) {
      console.log("Failed to create notification channel:", e);
      // ignore channel creation failures, continue to permission/token steps
    }
  }
  try {
    if ((Constants as any).appOwnership === 'expo') {
      console.warn('App is running in Expo Go; remote push tokens are not supported. Use a dev client or standalone build.');
    }
  } catch (e) {
    // ignore
  }

  let token: string | null = null;
  try {
    const expoTokenResp = await Notifications.getExpoPushTokenAsync();
    token = expoTokenResp?.data ?? null;
    console.log('Obtained Expo push token:', token);
  } catch (err) {
    console.warn('getExpoPushTokenAsync failed:', err);
    // Try native device token as a fallback (returns {type, data})
    try {
      const deviceTokenResp: any = await Notifications.getDevicePushTokenAsync();
      token = deviceTokenResp?.data ?? deviceTokenResp?.token ?? null;
      console.log('Obtained device push token fallback:', token, deviceTokenResp);
    } catch (err2) {
      console.warn('getDevicePushTokenAsync fallback failed:', err2);
    }
  }
  if (!token) {
    console.warn('No push token available after attempts.');
    return null;
  }
  
  console.log("Unregistered for push notifications with token:", token);
  await authRequest(`notif/unregister-device/`, {
    method: "POST",
    body: JSON.stringify({
      device_token: token,
    }),
  });

  return token;
}