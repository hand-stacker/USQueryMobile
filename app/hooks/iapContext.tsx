import {
  deepLinkToSubscriptions,
  ErrorCode,
  getAvailablePurchases as fetchAvailablePurchases,
  useIAP,
  type ProductSubscription,
  type Purchase,
} from 'expo-iap';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import {
  APPLE_MANAGE_SUBSCRIPTIONS_URL,
  IOS_SKU_BY_TIER,
  IOS_SUBSCRIPTION_SKUS,
  IOS_TIER_BY_SKU,
  USE_STOREKIT,
} from '../../constants/iap';
import { retrieveUserSession } from '../encrypted-storage/functions';
import { authRequest } from './authRequest';

interface IapContextValue {
  /** True once StoreKit is connected and the products have loaded. */
  ready: boolean;
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
}

/**
 * StoreKit subscriptions can only be changed or cancelled in the App Store's
 * settings, so send the user there rather than to our billing portal.
 */
async function openAppleSubscriptionSettings() {
  try {
    await deepLinkToSubscriptions({});
  } catch {
    await Linking.openURL(APPLE_MANAGE_SUBSCRIPTIONS_URL).catch(() => {});
  }
}

const NOOP_VALUE: IapContextValue = {
  ready: false,
  productsByTier: {},
  purchasingTier: null,
  restoring: false,
  entitlementVersion: 0,
  purchase: async () => {},
  restore: async () => {},
  openManageSubscriptions: openAppleSubscriptionSettings,
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
 * Hands an App Store transaction to our backend, which verifies the signed
 * JWS with Apple and grants the matching tier. Returns true when the backend
 * has taken ownership of the transaction.
 */
async function verifyWithBackend(purchase: Purchase): Promise<boolean> {
  // Only a logged-in user can be granted a tier. If StoreKit replays a
  // transaction while logged out, leave it unfinished so it is redelivered
  // after the next sign-in.
  const session = await retrieveUserSession();
  if (!session?.accessToken) return false;

  const result = await authRequest('subscription/apple/verify/', {
    method: 'POST',
    body: JSON.stringify({
      // On iOS purchaseToken carries the StoreKit 2 signed transaction (JWS),
      // which is what the backend verifies against Apple's public keys.
      jws: purchase.purchaseToken ?? null,
      transaction_id: transactionKey(purchase),
      product_id: purchase.productId,
    }),
  });

  if (result?.ok || result?.verified) return true;
  throw new Error(result?.error ?? 'Could not verify your purchase with our servers.');
}

function IosIapProvider({ children }: { children: React.ReactNode }) {
  const [purchasingTier, setPurchasingTier] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [entitlementVersion, setEntitlementVersion] = useState(0);
  const [productsFetched, setProductsFetched] = useState(false);
  // Transaction ids already handed to the backend during this app session, so a
  // StoreKit replay does not trigger a second verify round-trip.
  const handled = useRef<Set<string>>(new Set());
  // useIAP's listeners are registered once, so reach finishTransaction through a
  // ref rather than capturing the first render's binding.
  const finishRef = useRef<((args: { purchase: Purchase }) => Promise<void>) | null>(null);

  const onPurchaseSuccess = useCallback(async (purchase: Purchase) => {
    const key = transactionKey(purchase);
    if (handled.current.has(key)) return;
    handled.current.add(key);
    try {
      const granted = await verifyWithBackend(purchase);
      if (!granted) {
        // Not logged in yet — drop the guard so the replay is retried later.
        handled.current.delete(key);
        return;
      }
      // Only finish once the entitlement is safely recorded server-side.
      // Finishing earlier would discard a transaction we failed to honor.
      await finishRef.current?.({ purchase });
      setEntitlementVersion((v) => v + 1);
    } catch (err: any) {
      handled.current.delete(key);
      Alert.alert(
        'Purchase not applied yet',
        `${err?.message ?? 'We could not confirm your purchase.'} You have not been charged twice — reopen the app or tap Restore Purchases and we will finish setting it up.`
      );
    } finally {
      setPurchasingTier(null);
    }
  }, []);

  const onPurchaseError = useCallback((error: { code?: ErrorCode | string; message?: string }) => {
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

  // Load the StoreKit products once connected. Apple requires that the prices
  // shown come from StoreKit, not from our own backend.
  useEffect(() => {
    if (!connected || productsFetched) return;
    let cancelled = false;
    fetchProducts({ skus: IOS_SUBSCRIPTION_SKUS, type: 'subs' })
      .then(() => {
        if (!cancelled) setProductsFetched(true);
      })
      .catch((err) => console.error('Failed to load App Store products:', err));
    return () => {
      cancelled = true;
    };
  }, [connected, productsFetched, fetchProducts]);

  const productsByTier = useMemo(() => {
    const map: Record<number, ProductSubscription | undefined> = {};
    for (const product of subscriptions) {
      const tier = IOS_TIER_BY_SKU[product.id];
      if (tier !== undefined) map[tier] = product;
    }
    return map;
  }, [subscriptions]);

  const purchase = useCallback(
    async (tierId: number) => {
      const sku = IOS_SKU_BY_TIER[tierId];
      if (!sku) {
        Alert.alert('Unavailable', 'That plan is not available on iOS right now.');
        return;
      }
      setPurchasingTier(tierId);
      try {
        // Within one subscription group StoreKit turns this into an
        // upgrade/downgrade of the existing subscription automatically.
        await requestPurchase({ type: 'subs', request: { apple: { sku } } });
      } catch (err: any) {
        setPurchasingTier(null);
        if (err?.code !== ErrorCode.UserCancelled) {
          Alert.alert('Purchase failed', err?.message ?? 'The App Store could not start this purchase.');
        }
      }
    },
    [requestPurchase]
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
      let granted = 0;
      for (const purchase of purchases) {
        const key = transactionKey(purchase);
        try {
          if (await verifyWithBackend(purchase)) {
            await finishTransaction({ purchase });
            handled.current.add(key);
            granted += 1;
          }
        } catch {
          // Keep going: one bad transaction shouldn't block the others.
        }
      }
      if (granted > 0) {
        setEntitlementVersion((v) => v + 1);
        Alert.alert('Restored', 'Your subscription has been restored to this account.');
      } else {
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
  }, [finishTransaction]);

  const value = useMemo<IapContextValue>(
    () => ({
      ready: connected && productsFetched,
      productsByTier,
      purchasingTier,
      restoring,
      entitlementVersion,
      purchase,
      restore,
      openManageSubscriptions: openAppleSubscriptionSettings,
    }),
    [connected, productsFetched, productsByTier, purchasingTier, restoring, entitlementVersion, purchase, restore]
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
