import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const API = "https://usquery.com/api/notif";

export async function registerForPushNotifications() {
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
  await fetch(`${API}/register-device/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_token: token,
      platform: Platform.OS,
    }),
  });

  return token;
}
