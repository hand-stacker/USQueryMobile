import { Platform } from 'react-native';

/**
 * App Store subscription product identifiers, one per paid tier.
 *
 * FALLBACK ONLY. The authoritative map is `apple_product_id` on each tier of
 * the backend's subscription/plans/ payload, which iapContext prefers so the
 * SKUs live in one place; this constant covers the case where that call fails
 * (offline first launch). The two must not disagree — if you change a SKU
 * here, change it on the server, and vice versa.
 *
 * These must match the auto-renewable subscriptions configured in App Store
 * Connect, and all three must live in the SAME subscription group so StoreKit
 * handles upgrades/downgrades (and their proration) for us — buying a different
 * SKU in the group replaces the current one rather than stacking a second
 * subscription.
 *
 * Tier ids come from the backend's subscription/plans/ payload:
 *   0 = Free, 1 = Plus, 4 = Plus Pro, 2 = Premium.
 */
export const IOS_SKU_BY_TIER: Record<number, string> = {
  1: 'com.usquery.mycongress.plus.monthly',
  4: 'com.usquery.mycongress.pluspro.monthly',
  2: 'com.usquery.mycongress.premium.monthly',
};

export const IOS_TIER_BY_SKU: Record<string, number> = Object.fromEntries(
  Object.entries(IOS_SKU_BY_TIER).map(([tier, sku]) => [sku, Number(tier)])
);

export const IOS_SUBSCRIPTION_SKUS: string[] = Object.values(IOS_SKU_BY_TIER);

/**
 * iOS must transact through StoreKit (App Store Review guideline 3.1.1); every
 * other platform keeps using Stripe Checkout. Gate every purchase, cancel, and
 * billing-portal affordance on this.
 */
export const USE_STOREKIT = Platform.OS === 'ios';

/**
 * Apple requires that subscriptions bought via StoreKit be cancelled/managed in
 * the App Store's own subscription settings, not in our billing portal.
 */
export const APPLE_MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

/**
 * Our own EULA, replacing Apple's standard one. Guideline 3.1.2 requires a
 * functional link to the terms of use and privacy policy wherever
 * auto-renewable subscriptions are offered — and Apple checks that the link
 * resolves, so these must stay hosted and public. The same document is filed
 * as the custom License Agreement in App Store Connect.
 *
 * Note the trailing slashes and the `www` host: usquery.com redirects to www,
 * and the site 404s on the slashless paths.
 */
export const TERMS_OF_USE_URL = 'https://www.usquery.com/terms-of-service/';
export const PRIVACY_POLICY_URL = 'https://www.usquery.com/privacy-policy/';
