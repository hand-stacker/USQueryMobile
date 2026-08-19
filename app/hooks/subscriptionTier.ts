import { retrieveUserSession } from '../encrypted-storage/functions';
import { authRequest } from './authRequest';

/**
 * Session cache of the signed-in user's subscription tier, so callers that ask
 * repeatedly (the upsell rolls on every qualifying navigation) don't hit
 * `subscription/status/` each time.
 *
 * -1 = logged out or the lookup failed, 0 = free, 1 = Plus, 2 = Premium.
 *
 * The cache MUST be invalidated whenever entitlement can change — sign-in,
 * sign-out, a granted App Store purchase, a confirmed Stripe checkout —
 * otherwise a user who just upgraded still reads as free for the rest of the
 * session and keeps getting sold a plan they already bought.
 */
export const TIER_LOGGED_OUT = -1;
export const TIER_FREE = 0;

let cachedTier: number | null = null;
let inFlight: Promise<number> | null = null;

export async function resolveSubscriptionTier(): Promise<number> {
  if (cachedTier !== null) return cachedTier;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const session = await retrieveUserSession();
    if (!session?.accessToken) return TIER_LOGGED_OUT;
    try {
      const res = await authRequest('subscription/status/');
      return res?.tier ?? TIER_FREE;
    } catch {
      return TIER_LOGGED_OUT;
    }
  })();

  try {
    cachedTier = await inFlight;
    return cachedTier;
  } finally {
    inFlight = null;
  }
}

/** Drop the cached tier. Call on sign-in, sign-out, and after any purchase. */
export function invalidateSubscriptionTier() {
  cachedTier = null;
  inFlight = null;
}

/**
 * Seed the cache from a `subscription/status/` response a caller already has,
 * so a screen that just read the authoritative tier keeps everyone else in
 * sync for free.
 */
export function setSubscriptionTier(tier: number) {
  cachedTier = tier;
  inFlight = null;
}
