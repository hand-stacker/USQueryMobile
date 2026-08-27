import { Platform } from 'react-native';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.jerem13.USQ_Mobile_App';
// The slug form (apps.apple.com/<slug>/id...) 404s — the path needs /app/.
export const APP_STORE_URL = 'https://apps.apple.com/app/id6768933879';

/** Store listing for the current platform. */
export const STORE_URL = Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
