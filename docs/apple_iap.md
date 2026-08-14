# Apple In-App Purchase (StoreKit) integration

Added in response to App Store Review rejection under **guideline 3.1.1** — the
Plus / Plus Pro / Premium plans were purchasable inside the app through Stripe
Checkout. On iOS every subscription transaction now goes through StoreKit;
Stripe remains the payment path on Android and web.

## Client architecture

| File | Role |
|---|---|
| `constants/iap.ts` | Product-id ↔ tier map, `USE_STOREKIT` platform switch, Apple URLs. |
| `app/hooks/iapContext.tsx` | `IapProvider` / `useIapContext()`. Owns the StoreKit connection, product catalog, purchase + restore flows, and backend verification. |
| `app/misc/plans.tsx` | Branches on `USE_STOREKIT`: StoreKit purchase vs. Stripe Checkout. |
| `app/auth/login.tsx` | "Manage in App Store" instead of the Stripe billing portal on iOS. |
| `app/hooks/openStripeUrl.tsx` | Hard-blocks on iOS as a backstop so no Stripe-hosted page can ever open there. |

`IapProvider` is mounted in `app/_layout.tsx` **above** the navigator. That is
deliberate: StoreKit redelivers unfinished transactions on connect, so a
purchase that completed while the app was backgrounded or killed still reaches
the backend on the next launch. Mounting it inside the Plans screen would drop
those.

### Transaction lifecycle

1. User taps *Upgrade to X* → `iap.purchase(tierId)` → `requestPurchase({ type: 'subs', request: { apple: { sku } } })`.
2. StoreKit shows the payment sheet and, on success, emits a `Purchase` to the
   `onPurchaseSuccess` listener.
3. The client POSTs the signed transaction to `subscription/apple/verify/`.
4. **Only after** the backend confirms does the client call `finishTransaction`.
   Finishing earlier would tell Apple we honored a purchase we did not record,
   and the transaction would never be redelivered.
5. Failures leave the transaction unfinished on purpose — Apple replays it on
   the next connection, and *Restore Purchases* forces the retry manually.

Because all three SKUs live in one subscription group, StoreKit handles
upgrades, downgrades and proration itself. The client just requests the new
SKU; there is no preview/confirm step like the Stripe path has.

## App Store Connect setup (required before this ships)

Create **one auto-renewable subscription group** (e.g. "My Congress
Membership") containing three subscriptions. The product ids must match
`IOS_SKU_BY_TIER` in `constants/iap.ts` exactly:

| Tier id | Plan | Product ID | Price | Group level |
|---|---|---|---|---|
| 1 | Plus | `com.usquery.mycongress.plus.monthly` | $2.99/mo | 3 (lowest) |
| 4 | Plus Pro | `com.usquery.mycongress.pluspro.monthly` | $7.99/mo | 2 |
| 2 | Premium | `com.usquery.mycongress.premium.monthly` | $19.99/mo | 1 (highest) |

Level ordering matters — it is what makes StoreKit treat a move from Plus to
Premium as an immediate upgrade and Premium to Plus as a deferred downgrade.

Each subscription also needs a localized display name, description, and a
review screenshot, and the group needs an App Store localization. Submit the
three IAPs **together with** the app build; IAPs created but never attached to
a submission stay in "Waiting for Review" and the build gets rejected again.

Also set, under App Information:

- **License Agreement** — leave as Apple's standard EULA (the app links to it
  from the Plans screen).
- **Privacy Policy URL** — required for subscriptions.

## Backend contract (usquery.com, separate repo)

### `POST /api/subscription/apple/verify/`

Authenticated (Bearer access token). Called on purchase, on restore, and on
every StoreKit redelivery.

Request:

```json
{
  "jws": "<StoreKit 2 signed transaction, JWS compact form>",
  "transaction_id": "2000000912345678",
  "product_id": "com.usquery.mycongress.plus.monthly"
}
```

The server must:

1. Verify the JWS signature chain against Apple's root CAs, and check that
   `bundleId` is `com.usquery.mycongress`.
2. Confirm `environment` matches the expected one (`Sandbox` for TestFlight and
   sandbox testers, `Production` for the App Store) — accept both, but record
   which, so sandbox transactions never grant production entitlements to other
   users.
3. Map `productId` → tier id using the table above and set `user_type`.
4. Store `originalTransactionId` on the profile — that is the stable identifier
   for the subscription across renewals, not `transactionId`, which changes
   every billing period.
5. Reject a transaction whose `originalTransactionId` is already bound to a
   *different* user account (otherwise one Apple ID can farm entitlements onto
   many accounts).

Response on success — anything with `ok: true` (or `verified: true`) is treated
as "the backend now owns this transaction":

```json
{ "ok": true, "tier": 1, "tier_name": "Plus", "period_end": "2026-09-13T00:00:00Z" }
```

Response on failure:

```json
{ "error": "Signature verification failed" }
```

The client keeps the transaction unfinished and retries on any error, so
failures are safe but must not be reported as `ok`.

### App Store Server Notifications V2

Renewals, cancellations, billing retries, refunds and expirations never touch
the app, so the entitlement will drift unless the server subscribes to
notifications. Point App Store Connect at a new endpoint (e.g.
`POST /api/subscription/apple/notifications/`) and handle at minimum:

| Notification | Action |
|---|---|
| `DID_RENEW` | Extend `period_end`. |
| `DID_CHANGE_RENEWAL_STATUS` | Set/clear `cancel_at_period_end`. |
| `DID_CHANGE_RENEWAL_PREF` | Record the pending tier change (`change_at_period_end`). |
| `EXPIRED` | Drop to tier 0. |
| `REFUND` / `REVOKE` | Drop to tier 0 immediately. |
| `GRACE_PERIOD_EXPIRED` | Drop to tier 0. |

These are the same `subscription/status/` fields the Plans screen already
renders, so once they are populated from Apple the existing UI works unchanged.

### `subscription/status/` addition worth making

The status payload has no notion of *which* processor owns the subscription. A
user who subscribed via Stripe on the web and then opens the iOS app is
currently told to manage it in the App Store, where it will not appear. Adding
`"billing_provider": "apple" | "stripe" | null` would let the Plans screen show
the right destination. Not required for this submission — noted so it is not
forgotten.

## Testing

`expo-iap` requires a native build; it does **not** work in Expo Go.

```sh
npx expo prebuild --clean          # expo-iap config plugin is in app.json
eas build --profile development --platform ios
```

- **Sandbox:** create a Sandbox Apple ID in App Store Connect → Users and
  Access → Sandbox, then sign into it on-device under Settings → Developer →
  Sandbox Apple Account. Sandbox renewals are accelerated (a month renews in
  ~5 minutes), which is the fastest way to exercise the notification handler.
- **Products return empty** almost always means the IAPs are not yet in a
  submittable state, the paid-apps agreement is not active, or the bundle id
  does not match. `iap.ready` stays false and the Plans screen shows
  "Coming Soon" rather than a broken buy button.
- Verify the interrupted-purchase path: kill the app during the payment sheet,
  relaunch, and confirm the transaction is verified and finished on connect.

## Review notes to include in App Store Connect

Reviewers need a logged-in account to reach the Plans screen. Provide demo
credentials in *App Review Information*, and note that Plans lives under the
**Settings tab → View Plans**.
