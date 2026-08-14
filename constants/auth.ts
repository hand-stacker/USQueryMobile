import { GoogleSignin } from '@react-native-google-signin/google-signin';

// OAuth client IDs for Google and Apple sign-in
export const GOOGLE_CLIENT_ID = "440682963132-e9e0n348g58lq0fmtu12oojjlu3n9c2q.apps.googleusercontent.com";
export const APPLE_CLIENT_ID = "YOUR_APPLE_CLIENT_ID"; // Replace with actual Apple Services ID

/**
 * iOS OAuth client id, from the same Google Cloud project as GOOGLE_CLIENT_ID.
 *
 * Android resolves its client automatically out of google-services.json by
 * package name + signing certificate. iOS has no equivalent lookup: the native
 * SDK needs either a GoogleService-Info.plist in the bundle or an explicit
 * client id, and without one it throws "failed to determine clientID".
 *
 * Create it under Google Cloud Console → APIs & Services → Credentials →
 * Create OAuth client ID → iOS, bundle id `com.usquery.mycongress`.
 *
 * Filling this in also requires the matching URL scheme in app.json, or the
 * OAuth redirect has nowhere to land — see the google-signin plugin entry
 * there. The scheme is this id with its two dot-separated halves swapped:
 *   440682963132-abc123.apps.googleusercontent.com
 *   → com.googleusercontent.apps.440682963132-abc123
 *
 * The backend must also accept it as an audience: on iOS the id_token is
 * issued to this client, not to the web client Android uses. Add it to
 * GOOGLE_CLIENT_IDS (comma-separated) alongside GOOGLE_CLIENT_ID.
 */
export const GOOGLE_IOS_CLIENT_ID = "440682963132-4q5ibnarcl5g9tn849f5c93k5f39f1m3.apps.googleusercontent.com";

/**
 * Single source of truth for the Google Sign-In setup, so the call in
 * `_layout.tsx` and the one in `useGoogleSignIn` can't drift apart — whichever
 * runs last wins, and silently disagreeing configs are painful to debug.
 *
 * `iosClientId` is omitted while GOOGLE_IOS_CLIENT_ID is blank: passing an
 * empty string reads as "configured" to the native module and fails later and
 * less clearly than not passing it at all.
 */
export const GOOGLE_SIGNIN_CONFIG = {
  webClientId: GOOGLE_CLIENT_ID,
  offlineAccess: true,
  ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
};

/** Applies GOOGLE_SIGNIN_CONFIG. Safe to call more than once. */
export function configureGoogleSignIn() {
  GoogleSignin.configure(GOOGLE_SIGNIN_CONFIG);
}
