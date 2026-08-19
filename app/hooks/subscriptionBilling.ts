import { deepLinkToSubscriptions } from 'expo-iap';
import { Alert, Linking } from 'react-native';
import { APPLE_MANAGE_SUBSCRIPTIONS_URL } from '../../constants/iap';

export type BillingProvider = 'apple' | 'stripe' | null;

/**
 * `GET /api/subscription/status/`. Every field except the two billing ones has
 * been in the payload since the Stripe-only days.
 */
export interface SubStatus {
  tier: number;
  tier_name: string;
  cancel_at_period_end: boolean;
  /**
   * Tier the user switches to at period_end (a scheduled downgrade), 0 if a
   * cancellation supersedes a downgrade (drops to Free), or null for none.
   */
  change_at_period_end: number | null;
  change_at_period_end_name: string | null;
  period_end: string | null;
  /** Who owns the current subscription. null = never subscribed. */
  billing_provider?: BillingProvider;
  /**
   * Non-null **only** when the subscription is Apple-managed *and* still live.
   * This — not `Platform.OS` — is what decides where "Manage subscription"
   * goes: a user who subscribed through Stripe on the web and then opens the
   * iOS app must still be sent to the Stripe portal.
   */
  manage_url?: string | null;
}

/**
 * True when the App Store owns this subscription *right now*. The backend sets
 * `manage_url` under exactly the same condition it uses to reject the Stripe
 * endpoints with a 409, so this predicate and the server's agree by
 * construction — which is why it is preferred over reading `billing_provider`,
 * a field that stays 'apple' after the subscription lapses.
 */
export function isAppleManaged(status?: SubStatus | null): boolean {
  return !!status?.manage_url;
}

/**
 * True when the subscription is Stripe's, so the Stripe endpoints (cancel,
 * reactivate, portal) are the ones with authority over it. An Apple-managed
 * subscription that has lapsed falls here too; the user has no live
 * subscription, so nothing is misrouted.
 */
export function isStripeManaged(status?: SubStatus | null): boolean {
  return !isAppleManaged(status) && status?.billing_provider === 'stripe';
}

/**
 * What an iOS build may say to a subscriber it does not bill through Apple.
 *
 * Guideline 3.1.1 forbids any call to action directing a customer to a
 * purchasing mechanism other than IAP; 3.1.3 permits merely stating that a
 * subscription bought elsewhere works here. So this states a fact and stops:
 * no processor named, no URL, nothing tappable. Every control on iOS is
 * withdrawn in favour of it — Cancel included, since that routes through our
 * own backend and is still a management path Apple cannot see.
 *
 * Kept here so the wording is reviewed in one place if App Review pushes back.
 */
export const EXTERNAL_BILLING_TITLE = 'Billed outside the App Store';
export const EXTERNAL_BILLING_BODY =
  'Your My Congress subscription was not purchased through the App Store, so it cannot be changed or cancelled from this app. You can manage it on the web, where you originally subscribed.';
/**
 * Inert label for a plan card that cannot be actioned on iOS. Deliberately
 * short: it sits in a button-shaped slot narrow enough that the full sentence
 * would wrap to three lines, and the banner above the cards already carries
 * the explanation.
 */
export const EXTERNAL_BILLING_LABEL = 'Billed elsewhere';

/**
 * Opens the App Store's own subscription management sheet. StoreKit
 * subscriptions can only be changed or cancelled there — Apple exposes no
 * server API for it, so neither we nor our backend can do it for the user.
 */
export async function openAppleSubscriptionSettings(manageUrl?: string | null) {
  try {
    await deepLinkToSubscriptions({});
  } catch {
    await Linking.openURL(manageUrl || APPLE_MANAGE_SUBSCRIPTIONS_URL).catch(() => {});
  }
}

/**
 * Backstop for the 409 the Stripe endpoints return once a subscription is
 * App Store managed:
 *
 *   { error, detail, billing_provider: "apple", manage_url }
 *
 * The client shouldn't be reaching those endpoints in that state at all — this
 * is the same belt-and-braces role `openStripeUrl` plays for guideline 3.1.1.
 * Returns true when the conflict was handled, so callers can bail out.
 */
export function handleAppStoreConflict(
  status: number,
  body: any,
  onDismiss?: () => void,
): boolean {
  if (status !== 409 || body?.billing_provider !== 'apple') return false;
  Alert.alert(
    body?.error ?? 'Managed by the App Store',
    body?.detail ?? 'Manage or cancel it in your Apple ID subscription settings.',
    [
      { text: 'Not Now', style: 'cancel', onPress: onDismiss },
      {
        text: 'Open Settings',
        onPress: () => {
          openAppleSubscriptionSettings(body?.manage_url);
          onDismiss?.();
        },
      },
    ],
  );
  return true;
}
