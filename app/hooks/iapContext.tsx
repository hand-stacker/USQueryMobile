import {
  ErrorCode,
  getAvailablePurchases as fetchAvailablePurchases,
  useIAP,
  type ProductSubscription,
  type Purchase,
} from 'expo-iap';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  IOS_SKU_BY_TIER,
  USE_STOREKIT,
} from '../../constants/iap';
import { retrieveUserSession } from '../encrypted-storage/functions';
import { authRequest, authRequestWithStatus } from './authRequest';
import { openAppleSubscriptionSettings } from './subscriptionBilling';

interface IapContextValue {
  /** True once StoreKit is connected and the product fetch has been attempted. */
  ready: boolean;
  /** False when the backend reports it has no Apple IAP credentials configured. */
  iapConfigured: boolean;
  /** StoreKit products keyed by our backend tier id. */
  productsByTier: Record<number, ProductSubscription | undefined>;
  /** Tier id currently being purchased, or null. */
  purchasingTier: number | null;
  /** True while a restore is in flight. */
  restoring: boolean;
  /**
   * Bumped every time the backend confirms an App Store transaction. Screens
   * showing subscription state should reload when this changes.
   */
  entitlementVersion: number;
  /** Starts the StoreKit purchase flow for a tier. Resolves when the sheet closes. */
  purchase: (tierId: number) => Promise<void>;
  /** Re-sends the user's existing App Store subscriptions to the backend. */
  restore: () => Promise<void>;
  /** Opens the App Store's own subscription management sheet. */
  openManageSubscriptions: () => Promise<void>;
  /**
   * Silently re-verifies every unfinished StoreKit transaction. Call after a
   * sign-in: a purchase made while logged out has no account to be granted to,
   * so it sits unfinished until something replays it.
   */
  syncPendingPurchases: () => Promise<void>;
}

const NOOP_VALUE: IapContextValue = {
  ready: false,
  iapConfigured: false,
  productsByTier: {},
  purchasingTier: null,
  restoring: false,
  entitlementVersion: 0,
  purchase: async () => {},
  restore: async () => {},
  openManageSubscriptions: openAppleSubscriptionSettings,
  syncPendingPurchases: async () => {},
};

const IapContext = createContext<IapContextValue>(NOOP_VALUE);

export const useIapContext = () => useContext(IapContext);

/**
 * Stable per-transaction identifier. `transactionId` is optional on the shared
 * Purchase union, but `id` is always present and holds the StoreKit transaction
 * id on iOS.
 */
const transactionKey = (purchase: Purchase) => purchase.transactionId ?? purchase.id;

/**
 * What the backend said about a transaction, reduced to the only three things
 * the client can actually do about it. The distinction matters because
 * `finishTransaction` is irreversible: finishing tells Apple we honored a
 * purchase, and an unfinished transaction is the *only* thing that makes Apple
 * redeliver it.
 */
type VerifyOutcome =
  /** 200. The entitlement is recorded server-side — safe to finish. */
  | { kind: 'granted' }
  /** No session. Leave unfinished; it replays after sign-in. */
  | { kind: 'signed-out' }
  /** 500/503/network. Leave unfinished and try again later, quietly. */
  | { kind: 'retry'; message: string }
  /** 400/409. Retrying never succeeds; leave unfinished but stop asking. */
  | { kind: 'permanent'; title: string; message: string };

const GENERIC_RETRY =
  'We could not confirm your purchase with our servers. You have not been charged twice — reopen the app or tap Restore Purchases and we will finish setting it up.';

/**
 * Maps the verify endpoint's documented failure table onto a VerifyOutcome.
 * The endpoint is idempotent and assigns state absolutely, so a retry is always
 * safe; what varies is whether one can ever succeed.
 */
function classifyFailure(status: number, body: any): VerifyOutcome {
  const serverMessage: string | undefined =
    typeof body?.error === 'string' ? body.error : undefined;

  // 503 = SUBSCRIPTIONS_ENABLED is off; 5xx = server-side failure. Both clear
  // on their own, so back off rather than burning the transaction.
  if (status === 503 || status >= 500 || status === 0) {
    return { kind: 'retry', message: serverMessage ?? GENERIC_RETRY };
  }

  if (status === 409) {
    // One Apple ID, two app accounts. Apple will keep redelivering this
    // transaction; we deliberately never finish it, so signing back into the
    // owning account (or Restore Purchases) still resolves it.
    if (body?.billing_provider === 'stripe') {
      return {
        kind: 'permanent',
        title: 'Already subscribed on the web',
        message:
          serverMessage ??
          'Your subscription is billed through our website. Cancel it at usquery.com before subscribing through the App Store, so you are not charged twice.',
      };
    }
    return {
      kind: 'permanent',
      title: 'Subscription linked elsewhere',
      message:
        'This App Store subscription is already linked to another My Congress account. Sign in with that account, or contact support.',
    };
  }

  // 4xx: tampered payload, bundle mismatch, unknown SKU, unreadable state.
  // None of these are fixable by the client.
  return {
    kind: 'permanent',
    title: 'Purchase could not be applied',
    message:
      (serverMessage ? `${serverMessage} ` : '') +
      'Please contact support — you have not been granted this plan.',
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let cachedAppAccountToken: string | null | undefined;

/**
 * The user's account UUID, echoed back by Apple on every transaction and
 * notification for this purchase. It lets the backend attribute a purchase
 * whose verify call never landed (app killed, network dropped) with no client
 * round-trip.
 *
 * StoreKit requires a UUID and rejects anything else, so a non-UUID value is
 * dropped rather than risking a failed purchase. Absent a UUID we simply omit
 * the field — that is exactly today's behaviour, so this degrades to a no-op
 * if the backend does not surface one.
 */
async function getAppAccountToken(): Promise<string | undefined> {
  if (cachedAppAccountToken !== undefined) return cachedAppAccountToken ?? undefined;
  try {
    const status = await authRequest('subscription/status/');
    const candidate =
      status?.app_account_token ?? status?.account_uuid ?? status?.user_uuid ?? null;
    cachedAppAccountToken =
      typeof candidate === 'string' && UUID_RE.test(candidate) ? candidate : null;
  } catch {
    // Leave uncached so the next purchase attempt tries again.
    return undefined;
  }
  return cachedAppAccountToken ?? undefined;
}

/** Clears the per-session account-token cache. Call on sign-out/sign-in. */
export function resetAppAccountToken() {
  cachedAppAccountToken = undefined;
}

/**
 * Hands an App Store transaction to our backend, which verifies the signed
 * JWS with Apple and grants the matching tier.
 */
async function verifyWithBackend(purchase: Purchase): Promise<VerifyOutcome> {
  // Only a logged-in user can be granted a tier. If StoreKit replays a
  // transaction while logged out, leave it unfinished so it is redelivered
  // after the next sign-in.
  const session = await retrieveUserSession();
  if (!session?.accessToken) return { kind: 'signed-out' };

  // On iOS purchaseToken carries the StoreKit 2 signed transaction (JWS),
  // which is what the backend verifies against Apple's public keys.
  const jws = purchase.purchaseToken;
  if (!jws) {
    return {
      kind: 'permanent',
      title: 'Purchase could not be applied',
      message: 'The App Store did not return a signed receipt for this purchase.',
    };
  }

  let result;
  try {
    result = await authRequestWithStatus('subscription/apple/verify/', {
      method: 'POST',
      body: JSON.stringify({
        jws,
        // Correlation only — the server reads both out of the signed payload
        // and logs a warning if they disagree.
        transaction_id: transactionKey(purchase),
        product_id: purchase.productId,
      }),
    });
  } catch (err: any) {
    // Offline, timeout, or an expired session. Both are transient.
    return { kind: 'retry', message: err?.message ?? GENERIC_RETRY };
  }

  // Both `ok` and `verified` are present and true on success; every failure
  // response omits both.
  if (result.ok && (result.data?.ok || result.data?.verified)) return { kind: 'granted' };

  // A 2xx that somehow lacks the flags, or a body we could not parse (proxy
  // error page), is treated as the 500 row: don't finish, retry.
  if (result.ok || !result.parsed) {
    return { kind: 'retry', message: GENERIC_RETRY };
  }

  return classifyFailure(result.status, result.data);
}

function IosIapProvider({ children }: { children: React.ReactNode }) {
  const [purchasingTier, setPurchasingTier] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [entitlementVersion, setEntitlementVersion] = useState(0);
  const [productsFetched, setProductsFetched] = useState(false);
  const [iapConfigured, setIapConfigured] = useState(true);
  // Tier → SKU. Seeded from the compiled-in constant and replaced by the
  // backend's plans payload once it loads, so the SKU map lives in one place.
  const [skuByTier, setSkuByTier] = useState<Record<number, string>>(IOS_SKU_BY_TIER);

  // Transaction ids already granted during this app session, so a StoreKit
  // replay does not trigger a second verify round-trip.
  const granted = useRef<Set<string>>(new Set());
  // Transaction ids the backend permanently refused. Kept so a redelivery does
  // not re-alert on every launch; deliberately never finished, so signing into
  // the owning account still resolves them.
  const refused = useRef<Set<string>>(new Set());
  // Transaction ids currently being verified. The purchase listener and the
  // connect-time sweep can both reach the same transaction; without this they
  // race past the granted/refused checks and verify it twice.
  const inFlight = useRef<Set<string>>(new Set());
  // True while a user-initiated purchase is in flight. Background redeliveries
  // must not pop alerts at the user out of nowhere.
  const interactive = useRef(false);
  // useIAP's listeners are registered once, so reach finishTransaction through a
  // ref rather than capturing the first render's binding.
  const finishRef = useRef<((args: { purchase: Purchase }) => Promise<void>) | null>(null);

  /**
   * Runs a transaction to ground: verify it, finish it on success, and decide
   * whether the user needs to hear about a failure. Reports which of the four
   * outcomes happened, or 'skipped' when this transaction was already settled
   * (or is being settled) during this session.
   */
  const settle = useCallback(
    async (purchase: Purchase, silent: boolean): Promise<VerifyOutcome['kind'] | 'skipped'> => {
      const key = transactionKey(purchase);
      if (granted.current.has(key) || refused.current.has(key) || inFlight.current.has(key)) {
        return 'skipped';
      }
      inFlight.current.add(key);

      let outcome: VerifyOutcome;
      try {
        outcome = await verifyWithBackend(purchase);

        switch (outcome.kind) {
          case 'granted':
            try {
              // Only finish once the entitlement is safely recorded
              // server-side. Finishing earlier would discard a transaction we
              // failed to honor.
              await finishRef.current?.({ purchase });
              granted.current.add(key);
            } catch (err) {
              // The tier is granted; StoreKit just didn't dismiss the
              // transaction. Leave it out of `granted` so the next replay
              // retries the finish — verify is idempotent, so that is free.
              console.warn('Could not finish App Store transaction:', err);
            }
            break;

          case 'signed-out':
            // Nothing to attribute it to yet; syncPendingPurchases picks it up
            // after the next sign-in.
            break;

          case 'retry':
            if (silent) console.warn('Apple verify deferred:', outcome.message);
            else Alert.alert('Purchase not applied yet', outcome.message);
            break;

          case 'permanent':
            refused.current.add(key);
            // Always surface these, even on a background replay: silence would
            // leave the user paying Apple for a plan the app never grants, with
            // no explanation of why.
            Alert.alert(outcome.title, outcome.message);
            break;
        }
      } finally {
        inFlight.current.delete(key);
      }
      return outcome.kind;
    },
    []
  );

  const onPurchaseSuccess = useCallback(
    async (purchase: Purchase) => {
      try {
        if ((await settle(purchase, !interactive.current)) === 'granted') {
          setEntitlementVersion((v) => v + 1);
        }
      } finally {
        interactive.current = false;
        setPurchasingTier(null);
      }
    },
    [settle]
  );

  const onPurchaseError = useCallback((error: { code?: ErrorCode | string; message?: string }) => {
    interactive.current = false;
    setPurchasingTier(null);
    if (error?.code === ErrorCode.UserCancelled) return;
    if (error?.code === ErrorCode.AlreadyOwned) {
      Alert.alert(
        'Already subscribed',
        'This subscription is already active on your Apple ID. Use Restore Purchases to link it to your account.'
      );
      return;
    }
    Alert.alert('Purchase failed', error?.message ?? 'The App Store could not complete this purchase.');
  }, []);

  const { connected, subscriptions, fetchProducts, requestPurchase, finishTransaction } = useIAP({
    onPurchaseSuccess,
    onPurchaseError,
  });

  finishRef.current = finishTransaction;

  // The backend owns the SKU map (`apple_product_id` per tier); the constant is
  // only a fallback for when this call fails. The two must not disagree.
  useEffect(() => {
    let cancelled = false;
    authRequest('subscription/plans/')
      .then((plans) => {
        if (cancelled || !plans) return;
        if (typeof plans.iap_configured === 'boolean') setIapConfigured(plans.iap_configured);
        const fromServer: Record<number, string> = {};
        for (const tier of plans.tiers ?? []) {
          if (tier?.apple_product_id) fromServer[tier.id] = tier.apple_product_id;
        }
        if (Object.keys(fromServer).length > 0) setSkuByTier(fromServer);
      })
      .catch(() => {
        // Keep the compiled-in map; the Plans screen still works offline.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the StoreKit products once connected. Apple requires that the prices
  // shown come from StoreKit, not from our own backend.
  useEffect(() => {
    if (!connected) return;
    const skus = Object.values(skuByTier);
    if (skus.length === 0) return;
    let cancelled = false;
    fetchProducts({ skus, type: 'subs' })
      .catch((err) => console.error('Failed to load App Store products:', err))
      // Mark the attempt either way. Leaving this false on failure pins the
      // Plans screen on a spinner forever instead of falling through to
      // "Coming Soon".
      .finally(() => {
        if (!cancelled) setProductsFetched(true);
      });
    return () => {
      cancelled = true;
    };
  }, [connected, skuByTier, fetchProducts]);

  const tierBySku = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [tier, sku] of Object.entries(skuByTier)) map[sku] = Number(tier);
    return map;
  }, [skuByTier]);

  const productsByTier = useMemo(() => {
    const map: Record<number, ProductSubscription | undefined> = {};
    for (const product of subscriptions) {
      const tier = tierBySku[product.id];
      if (tier !== undefined) map[tier] = product;
    }
    return map;
  }, [subscriptions, tierBySku]);

  /**
   * Re-verifies every unfinished StoreKit transaction without saying anything
   * to the user. Covers the purchase that completed while logged out, and the
   * one whose verify call never landed because the app was killed.
   */
  const syncPendingPurchases = useCallback(async () => {
    const session = await retrieveUserSession();
    if (!session?.accessToken) return;
    try {
      const purchases = await fetchAvailablePurchases();
      let anyGranted = false;
      for (const purchase of purchases) {
        if ((await settle(purchase, true)) === 'granted') anyGranted = true;
      }
      if (anyGranted) setEntitlementVersion((v) => v + 1);
    } catch (err) {
      console.warn('Could not sync pending App Store purchases:', err);
    }
  }, [settle]);

  // Sweep once per connection. StoreKit redelivers unfinished transactions on
  // connect, but only to the purchase listener — a transaction that was already
  // delivered before we had a session would otherwise never be retried.
  useEffect(() => {
    if (!connected) return;
    syncPendingPurchases();
  }, [connected, syncPendingPurchases]);

  const purchase = useCallback(
    async (tierId: number) => {
      const sku = skuByTier[tierId];
      if (!sku) {
        Alert.alert('Unavailable', 'That plan is not available on iOS right now.');
        return;
      }
      setPurchasingTier(tierId);
      interactive.current = true;
      try {
        // Apple echoes appAccountToken back on every transaction and
        // notification, letting the backend attribute a purchase whose verify
        // never arrived.
        const appAccountToken = await getAppAccountToken();
        // Within one subscription group StoreKit turns this into an
        // upgrade/downgrade of the existing subscription automatically, and
        // shows its own confirmation sheet with the prorated amount.
        await requestPurchase({
          type: 'subs',
          request: { apple: { sku, ...(appAccountToken ? { appAccountToken } : {}) } },
        });
      } catch (err: any) {
        interactive.current = false;
        setPurchasingTier(null);
        if (err?.code !== ErrorCode.UserCancelled) {
          Alert.alert('Purchase failed', err?.message ?? 'The App Store could not start this purchase.');
        }
      }
    },
    [requestPurchase, skuByTier]
  );

  /**
   * Re-sends the subscriptions already attached to this Apple ID so a reinstall
   * or a second device regains its tier. Uses the value-returning root API
   * rather than the hook's state-filling variant so the outcome can be reported
   * to the user — App Review always exercises this button.
   */
  const restore = useCallback(async () => {
    const session = await retrieveUserSession();
    if (!session?.accessToken) {
      Alert.alert('Sign in first', 'Log in to your My Congress account, then restore your purchases.');
      return;
    }
    setRestoring(true);
    try {
      const purchases = await fetchAvailablePurchases();
      // A restore is user-initiated, so a permanent refusal (a subscription
      // linked to another account, most importantly) must be reported. Clear
      // the suppression set so it is re-evaluated rather than silently skipped.
      refused.current.clear();
      let count = 0;
      // settle() has already explained anything that went wrong; a second
      // "nothing to restore" on top of that would just contradict it.
      let reported = false;
      for (const purchase of purchases) {
        // Already granted this session still counts as "you have this".
        if (granted.current.has(transactionKey(purchase))) {
          count += 1;
          continue;
        }
        const outcome = await settle(purchase, false);
        if (outcome === 'granted') count += 1;
        else if (outcome === 'retry' || outcome === 'permanent') reported = true;
      }
      if (count > 0) {
        setEntitlementVersion((v) => v + 1);
        Alert.alert('Restored', 'Your subscription has been restored to this account.');
      } else if (!reported) {
        Alert.alert(
          'Nothing to restore',
          'No active My Congress subscription was found on this Apple ID.'
        );
      }
    } catch (err: any) {
      Alert.alert('Restore failed', err?.message ?? 'Could not reach the App Store.');
    } finally {
      setRestoring(false);
    }
  }, [settle]);

  const value = useMemo<IapContextValue>(
    () => ({
      ready: connected && productsFetched,
      iapConfigured,
      productsByTier,
      purchasingTier,
      restoring,
      entitlementVersion,
      purchase,
      restore,
      openManageSubscriptions: openAppleSubscriptionSettings,
      syncPendingPurchases,
    }),
    [
      connected,
      productsFetched,
      iapConfigured,
      productsByTier,
      purchasingTier,
      restoring,
      entitlementVersion,
      purchase,
      restore,
      syncPendingPurchases,
    ]
  );

  return <IapContext.Provider value={value}>{children}</IapContext.Provider>;
}

/**
 * Mounts the StoreKit connection for the whole app on iOS. Keeping it above the
 * navigator (rather than inside the Plans screen) means a transaction that
 * completes while the app is backgrounded — or one Apple redelivers after a
 * crash — still reaches the backend and gets finished.
 *
 * On Android and web this is an inert pass-through; those platforms keep using
 * Stripe Checkout.
 */
export function IapProvider({ children }: { children: React.ReactNode }) {
  if (!USE_STOREKIT) {
    return <IapContext.Provider value={NOOP_VALUE}>{children}</IapContext.Provider>;
  }
  return <IosIapProvider>{children}</IosIapProvider>;
}
