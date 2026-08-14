import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { USE_STOREKIT } from '../../constants/iap';

// Custom scheme deep link that the Stripe-hosted pages bounce back to. Stripe's
// return_url / success_url / cancel_url must be https (Stripe rejects custom
// schemes), so the backend points them at a small https page that 302s to this
// scheme. ASWebAuthenticationSession (iOS) / Chrome Custom Tabs (Android) watch
// for this scheme and auto-dismiss, returning the user to the app instead of
// stranding them on the logged-out web page. Matching is by scheme, so any
// usqmobileapp:// path (with whatever ?status= query) is caught.
export const STRIPE_RETURN_URL = 'usqmobileapp://subscription/manage';

// Opens a Stripe-hosted URL (billing portal or checkout) in an in-app browser
// that auto-closes when Stripe redirects to STRIPE_RETURN_URL. Returns the
// redirect URL the browser landed on (so the caller can read ?status=success /
// cancel), or null if the user dismissed it manually or we had to fall back to
// the system browser (which can't signal a return).
//
export async function openStripeUrl(url: string): Promise<string | null> {
  // Backstop for App Store Review guideline 3.1.1: an iOS app may not include
  // buttons, external links, or any other call to action pointing at a
  // purchasing mechanism other than in-app purchase. That covers the billing
  // portal as well as checkout — the portal is where a subscription is bought,
  // upgraded and re-started, so linking to it is steering even when the user
  // only means to cancel.
  //
  // A Stripe subscriber on iOS is therefore told, in plain text with no link,
  // that their subscription is billed outside the App Store. Callers already
  // branch before getting here; this makes it impossible for a future one to
  // slip a non-IAP payment page into the iOS build.
  if (USE_STOREKIT) {
    if (__DEV__) {
      console.warn('openStripeUrl blocked on iOS — guideline 3.1.1 forbids linking to it.');
    }
    return null;
  }
  try {
    const result = await WebBrowser.openAuthSessionAsync(url, STRIPE_RETURN_URL);
    return result.type === 'success' ? result.url : null;
  } catch {
    // Auth session unavailable: hand off to the system browser. No auto-return,
    // but better than failing the action outright.
    await Linking.openURL(url);
    return null;
  }
}
