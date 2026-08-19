import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LOCAL_TIER_CATALOG, TERMS_OF_USE_URL, USE_STOREKIT } from '../../constants/iap';
import { retrieveUserSession } from '../encrypted-storage/functions';
import { authRequest, authRequestWithStatus } from '../hooks/authRequest';
import { setSubscriptionTier, TIER_FREE, TIER_LOGGED_OUT } from '../hooks/subscriptionTier';
import { useIapContext } from '../hooks/iapContext';
import { openStripeUrl } from '../hooks/openStripeUrl';
import {
  EXTERNAL_BILLING_BODY,
  EXTERNAL_BILLING_LABEL,
  EXTERNAL_BILLING_TITLE,
  handleAppStoreConflict,
  isAppleManaged,
  isStripeManaged,
  type SubStatus,
} from '../hooks/subscriptionBilling';
import { ThemeContext } from '../theme/themeContext';


// Tier ids are not in upgrade order. The real ladder is
// free < plus < plus pro < premium < special, so map each id to its rank and
// compare ranks (not ids) when deciding upgrade vs. downgrade.
const TIER_RANK: Record<number, number> = {
  0: 0, // Free
  1: 1, // Plus
  4: 2, // Plus Pro
  2: 3, // Premium
  3: 4, // Special (placeholder, not shown on the plans page)
};
const rankOf = (tierId: number) => TIER_RANK[tierId] ?? tierId;

interface PlansProps {
  navigation: any;
}

interface Tier {
  id: number;
  name: string;
  price: string;
  price_period: string;
  // Null means "no data for this limit" — the row is omitted rather than
  // rendered with a wrong number. Only the local iOS catalog produces nulls.
  starred_members_limit: number | null;
  starred_bills_limit: number | null;
  predictions_per_day: number | null;
  chat_messages_per_day: number | null;
  // App Store SKU for this tier, null for Free. The server is the source of
  // truth for the SKU map; constants/iap.ts is only a fallback.
  apple_product_id?: string | null;
}

interface PlansData {
  // True when the backend has Apple IAP credentials configured.
  iap_configured?: boolean;
  stripe_configured: boolean;
  subscriptions_enabled: boolean;
  tiers: Tier[];
}

export default function PlansScreen({ navigation }: PlansProps) {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);

  const [plansData, setPlansData] = useState<PlansData | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  // The plans fetch failed outright — distinct from "loaded, but sales are off".
  const [loadError, setLoadError] = useState(false);
  // null = idle, -1 = cancel in flight, -2 = reactivate in flight,
  // -4 = cancelling a scheduled downgrade in flight, N = upgrading tier N
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // On iOS every *sale* goes through StoreKit (App Store Review guideline
  // 3.1.1); Stripe Checkout is Android/web only.
  const iap = useIapContext();

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const session = await retrieveUserSession();
      const loggedIn = !!session?.accessToken;
      setIsLoggedIn(loggedIn);
      if (!loggedIn) setSubscriptionTier(TIER_LOGGED_OUT);

      if (USE_STOREKIT) {
        // iOS never asks the backend for plans: prices must be StoreKit's, and
        // the screen has to render for signed-out users. See LOCAL_TIER_CATALOG.
        setPlansData({
          iap_configured: iap.iapConfigured,
          stripe_configured: false,
          subscriptions_enabled: iap.subscriptionsEnabled,
          tiers: LOCAL_TIER_CATALOG,
        });
      } else {
        // Checked on the status rather than trusting the body, so a 401/5xx
        // surfaces as an error state instead of rendering as a plan list.
        const plans = await authRequestWithStatus('subscription/plans/');
        if (plans.ok && Array.isArray(plans.data?.tiers)) {
          setPlansData(plans.data as PlansData);
        } else {
          console.error('Failed to load plans:', plans.status, plans.data);
          setPlansData(null);
          setLoadError(true);
        }
      }

      if (loggedIn) {
        try {
          const status: SubStatus = await authRequest('subscription/status/');
          setSubStatus(status);
          // This screen runs on every focus and after every plan change, so it
          // is the freshest read of the tier in the app — share it.
          setSubscriptionTier(status?.tier ?? TIER_FREE);
        } catch {
          // Non-fatal: user may not have a subscription yet
        }
      } else {
        setSubStatus(null);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [iap.iapConfigured, iap.subscriptionsEnabled]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Which processor owns this subscription. Never branch management on
  // Platform.OS: a user who subscribed through Stripe on the web and then opens
  // the iOS app is still a Stripe customer, and sending them to Apple's
  // settings shows them an empty list — Apple has no record of them.
  const appleManaged = isAppleManaged(subStatus);
  // A live Stripe subscription. The backend refuses an App Store purchase in
  // this state (409, "subscription billed through our website") so that nobody
  // pays twice — meaning iOS has no in-app upgrade path for these users.
  const stripeManaged = isStripeManaged(subStatus) && (subStatus?.tier ?? 0) > 0;
  const storeKitPurchases = USE_STOREKIT && !stripeManaged;
  // A subscriber the App Store does not bill, inside the iOS build. Guideline
  // 3.1.1 means we may state that the subscription is billed elsewhere but may
  // not link, name a site or processor, or put a tappable route to it on
  // screen — so EVERY control is withdrawn and replaced with plain text.
  // Cancel included: it runs against our own backend, which is still an
  // alternative management path for a subscription Apple cannot see.
  const externallyBilled = USE_STOREKIT && stripeManaged;

  // The backend grants the tier when it verifies an App Store transaction, so
  // pull the fresh status once that happens.
  useEffect(() => {
    if (iap.entitlementVersion > 0) loadData();
  }, [iap.entitlementVersion, loadData]);

  // -3 = portal URL fetch in flight
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    if (appleManaged) {
      await iap.openManageSubscriptions();
      return;
    }
    // Unreachable from the UI on iOS — the button is not rendered — but the
    // portal is a purchasing mechanism, so refuse rather than trust that.
    if (USE_STOREKIT) {
      Alert.alert(EXTERNAL_BILLING_TITLE, EXTERNAL_BILLING_BODY);
      return;
    }
    setPortalLoading(true);
    try {
      const { status, data: result } = await authRequestWithStatus('subscription/portal/', {
        method: 'POST',
      });
      // Backstop: the subscription became App Store managed since we loaded.
      if (handleAppStoreConflict(status, result, loadData)) return;
      if (result?.portal_url) {
        // Opens in an in-app browser that returns to the app via the deep link.
        // Android/web only — openStripeUrl refuses on iOS.
        await openStripeUrl(result.portal_url);
        // The user may have updated their card or cancelled inside the portal —
        // refresh so the screen reflects any change.
        await loadData();
      } else {
        Alert.alert('Error', result?.error ?? 'Could not open billing portal.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not open billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  const formatEffectiveDate = (val?: string | null) => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Commits a tier change. Handles all create-checkout/ response shapes:
  // new-signup checkout_url, modified upgrade/downgrade, and 402 payment_failed.
  const runCheckout = async (tierId: number) => {
    setActionLoading(tierId);
    try {
      const { status, data: result } = await authRequestWithStatus('subscription/create-checkout/', {
        method: 'POST',
        body: JSON.stringify({ tier: tierId }),
      });

      // The subscription is App Store managed — Stripe has no authority over
      // it. Shouldn't be reachable; handled rather than silently failing.
      if (handleAppStoreConflict(status, result, loadData)) return;

      if (result.checkout_url) {
        // New-subscriber hosted checkout. Opens in an in-app browser that
        // bounces back to the app; Stripe's success_url carries ?status=success
        // and cancel_url ?status=cancel via the deep link.
        const returnedUrl = await openStripeUrl(result.checkout_url);
        if (returnedUrl && !returnedUrl.includes('status=cancel')) {
          navigation.navigate('Checkout_Success');
        } else {
          // Cancelled, dismissed, or system-browser fallback — just refresh.
          // The webhook is the source of truth and will finalize regardless.
          await loadData();
        }
      } else if (result.change_cancelled || result.resumed) {
        // Re-selected the current tier: a pending downgrade was cancelled or a
        // pending cancellation resumed. This is an in-place change, not a new
        // purchase — refresh the screen rather than show the success page.
        Alert.alert('Done', result.message ?? 'Your subscription was updated.');
        await loadData();
      } else if (result.modified) {
        navigation.navigate('Checkout_Success', {
          instant: true,
          message: result.message,
        });
      } else if (result.payment_failed) {
        Alert.alert(
          'Payment Failed',
          result.error ?? 'Your card could not be charged. Update your payment method and try again.',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Update Card', onPress: openPortal },
          ]
        );
      } else {
        Alert.alert('Error', result.error ?? 'Something went wrong. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not complete the action. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Previews a tier change, shows a confirm dialog with the exact charge /
  // effective date, then commits via runCheckout. New subscribers (no active
  // sub) skip straight to hosted checkout.
  const changePlan = async (tierId: number) => {
    // StoreKit owns pricing, proration and confirmation on iOS — hand off to the
    // App Store sheet instead of previewing a Stripe charge. There is no Apple
    // equivalent of preview-change/; all three SKUs share one subscription
    // group, so StoreKit computes the proration and shows its own sheet.
    if (storeKitPurchases) {
      await iap.purchase(tierId);
      return;
    }
    // Live Stripe subscription on iOS. A StoreKit purchase here would be
    // rejected by the backend *after* Apple had already charged the user, and
    // 3.1.1 forbids offering the Stripe route instead — so state the situation
    // and offer nothing to tap.
    if (USE_STOREKIT) {
      Alert.alert(EXTERNAL_BILLING_TITLE, EXTERNAL_BILLING_BODY);
      return;
    }
    setActionLoading(tierId);
    let preview: any;
    try {
      const previewResult = await authRequestWithStatus('subscription/preview-change/', {
        method: 'POST',
        body: JSON.stringify({ tier: tierId }),
      });
      if (handleAppStoreConflict(previewResult.status, previewResult.data, loadData)) {
        setActionLoading(null);
        return;
      }
      preview = previewResult.data;
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not load plan change details. Please try again.');
      setActionLoading(null);
      return;
    }
    setActionLoading(null);

    // No active subscription → nothing to prorate, go straight to checkout.
    if (preview.requires_checkout) {
      runCheckout(tierId);
      return;
    }
    if (preview.error) {
      Alert.alert('Error', preview.error);
      return;
    }

    const tierName = preview.new_tier_name ?? 'this plan';

    if (preview.is_upgrade) {
      const charge = Number(preview.immediate_charge ?? 0).toFixed(2);
      const credit = Number(preview.credit_applied ?? 0);
      const creditLine = credit > 0 ? ` (after a $${credit.toFixed(2)} credit for unused time)` : '';
      const recurring = preview.recurring_price ? ` Then renews at ${preview.recurring_price}.` : '';
      Alert.alert(
        `Upgrade to ${tierName}`,
        `You'll be charged $${charge} today${creditLine}.${recurring} Your billing date resets to today.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm & Pay', onPress: () => runCheckout(tierId) },
        ]
      );
    } else {
      const when = formatEffectiveDate(preview.effective_date);
      const recurring = preview.recurring_price ? ` It then renews at ${preview.recurring_price}.` : '';
      Alert.alert(
        `Switch to ${tierName}`,
        `Your plan switches to ${tierName}${when ? ` on ${when}` : ' at your next billing date'}. ` +
          `You keep your current features until then — no charge today.${recurring}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => runCheckout(tierId) },
        ]
      );
    }
  };

  const handleCancel = () => {
    // An App Store subscription can only be cancelled from the App Store's own
    // settings; Apple exposes no server API for it, so our backend has no
    // authority to end it.
    if (appleManaged) {
      Alert.alert(
        'Cancel Subscription',
        'Subscriptions bought through the App Store are cancelled in your Apple ID settings. You keep access until the end of the current billing period.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => iap.openManageSubscriptions() },
        ]
      );
      return;
    }
    Alert.alert(
      'Cancel Subscription',
      'Your plan stays active until the end of the current billing period. After that your account reverts to Free.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(-1);
            try {
              const { status, data: result } = await authRequestWithStatus('subscription/cancel/', {
                method: 'POST',
              });
              if (handleAppStoreConflict(status, result, loadData)) return;
              if (result.cancelled) {
                Alert.alert('Done', result.message);
                await loadData();
              } else {
                Alert.alert('Error', result.error ?? 'Could not cancel subscription.');
              }
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not cancel subscription.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    setActionLoading(-2);
    try {
      const { status, data: result } = await authRequestWithStatus('subscription/reactivate/', {
        method: 'POST',
      });
      if (handleAppStoreConflict(status, result, loadData)) return;
      if (result.reactivated) {
        Alert.alert('Reactivated', result.message);
        await loadData();
      } else {
        Alert.alert('Error', result.error ?? 'Could not reactivate subscription.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not reactivate subscription.');
    } finally {
      setActionLoading(null);
    }
  };

  // Cancels a pending deferred downgrade by re-selecting the current tier.
  // create-checkout/ responds with { change_cancelled: true } in this case.
  const handleCancelScheduledChange = async () => {
    const tierId = subStatus?.tier ?? 0;
    setActionLoading(-4);
    try {
      const { status, data: result } = await authRequestWithStatus('subscription/create-checkout/', {
        method: 'POST',
        body: JSON.stringify({ tier: tierId }),
      });
      if (handleAppStoreConflict(status, result, loadData)) return;
      if (result.change_cancelled || result.modified) {
        Alert.alert('Done', result.message ?? 'Your scheduled plan change was cancelled.');
        await loadData();
      } else {
        Alert.alert('Error', result.error ?? 'Could not cancel the scheduled change.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not cancel the scheduled change.');
    } finally {
      setActionLoading(null);
    }
  };

  // Null when there is no number to show, so the row is omitted rather than
  // rendered as "null vote predictions/day".
  const predictionsLabel = (val: number | null, tierId?: number) =>
    tierId !== undefined && (tierId === 2 || tierId === 3)
      ? { label: 'Unlimited vote predictions', included: true }
      : val === null
      ? null
      : val === 0
      ? { label: 'Vote predictions', included: false }
      : { label: `${val} vote predictions/day`, included: true };

  const chatLabel = (val: number | null, tierId?: number) =>
    tierId !== undefined && (tierId === 2 || tierId === 3)
      ? { label: '5M tokens/month AI chats', included: true }
      : val === null
      ? null
      : val === 0
      ? { label: 'AI chatbot', included: false }
      : { label: `${val} AI chats/day`, included: true };

  const renderCardActions = (tier: Tier) => {
    const currentTier = subStatus?.tier ?? 0;
    const isCurrent = isLoggedIn && currentTier === tier.id;
    const isUpgrade = isLoggedIn && rankOf(tier.id) > rankOf(currentTier);
    const isDowngrade = isLoggedIn && rankOf(tier.id) < rankOf(currentTier);
    // On iOS "can we sell this?" means the backend has Apple IAP configured,
    // StoreKit is connected, and the product loaded.
    const canSubscribe =
      plansData?.subscriptions_enabled &&
      (storeKitPurchases
        ? iap.iapConfigured && iap.ready && !!iap.productsByTier[tier.id]
        : !USE_STOREKIT && plansData?.stripe_configured);
    // An existing subscriber must always be able to reach subscription
    // management, even while new sales are switched off.
    const canManage = appleManaged
      ? true
      : plansData?.subscriptions_enabled && plansData?.stripe_configured;
    // The portal is a purchasing mechanism, so it is never surfaced on iOS.
    const canOpenPortal = canManage && !externallyBilled;
    // StoreKit is still connecting / fetching products — not the same as the
    // product being unavailable, so don't say "Coming Soon" yet.
    const storeLoading = storeKitPurchases && !iap.ready;
    // StoreKit tracks its own in-flight tier; Stripe uses the actionLoading slot.
    const isBusy = storeKitPurchases ? iap.purchasingTier === tier.id : actionLoading === tier.id;
    const cancelPending = subStatus?.cancel_at_period_end ?? false;
    // This card is the target of a pending deferred downgrade.
    const isScheduledTarget =
      isLoggedIn && !cancelPending && subStatus?.change_at_period_end === tier.id;
    // A deferred downgrade is scheduled away from the current (higher) tier.
    const hasScheduledDowngrade =
      isLoggedIn &&
      !cancelPending &&
      (subStatus?.change_at_period_end ?? 0) > 0 &&
      rankOf(subStatus!.change_at_period_end!) < rankOf(currentTier);

    // One rule, stated once so no branch below can leak a control: on iOS a
    // subscriber the App Store doesn't bill gets no actionable card at all.
    // The current-plan card keeps its badge, handled inside that branch.
    if (externallyBilled && !isCurrent) {
      return (
        <View style={[styles.btn, styles.btnDisabled]}>
          <Text style={[styles.btnText, { color: theme.subtext }]}>{EXTERNAL_BILLING_LABEL}</Text>
        </View>
      );
    }

    if (isCurrent) {
      return (
        <View>
          <View style={styles.currentBadge}>
            <Ionicons name="checkmark-circle" size={16} color={theme.primary} style={{ marginRight: 6 }} />
            <Text style={styles.currentBadgeText}>Current Plan</Text>
          </View>
          {tier.id > 0 && externallyBilled && (
            <View style={[styles.btn, styles.btnDisabled, { marginTop: 10 }]}>
              <Text style={[styles.btnText, { color: theme.subtext }]}>{EXTERNAL_BILLING_LABEL}</Text>
            </View>
          )}
          {tier.id > 0 && !externallyBilled && canManage && (
            <>
              {hasScheduledDowngrade && !appleManaged && (
                <Pressable
                  style={[styles.btn, styles.btnPrimary, { marginTop: 10 }]}
                  onPress={handleCancelScheduledChange}
                  disabled={actionLoading === -4}
                >
                  {actionLoading === -4 ? (
                    <ActivityIndicator color={theme.innerText} />
                  ) : (
                    <Text style={[styles.btnText, { color: theme.innerText }]}>Switch back to {tier.name}</Text>
                  )}
                </Pressable>
              )}
              {cancelPending ? (
                <Pressable
                  style={[styles.btn, styles.btnOutline, { marginTop: 10 }]}
                  // Re-enabling auto-renew on an App Store subscription is done
                  // in Apple's settings, not through our backend.
                  onPress={appleManaged ? iap.openManageSubscriptions : handleReactivate}
                  disabled={!appleManaged && actionLoading === -2}
                >
                  {!appleManaged && actionLoading === -2 ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : (
                    <Text style={[styles.btnText, { color: theme.primary }]}>Reactivate Subscription</Text>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.btn, styles.btnDanger, { marginTop: 10 }]}
                  onPress={handleCancel}
                  disabled={actionLoading === -1}
                >
                  {actionLoading === -1 ? (
                    <ActivityIndicator color={theme.subtext} />
                  ) : (
                    <Text style={[styles.btnText, { color: theme.subtext }]}>Cancel Subscription</Text>
                  )}
                </Pressable>
              )}
              {canOpenPortal && (
                <Pressable
                  style={[styles.btn, styles.btnSecondary, { marginTop: 8 }, portalLoading && { opacity: 0.75 }]}
                  onPress={openPortal}
                  disabled={portalLoading}
                >
                  {portalLoading
                    ? <ActivityIndicator color={theme.text} />
                    : <Text style={[styles.btnText, { color: theme.text }]}>
                        {appleManaged ? 'Manage in App Store' : 'Manage via Portal'}
                      </Text>}
                </Pressable>
              )}
            </>
          )}
        </View>
      );
    }

    if (isDowngrade && canManage) {
      // Reverting to Free is a cancellation, not a plan change — the backend
      // rejects tier 0 on preview/checkout ("invalid tier"). Route the Free
      // card to handleCancel (which uses the -1 action slot) instead.
      const isFree = tier.id === 0;
      // A pending cancellation already drops to Free at period end, so the
      // Free card is effectively the scheduled downgrade target in that case.
      if (isScheduledTarget || (isFree && cancelPending)) {
        return (
          <View style={[styles.btn, styles.btnDisabled]}>
            <Text style={[styles.btnText, { color: theme.subtext }]}>Scheduled</Text>
          </View>
        );
      }
      const slot = isFree ? -1 : tier.id;
      const downgradeBusy = isFree ? !appleManaged && actionLoading === slot : isBusy;
      return (
        <Pressable
          style={[styles.btn, styles.btnSecondary, downgradeBusy && { opacity: 0.75 }]}
          onPress={() => (isFree ? handleCancel() : changePlan(tier.id))}
          disabled={downgradeBusy}
        >
          {downgradeBusy
            ? <ActivityIndicator color={theme.text} />
            : <Text style={[styles.btnText, { color: theme.text }]}>
                {isFree && appleManaged ? 'Cancel in App Store' : `Switch to ${tier.name}`}
              </Text>}
        </Pressable>
      );
    }

    if (!isLoggedIn) {
      if (tier.id === 0) return null;
      return (
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.btnText, { color: theme.innerText }]}>Sign In to Upgrade</Text>
        </Pressable>
      );
    }

    if (isUpgrade) {
      // Stripe subscriber opening the iOS app. StoreKit can't upgrade a
      // subscription Apple never sold — the backend would reject the purchase
      // after Apple had already charged for it — and 3.1.1 forbids pointing at
      // the place that could. So the card is inert and simply says why.
      if (externallyBilled) {
        return (
          <View style={[styles.btn, styles.btnDisabled]}>
            <Text style={[styles.btnText, { color: theme.subtext }]}>{EXTERNAL_BILLING_LABEL}</Text>
          </View>
        );
      }
      if (!canSubscribe) {
        return (
          <View style={[styles.btn, styles.btnDisabled]}>
            {storeLoading
              ? <ActivityIndicator color={theme.subtext} />
              : <Text style={[styles.btnText, { color: theme.subtext }]}>Coming Soon</Text>}
          </View>
        );
      }
      return (
        <Pressable
          style={[styles.btn, styles.btnPrimary, isBusy && { opacity: 0.75 }]}
          onPress={() => changePlan(tier.id)}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator color={theme.innerText} />
          ) : (
            <Text style={[styles.btnText, { color: theme.innerText }]}>Upgrade to {tier.name}</Text>
          )}
        </Pressable>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Negative margin + matching content padding keeps card side-shadows
          from being clipped at the scroll view's edges. */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginHorizontal: -12 }} contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 12 }}>
        <Text style={styles.title}>Plans & Pricing</Text>
        <Text style={styles.subtitle}>Unlock predictions, starred content, and more.</Text>

        {loadError && (
          <View style={styles.warningBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerText, { color: '#F59E0B' }]}>
                Couldn&apos;t load plans. Check your connection and try again.
              </Text>
              <Pressable style={[styles.btn, styles.btnOutline, { marginTop: 10 }]} onPress={loadData}>
                <Text style={[styles.btnText, { color: theme.primary }]}>Retry</Text>
              </Pressable>
            </View>
          </View>
        )}

        {plansData && !plansData.subscriptions_enabled && (
          <View style={styles.infoBanner}>
            <Ionicons name="construct-outline" size={16} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { flex: 1 }]}>
              New subscriptions are temporarily unavailable while we finish building promised features. Check back soon!
            </Text>
          </View>
        )}

        {/* A Stripe subscriber inside the iOS build. Told plainly, once, at the
            top — no link and no site name, per guideline 3.1.1. */}
        {externallyBilled && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { flex: 1 }]}>{EXTERNAL_BILLING_BODY}</Text>
          </View>
        )}

        {subStatus?.cancel_at_period_end && subStatus?.period_end && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { flex: 1, color: '#F59E0B' }]}>
              Your subscription cancels on{' '}
              {new Date(subStatus.period_end).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              . You keep access until then.
            </Text>
          </View>
        )}

        {/* Pending deferred downgrade (only when not also cancelling). The user
            keeps their current tier until period_end, then switches down. */}
        {isLoggedIn &&
          !subStatus?.cancel_at_period_end &&
          (subStatus?.change_at_period_end ?? 0) > 0 && (
            <View style={styles.warningBanner}>
              <Ionicons name="time-outline" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerText, { color: '#F59E0B' }]}>
                  Your plan switches to {subStatus?.change_at_period_end_name}
                  {formatEffectiveDate(subStatus?.period_end)
                    ? ` on ${formatEffectiveDate(subStatus?.period_end)}`
                    : ' at your next billing date'}
                  . You keep {subStatus?.tier_name} until then.
                </Text>
                {/* Reverting a scheduled change is a Stripe operation; for an
                    App Store subscription it belongs to Apple's settings. */}
                <Pressable
                  style={[styles.btn, styles.btnOutline, { marginTop: 10 }]}
                  onPress={appleManaged ? iap.openManageSubscriptions : handleCancelScheduledChange}
                  disabled={!appleManaged && actionLoading === -4}
                >
                  {!appleManaged && actionLoading === -4 ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : (
                    <Text style={[styles.btnText, { color: theme.primary }]}>
                      Keep {subStatus?.tier_name}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

        {plansData?.tiers.map((tier) => {
          // Apple requires the price and name shown to be StoreKit's, not
          // ours. The Free tier has no product, so it keeps the catalog's.
          const storeProduct = USE_STOREKIT ? iap.productsByTier[tier.id] : undefined;
          const predictions = predictionsLabel(tier.predictions_per_day, tier.id);
          const chat = chatLabel(tier.chat_messages_per_day, tier.id);
          return (
          <View key={tier.id} style={[styles.card, tier.id === 1 && styles.cardHighlight]}>
            {tier.id === 1 && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>POPULAR</Text>
              </View>
            )}

            <Text style={styles.tierName}>{storeProduct?.displayName || tier.name}</Text>
            <Text style={styles.tierPrice}>{storeProduct?.displayPrice ?? tier.price}</Text>
            <Text style={styles.tierPricePeriod}>{tier.price_period}</Text>

            <View style={styles.featureList}>
              {tier.starred_members_limit !== null && (
                <FeatureRow label={`${tier.starred_members_limit} starred members`} included theme={theme} />
              )}
              {tier.starred_bills_limit !== null && (
                <FeatureRow label={`${tier.starred_bills_limit} starred bills`} included theme={theme} />
              )}
              {predictions && <FeatureRow {...predictions} theme={theme} />}
              {chat && <FeatureRow {...chat} theme={theme} />}
            </View>

            {renderCardActions(tier)}
          </View>
          );
        })}

        {/* Guideline 3.1.1 requires a way to restore previously bought
            subscriptions on a new device or after a reinstall. */}
        {USE_STOREKIT && (
          <Pressable
            style={[styles.btn, styles.btnOutline, { marginBottom: 16 }, iap.restoring && { opacity: 0.75 }]}
            onPress={() => iap.restore()}
            disabled={iap.restoring}
          >
            {iap.restoring
              ? <ActivityIndicator color={theme.primary} />
              : <Text style={[styles.btnText, { color: theme.primary }]}>Restore Purchases</Text>}
          </Pressable>
        )}

        <View style={[styles.card, { marginBottom: 0 }]}>
          <Text style={styles.aboutTitle}>About the Limits</Text>
          <Text style={styles.aboutText}>
            <Text style={{ fontWeight: '600' }}>Vote Predictions</Text>
            {
              ' — Simulated votes on any bill, powered by a neural network trained on congressional voting history.\n\n'
            }
            <Text style={{ fontWeight: '600' }}>Starred Content</Text>
            {' — Save members and bills you care about. Get push notifications on new activity.\n\n'}
            <Text style={{ fontWeight: '600' }}>AI Chatbot</Text>
            {' — Ask questions about bills and their potential impact, grounded in real congressional data.'}
          </Text>
          {/* Guideline 3.1.2 disclosures for auto-renewable subscriptions. Only
              the renewal wording is store-specific — the terms and privacy
              links are required on every platform, so they live outside the
              branch. */}
          {USE_STOREKIT ? (
            <Text style={styles.finePrint}>
              Subscriptions renew monthly until cancelled. Payment is charged to your Apple ID at
              confirmation of purchase. The subscription renews automatically unless auto-renew is
              turned off at least 24 hours before the end of the current period; your account is
              charged for renewal within 24 hours of the end of the period. You can manage or
              cancel your subscription in your Apple ID account settings.
            </Text>
          ) : (
            <>
              <Text style={styles.finePrint}>
                Subscriptions renew monthly until cancelled. Payment is charged at confirmation of
                purchase and again at the start of each renewal period. You can cancel at any time
                from the billing portal; cancellation takes effect at the end of the current period
                and you keep access until then.
              </Text>
              <Text style={[styles.finePrint, { marginTop: 8 }]}>
                Prices in USD · Billed monthly · Cancel anytime · Payments processed securely by Stripe
              </Text>
            </>
          )}
          <View style={styles.legalRow}>
            <Pressable onPress={() => Linking.openURL(TERMS_OF_USE_URL).catch(() => {})}>
              <Text style={styles.legalLink}>Terms of Use (EULA)</Text>
            </Pressable>
            <Text style={styles.finePrint}> · </Text>
            <Pressable onPress={() => navigation.navigate('Privacy_Policy')}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({ label, included, theme }: { label: string; included: boolean; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Ionicons
        name={included ? 'checkmark-circle' : 'close-circle'}
        size={18}
        color={included ? '#2ea87e' : theme.subtext}
        style={{ marginRight: 10 }}
      />
      <Text style={{ color: included ? theme.text : theme.subtext, fontSize: 14, fontWeight: '400', flex: 1 }}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: any, isLandscape = false) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: '18%',
      paddingTop: isLandscape ? '4%' : '10%',
    },
    title: {
      color: theme.text,
      fontSize: 26,
      fontWeight: '700',
      marginBottom: 6,
    },
    subtitle: {
      color: theme.subtext,
      fontSize: 15,
      fontWeight: '400',
      marginBottom: 20,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.secondary,
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: 'rgba(245,158,11,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.3)',
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    bannerText: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.text,
      lineHeight: 18,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 20,
      marginBottom: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    cardHighlight: {
      borderWidth: 2,
      borderColor: theme.primary,
    },
    popularBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.primary,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginBottom: 12,
    },
    popularBadgeText: {
      color: theme.innerText,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    tierName: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
    },
    tierPrice: {
      color: theme.text,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 2,
    },
    tierPricePeriod: {
      color: theme.subtext,
      fontSize: 13,
      fontWeight: '400',
      marginBottom: 16,
    },
    featureList: {
      marginBottom: 16,
    },
    btn: {
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      minHeight: 46,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    btnPrimary: { backgroundColor: theme.primary },
    btnSecondary: { backgroundColor: theme.secondary },
    btnOutline: { borderWidth: 1, borderColor: theme.primary },
    btnDanger: { borderWidth: 1, borderColor: theme.border },
    btnDisabled: { backgroundColor: theme.secondary, opacity: 0.6 },
    btnText: { fontSize: 15, fontWeight: '600' },
    currentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 10,
      paddingVertical: 10,
    },
    currentBadgeText: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    aboutTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12,
      textAlign: 'center',
    },
    aboutText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 20,
      marginBottom: 12,
    },
    finePrint: {
      color: theme.subtext,
      fontSize: 11,
      fontWeight: '400',
      textAlign: 'center',
      lineHeight: 16,
    },
    legalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    legalLink: {
      color: theme.primary,
      fontSize: 11,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });
