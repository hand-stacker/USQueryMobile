## Configuration

### Settings (`USQuery/USQuery/settings.py`)

All Stripe config comes from environment variables:

| Setting | Env var | Purpose |
|---|---|---|
| `SUBSCRIPTIONS_ENABLED` | `SUBSCRIPTIONS_ENABLED` | Master kill-switch. Defaults to `false`. When off, checkout endpoints return errors. |
| `STRIPE_SECRET_KEY` | `STRIPE_SECRET_KEY` | Server-side Stripe API key. If unset, `stripe_configured` is `false`. |
| `STRIPE_PUBLISHABLE_KEY` | `STRIPE_PUBLISHABLE_KEY` | Client publishable key. |
| `STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET` | Used to verify webhook signatures. |
| `STRIPE_PLUS_PRICE_ID` | `STRIPE_PLUS_PRICE_ID` | Stripe Price ID for tier 1 (Plus). |
| `STRIPE_PLUS_PRO_PRICE_ID` | `STRIPE_PLUS_PRO_PRICE_ID` | Stripe Price ID for tier 4 (Plus Pro). |
| `STRIPE_PREMIUM_PRICE_ID` | `STRIPE_PREMIUM_PRICE_ID` | Stripe Price ID for tier 2 (Premium). |
| `STRIPE_PLUS_DISPLAY_PRICE` | `STRIPE_PLUS_DISPLAY_PRICE` | Display string, default `$2.99/mo`. |
| `STRIPE_PLUS_PRO_DISPLAY_PRICE` | `STRIPE_PLUS_PRO_DISPLAY_PRICE` | Display string, default `$7.99/mo`. |
| `STRIPE_PREMIUM_DISPLAY_PRICE` | `STRIPE_PREMIUM_DISPLAY_PRICE` | Display string, default `$19.99/mo`. |

### Tier model

```python
TIER_PRICE_MAP = {1: PLUS, 4: PLUS_PRO, 2: PREMIUM}   # tier_id -> Stripe price id
TIER_NAMES     = {0: 'Free', 1: 'Plus', 2: 'Premium', 3: 'Special', 4: 'Plus Pro'}
TIER_RANKS     = {0: 0, 1: 1, 4: 2, 2: 3, 3: 4}        # for upgrade/downgrade comparison
```

**Gotcha:** Tier IDs do **not** sort by plan level. Plus Pro was added as ID `4`
between Plus (1) and Premium (2). Always use `TIER_RANKS` — never the raw tier ID —
to decide whether a change is an upgrade or downgrade. `_is_upgrade(new, current)`
compares ranks.

> The mobile app mirrors this in `app/misc/plans.tsx` via a `TIER_RANK` map +
> `rankOf()` helper — it must stay in sync with `TIER_RANKS` here.

### Subscription state on `UserProfile` (`USQuery/app/models.py`)

| Field | Notes |
|---|---|
| `user_type` | The tier ID (0/1/2/3/4). Source of truth for feature gating. |
| `stripe_customer_id` | Stripe Customer ID. Created lazily on first checkout. Links profile ↔ Stripe. |
| `stripe_subscription_id` | Stripe Subscription ID. Presence means "already a subscriber". |
| `subscription_period_end` | Current billing period end (aware UTC datetime). |
| `subscription_cancel_at_period_end` | Whether the sub is set to cancel at period end. |
| `subscription_change_at_period_end` | Pending **deferred downgrade** target tier ID, or `-1` for none. While set, `user_type` stays on the *current* (higher) tier; the webhook flips `user_type` to this value and resets it to `-1` once the lower price becomes active at the next billing date. |

---

## URL routes

### Web (session-authenticated, server-rendered)

| Route | View | Name |
|---|---|---|
| `GET  /plans/` | `plans` | `plans` |
| `POST /subscription/checkout/create/` | `create_checkout_session` | `create_checkout_session` |
| `GET  /subscription/confirm/?tier=<id>` | `confirm_subscription_change` | `confirm_subscription_change` |
| `GET  /subscription/success/` | `checkout_success` | `checkout_success` |
| `GET  /subscription/manage/` | `manage_subscription` | `manage_subscription` |
| `POST /subscription/portal/` | `billing_portal` | `billing_portal` |
| `GET  /subscription/return-to-app/` | `return_to_app` *(deep-link bounce — see §4a)* | `return_to_app` |

### Mobile (JWT-authenticated REST API)

| Route | View | Auth | Name |
|---|---|---|---|
| `GET  /api/subscription/plans/` | `api_plans` | Public | `api_plans` |
| `GET  /api/subscription/status/` | `api_subscription_status` | JWT | `api_subscription_status` |
| `POST /api/subscription/create-checkout/` | `api_create_checkout_session` | JWT | `api_create_checkout_session` |
| `POST /api/subscription/preview-change/` | `api_preview_subscription_change` | JWT | `api_preview_subscription_change` |
| `POST /api/subscription/cancel/` | `api_cancel_subscription` | JWT | `api_cancel_subscription` |
| `POST /api/subscription/reactivate/` | `api_reactivate_subscription` | JWT | `api_reactivate_subscription` |
| `POST /api/subscription/portal/` | `api_billing_portal` | JWT | `api_billing_portal` |

### Shared / infrastructure

| Route | View | Name |
|---|---|---|
| `POST /api/stripe/webhook/` | `stripe_webhook` | `stripe_webhook` |

> **History:** the mobile billing-portal route (`api_billing_portal`) and the
> tier-change preview route (`api_preview_subscription_change`) were added to
> `urls.py` on the `dockerized-app` branch. Before that fix the portal view
> existed but had no route, so the mobile app's "Manage billing" button 404'd.

---

## Workflows

### 1. New subscriber checkout

**Web:** `POST /subscription/checkout/create/` with form field `tier`.

1. Reject if `SUBSCRIPTIONS_ENABLED` is false → flash error, redirect to `plans`.
2. Parse/validate `tier` against `TIER_PRICE_MAP`; resolve `price_id`.
3. `get_or_create` the `UserProfile`.
4. If `stripe_subscription_id` already set → this is a tier change, not a new
   checkout. Unless the POST carries `confirmed=1`, redirect to
   `/subscription/confirm/?tier=<id>` (the confirmation page, see #2). With
   `confirmed=1` it runs the **modify** flow.
5. Otherwise `_get_or_create_stripe_customer` (creates a Stripe Customer with
   `metadata.user_id` if none exists, persists `stripe_customer_id`).
6. Create a Stripe **Checkout Session** (`mode='subscription'`) with:
   - `success_url` = `/subscription/success/`
   - `cancel_url`  = `/plans/`
   - `metadata` = `{user_id, tier}`  ← **critical**: the webhook reads these.
7. HTTP redirect (302) to `session.url` (hosted Stripe Checkout page).

**Mobile:** `POST /api/subscription/create-checkout/` with JSON `{"tier": <id>}`.

Same logic, but instead of redirecting it returns JSON:
```json
{ "checkout_url": "https://checkout.stripe.com/..." }
```
The app opens that URL in an in-app browser (see §4a). Existing subscribers get a
modify-result JSON payload instead (see #2). Errors return JSON `{"error": ...}`
with codes 400 (bad tier), 502 (Stripe error), 503 (subscriptions disabled / not
configured).

> **Mobile success/cancel URLs:** the mobile Checkout Session's `success_url` and
> `cancel_url` must point at the deep-link bounce (§4a), e.g.
> `…/subscription/return-to-app/?status=success` and `?status=cancel`, so the
> in-app browser auto-closes and returns the user to the app. (The webhook is
> still the source of truth; these URLs are UX only.)

### 2. Upgrade / downgrade (existing subscriber)

Triggered automatically when `stripe_subscription_id` is already set and the user
picks a different tier. Both platforms call the shared helper
**`_execute_tier_change(user_profile, new_tier, new_price_id)`**, which returns
`(is_upgrade, updated_subscription)` or raises:

- Web → `_modify_subscription` (redirect-based wrapper)
- Mobile → `_modify_subscription_api` (JSON wrapper)

**Upgrade** (`_is_upgrade` true) — *immediate prorated charge, billing date unchanged*:
```python
stripe.Subscription.modify(
    sub_id,
    items=[{'id': item_id, 'price': new_price_id}],
    proration_behavior='always_invoice',     # charge the prorated difference NOW
    payment_behavior='error_if_incomplete',  # roll back if the card can't be charged
    cancel_at_period_end=False,
)
```
- The customer is charged immediately: the prorated **difference** for the rest of
  the current period (new-tier charge **minus** a prorated credit for unused time on
  the old tier). The renewal date is **unchanged** — it renews at the new price.
- **Do NOT set `billing_cycle_anchor='now'`.** Resetting the anchor credited the
  *entire* unused item value on every change; across multiple same-period changes
  those credits stacked and produced phantom over-refunds (the
  plus→premium→plus→premium "$39 returned / $16 charged" bug). Keeping the period
  bounds the proration so the net is always a charge, never a refund.
- `payment_behavior='error_if_incomplete'` is the safety net: if the card is
  declined or needs SCA/3DS, Stripe **raises and leaves the subscription on the
  old tier** — `user_type` is never bumped without a successful charge.
- `cancel_at_period_end=False` is also passed, so upgrading **un-cancels** a
  subscription that was pending cancellation (and the local flag is cleared too).
- On success, `user_type` and `subscription_period_end` are saved immediately.
- On `stripe.error.CardError` → web flashes "card could not be charged" and
  redirects to manage; mobile returns **402** `{payment_failed: true, error}`.

**Downgrade** → *deferred via a Stripe **subscription schedule*** (`_schedule_downgrade`).
No charge and **no refund**. The current (higher) price is kept as phase 0 for the
rest of the already-paid period; the new (lower) price is phase 1 and takes over at
the next billing date (`end_behavior='release'`, `proration_behavior='none'`).
The request sets `subscription_change_at_period_end = new_tier` and **does not**
touch `user_type` — the user keeps their higher tier until the period ends. When the
schedule advances and the lower price becomes active, `customer.subscription.updated`
fires; `_handle_subscription_updated` sets `user_type` to the new tier and resets
`subscription_change_at_period_end` to `-1`.

> **Why a schedule, not `Subscription.modify(proration_behavior='none')`:** a bare
> modify switches the item price *immediately* (only the *invoice* is suppressed),
> so the `subscription.updated` webhook would downgrade `user_type` right away —
> stripping access the user already paid for. The schedule holds the higher price
> until period end so the price genuinely changes *at* renewal.

**Cancelling a pending downgrade:** re-selecting the *current* tier while
`subscription_change_at_period_end != -1` calls `_cancel_scheduled_change`
(releases the schedule, resets the flag to `-1`). An **upgrade** also releases any
pending schedule and clears the flag, then applies immediately.

> **SCA/3DS caveat:** because the upgrade is an off-session charge (no hosted
> Checkout page), cards that require authentication will fail with `error_if_incomplete`
> rather than prompt. US cards rarely hit this; affected users must retry via the
> billing portal. A future enhancement could use `default_incomplete` + client-side
> confirmation for full SCA support.

**Both platforms now confirm before committing an existing-subscriber change:**

- **Web** — `confirm_subscription_change` (`GET /subscription/confirm/?tier=<id>`)
  renders `app/confirm_change.html` using `_build_change_preview`, showing the
  immediate charge (upgrade) or deferred-switch notice (downgrade), plus the
  `recurring_price` ("then renews at $X/mo"). Its Confirm
  button POSTs back to `create_checkout_session` with hidden `tier` + `confirmed=1`,
  which runs `_modify_subscription`. Cancel returns to `/plans/`.
- **Mobile** — calls `preview-change/` first, shows a dialog, then POSTs
  `create-checkout/` on confirm (see #2a and the API contract section).

Both the web page and the mobile preview call the **same** `_build_change_preview`
helper, so the quoted amount matches what `_execute_tier_change` actually bills.

### 2a. Tier-change preview (mobile confirmation step)

`POST /api/subscription/preview-change/` with `{"tier": <id>}` →
`api_preview_subscription_change`. Lets the app show a confirm dialog with the
exact charge **before** committing. It does **not** modify anything.

- **Already on that tier** → 409.
- **No existing subscription** → `{requires_checkout: true, ...}` (confirming would
  open fresh Checkout, nothing to prorate).
- **Downgrade** → `{is_upgrade: false, immediate_charge: 0, effective_date, message}`.
- **Upgrade** → calls `stripe.Invoice.create_preview(...)` with the *same* params
  as `_execute_tier_change` (so the quote matches — notably **no**
  `billing_cycle_anchor`), returns:
  ```json
  { "is_upgrade": true, "immediate_charge": 17.49, "credit_applied": 2.50,
    "recurring_price": "$19.99/mo", "currency": "usd",
    "new_tier": 2, "new_tier_name": "Premium", "message": "..." }
  ```
  `immediate_charge` (= invoice `amount_due`) is authoritative. `credit_applied` is
  **display-only** and is **clamped to the gross prorated charge** so the UI can
  never show a "return" larger than the re-charge — an in-period upgrade nets to a
  charge, never a refund. (This is the guard for the "do not return extra on the
  frontend" requirement.)

**Intended mobile flow:** tap upgrade → `preview-change/` → show "Confirm & pay"
dialog → on confirm → `create-checkout/` (which runs the immediate-charge modify).

### 3. Cancel / reactivate (mobile only)

- `POST /api/subscription/cancel/` → **releases any pending downgrade schedule
  first** (a schedule-managed sub can't take a cancellation), then sets
  `cancel_at=<current period end>` on Stripe and the cancel flag on the profile.
  Returns `{cancelled, period_end, message}`.
  - 404 if no subscription, 409 if already pending cancel, 502 on Stripe error.
- `POST /api/subscription/reactivate/` → sets `cancel_at_period_end=False` (undo)
  via `_reactivate_subscription`.
  - 404 if no subscription, 409 if not pending cancel, 502 on Stripe error.

> Web users cancel via the Stripe **Billing Portal** (below), not a dedicated route.

**Cancel supersedes a pending downgrade.** If the user has a pending deferred
downgrade (`subscription_change_at_period_end` = a paid tier) and then cancels,
the downgrade is moot — they drop to **Free** when the period ends. The cancel
path (and the webhook, see #5) records the pending change as **`0`** (Free).
Re-subscribing reverses this: actively choosing a plan while a cancellation is
pending **resumes** the subscription (clears `cancel_at_period_end`):
- Re-selecting the **current** tier → `_reactivate_subscription` (web message
  "subscription was resumed"; mobile `{modified: true, resumed: true, ...}`).
- Choosing an **upgrade** → `Subscription.modify(cancel_at_period_end=False)`.
- Choosing a **downgrade** → the cancellation is cleared before the schedule is
  created, so the lower plan takes over at renewal instead of the sub cancelling.

### 4. Billing portal

- Web: `POST /subscription/portal/` → `billing_portal`
- Mobile: `api_billing_portal`

Both create a `stripe.billing_portal.Session` for the customer and return/redirect
to its URL. Requires `stripe_customer_id` to exist (else 404 / redirect to plans).
- Web `return_url` = absolute URI of `/subscription/manage/`.
- Mobile `return_url` = the **deep-link bounce** URL (see §4a) — an https endpoint
  that immediately redirects to `usqmobileapp://subscription/manage`. It must **not**
  be the plain `/subscription/manage/` web page: mobile users aren't logged in on
  web, so they'd land on an error/login page outside the app.

> ⚠️ **Portal config — disable plan switching.** Tier changes must flow through the
> app (`create_checkout_session` / `create-checkout/`) so the deferred-downgrade
> logic runs (`subscription_change_at_period_end`, the schedule, the "keep current
> tier until period end" UX). If the Stripe Dashboard billing-portal config has
> *"Customers can switch plans"* enabled, a user could downgrade **inside the
> portal**, bypassing all of that — the price would change per the portal's own
> proration setting and `_handle_subscription_updated` would sync `user_type` with
> **no** pending-change flag set. Keep the portal limited to **payment-method
> updates and cancellation**; the web/mobile plan pages handle every tier change.
> (The Free card's "Downgrade via Portal" button is intentionally a *cancellation*,
> tier 0 has no price.)

### 4a. Returning to the mobile app (deep link)

**Problem:** Stripe-hosted pages (billing portal, Checkout) run in a browser. When
they finish they redirect to their `return_url` / `success_url` / `cancel_url`. If
that's a normal https web page (e.g. `/subscription/manage/`), the mobile user —
who is **not** logged in on web — lands on an error/login page *outside* the app,
with no way back in. This was the original "portal redirects to a web error page"
bug.

**Fix — in-app browser + deep-link bounce.** Two halves:

1. **App side** (`app/hooks/openStripeUrl.tsx`): all Stripe URLs are opened with
   `WebBrowser.openAuthSessionAsync(url, STRIPE_RETURN_URL)` from `expo-web-browser`
   instead of `Linking.openURL`. This uses an in-app secure browser
   (`ASWebAuthenticationSession` on iOS, Chrome Custom Tabs on Android). The moment
   the page navigates to the app's custom scheme
   (`STRIPE_RETURN_URL = 'usqmobileapp://subscription/manage'`), the browser
   **auto-dismisses and control returns to the app**. Matching is by **scheme**, so
   any `usqmobileapp://…` URL (with whatever `?status=` query) is caught. Callers:
   `plans.tsx` (portal + new-subscriber checkout) and `auth/login.tsx` (portal).
   - After the portal closes, `plans.tsx` re-runs `loadData()` so a card update or
     cancellation made inside the portal is reflected immediately.
   - For checkout, the returned URL's query (`?status=success` vs `?status=cancel`)
     decides whether to show the success screen or just refresh.

2. **Backend side:** Stripe requires `return_url` / `success_url` / `cancel_url` to
   be **http(s)** — it rejects custom schemes like `usqmobileapp://`. So add a tiny
   bounce view, `GET /subscription/return-to-app/`, that serves an HTML/302 redirect
   to the deep link, preserving the status:
   ```python
   def return_to_app(request):
       status = request.GET.get('status', 'manage')  # success | cancel | manage
       deep_link = f"usqmobileapp://subscription/manage?status={status}"
       # 302 to the scheme; include a tappable fallback link in the HTML body
       # in case the automatic redirect is blocked.
       return HttpResponseRedirect(deep_link)
   ```
   Then set, **for mobile sessions only**:
   - `api_billing_portal` → `return_url = https://<host>/subscription/return-to-app/`
   - mobile Checkout Session → `success_url = …/return-to-app/?status=success`,
     `cancel_url = …/return-to-app/?status=cancel`

   Web sessions keep their existing https `return_url`/`success_url`/`cancel_url`.

> **Why a bounce page and not a Universal/App Link?** A universal link
> (`https://www.usquery.com/subscription/manage/` associated with the app via
> `apple-app-site-association` + `assetlinks.json`) would also work and needs no
> bounce view, but universal links are **not** reliably honored *inside*
> `ASWebAuthenticationSession`/Custom Tabs (they often open the web page in the
> same browser instead of the app). The scheme-bounce approach works inside the
> in-app browser on both platforms with no association-file setup, which is why
> it's preferred here. The app scheme is declared in `app.json`
> (`"scheme": "usqmobileapp"`).

> **Dev builds:** the `usqmobileapp://` scheme resolves only in a development build
> / standalone app, **not** in Expo Go (which uses `exp://`). This app already ships
> a custom native config, so that's the expected target. If the auth session can't
> start, `openStripeUrl` falls back to `Linking.openURL` (system browser, no
> auto-return).

> **iOS consent prompt:** `ASWebAuthenticationSession` shows a one-time
> "“My Congress” Wants to Use “stripe.com” to Sign In" dialog. This is expected for
> this API and the standard trade-off for the auto-return behavior.

### 5. Webhook (source of truth sync)

`POST /api/stripe/webhook/` — `@csrf_exempt`. **This is how the DB stays in sync
with Stripe.** Always verify here when subscription state looks wrong.

1. Verify signature with `STRIPE_WEBHOOK_SECRET` → 400 on bad signature/payload.
2. Dispatch by `event['type']`:

| Event | Handler | Effect |
|---|---|---|
| `checkout.session.completed` | `_handle_checkout_completed` | Reads `metadata.user_id` + `metadata.tier`, sets `user_type`, `stripe_subscription_id`, clears cancel flag, fetches period end. |
| `customer.subscription.created` / `.updated` | `_handle_subscription_updated` | Looks up profile by `stripe_customer_id`. Syncs `cancel_at_period_end`, `period_end`, and re-derives tier from the price ID via `_price_to_tier()` — **only when subscription `status` is `active`/`trialing`** (so an unpaid upgrade can't grant a tier). When the active price matches a pending `subscription_change_at_period_end`, applies it (sets `user_type`) and resets the flag to `-1` — this is how a deferred downgrade lands at period end. **Cancel reconciliation:** if the sub is now set to cancel, a pending paid downgrade is rewritten to `0` (Free), since the user drops to Free at period end; if the cancel was undone, that `0` marker is reset to `-1`. |
| `customer.subscription.deleted` | `_handle_subscription_deleted` | Resets profile to Free (tier 0), clears subscription fields. |

3. Always returns **200** (even if a handler throws — errors are logged, not
   re-raised) so Stripe does not retry indefinitely. **Implication:** a failed
   handler is silent except in logs — grep logs for `Webhook handler error`.

> **API-version gotcha (fixed):** as of Stripe API `2026-04-22.dahlia`,
> `current_period_end` no longer exists on the Subscription object — it lives on
> the **subscription item** (`sub.items.data[0].current_period_end`). The helper
> `_subscription_period_end(sub)` reads it from there. The old code used
> `getattr(sub, 'current_period_end', None)`, which silently returned `None` and
> wiped `subscription_period_end` on every checkout/update. If you see null period
> ends, confirm this helper is in the path.

> **Cancel-detection gotcha (fixed) — flexible billing mode:** our subscriptions
> use Stripe **flexible billing mode** (`subscription.billing_mode.flexible`), where
> **`cancel_at_period_end` is deprecated** ([changelog](https://docs.stripe.com/changelog/basil/2025-05-28/cancel-at-enums)).
> A "cancel at period end" is instead a **future `cancel_at` timestamp** (with
> `status` still `active`) and the legacy boolean stays `False` — both the billing
> portal and our own cancel produce `cancel_at`. Classic billing mode still uses the
> boolean. Helper `_is_pending_cancellation(sub)` therefore checks **both**
> (`bool(sub.cancel_at) or bool(sub.cancel_at_period_end)`); if cancellations aren't
> being recorded, confirm `_handle_subscription_updated` uses it.
>
> When a user with a **pending downgrade schedule** cancels in the portal, Stripe
> first **releases the schedule** (a `subscription_schedule` event with
> `status: "released"`, which we don't handle), discarding the queued downgrade so
> the sub reverts to the current/higher price, then fires a
> `customer.subscription.updated` with `cancel_at` set and `schedule: null`. So a
> cancel always supersedes a pending downgrade, and **reinstating keeps the current
> (higher) tier** — the downgrade is gone. `_handle_subscription_updated` then sets
> the pending change to `0` on cancel and back to `-1` on reinstate.

> **Write side (cancel_at, not the boolean):** because of flexible billing mode, all
> our cancel/reactivate writes to `Subscription.modify` use `cancel_at`:
> - **Cancel** (`api_cancel_subscription`): release any schedule, then
>   `modify(cancel_at='min_period_end')` — Stripe's documented replacement for the
>   deprecated `cancel_at_period_end=true`; the enum resolves to the period-end
>   timestamp immediately.
> - **Un-cancel** (`_reactivate_subscription`, the upgrade `modify`, and the
>   downgrade pre-clear): `modify(cancel_at='')` to unset it (Stripe's empty-string
>   convention for clearing an optional field).
>
> Pass only `cancel_at` (never alongside `cancel_at_period_end`). Web cancellations
> go through the billing portal, which already emits `cancel_at`; the webhook reads
> it. **Verify on first live reinstate** that `cancel_at=''` clears it (the reinstate
> webhook should show `cancel_at: null`).

**Lookup keys to remember:**
- `checkout.session.completed` finds the user via **session metadata** (`user_id`).
- subscription created/updated/deleted find the user via **`stripe_customer_id`**.
  If `stripe_customer_id` is missing/mismatched, these handlers no-op with a
  `No profile found for Stripe customer` warning.

---

## Mobile API contract (for frontend)

This is the exact contract the mobile app should code against. All endpoints
except `plans/` require the JWT `Authorization: Bearer <access>` header. Request
bodies are JSON.

> **Amounts:** decimal dollars (e.g. `17.49`), not cents. They are plain JSON
> numbers, so trailing zeros are dropped (`12.0`, not `12.00`) — **the client must
> format to 2 decimals** for display.

> **Pending-change convention:** `change_at_period_end` is the tier the user
> switches to at `period_end`: `0` = Free (set when a cancellation supersedes a
> pending downgrade), or a paid tier id (a scheduled downgrade).
> `change_at_period_end_name` is its display name. Combine with
> `cancel_at_period_end`: if that's `true`, the user drops to Free at `period_end`
> regardless.
> - The manage-screen endpoints — **`status/`, `cancel/`, `reactivate/`** — encode
>   "no pending change" as **`null`**.
> - The plans-screen endpoint **`create-checkout/`** encodes "no pending change" as
>   the raw sentinel **`-1`** (its existing contract — unchanged this release).
>   Treat `-1` there the same as `null`.

> **What changed for the frontend (this release):**
> 1. **Upgrades** are no longer silent/deferred — call `preview-change/` and show a
>    confirm dialog before `create-checkout/`, and handle a new **402** from
>    `create-checkout/` when an upgrade's card charge fails.
> 2. **`create-checkout/`** has two new outcomes when the user already subscribes:
>    a pending downgrade can be cancelled (`change_cancelled: true`) or a pending
>    cancellation resumed (`resumed: true`) by re-selecting the current tier.
> 3. **`cancel/`** now returns `cancel_at_period_end` and `change_at_period_end[_name]`
>    (a pending downgrade is rewritten to Free `0`), and **`reactivate/`** returns the
>    same fields. Use them to refresh the UI without a second `status/` call.
> 4. **Billing portal + checkout open in an in-app browser** and return to the app
>    via the `usqmobileapp://` deep link (see §4a). `portal_url` / `checkout_url`
>    are handled by `openStripeUrl()` (`app/hooks/openStripeUrl.tsx`), not
>    `Linking.openURL`. This depends on the backend setting the deep-link bounce as
>    the Stripe `return_url`/`success_url`/`cancel_url` for mobile sessions.

### `GET /api/subscription/plans/` — public
Returns `{stripe_configured, subscriptions_enabled, tiers: [...]}`. Each tier has
`id, name, price, price_period, starred_*_limit, predictions_per_day, chat_*`.

### `GET /api/subscription/status/` — current user
```json
{ "tier": 1, "tier_name": "Plus", "cancel_at_period_end": false,
  "change_at_period_end": null, "change_at_period_end_name": null,
  "period_end": "2026-07-13T00:00:00+00:00",
  "starred_members_limit": 10, "starred_bills_limit": 50,
  "daily_prediction_credits": 10, "chat_messages_per_day": 10,
  "chat_monthly_input_token_limit": null }
```

### `POST /api/subscription/preview-change/` — quote a tier change (no side effects)
Request: `{ "tier": <id> }`. Response shape depends on the case:

| Case | HTTP | Body |
|---|---|---|
| Already on this tier | 409 | `{error}` |
| No active sub (would be new signup) | 200 | `{requires_checkout: true, is_upgrade: true, new_tier, new_tier_name, immediate_charge: null, recurring_price, message}` |
| Downgrade | 200 | `{is_upgrade: false, current_tier, current_tier_name, new_tier, new_tier_name, immediate_charge: 0, recurring_price, currency, effective_date, message}` |
| Upgrade | 200 | `{is_upgrade: true, current_tier, current_tier_name, new_tier, new_tier_name, immediate_charge, credit_applied, recurring_price, currency, message}` |
| Bad/invalid tier | 400 | `{error}` |
| Not configured / disabled | 503 | `{error}` |
| Stripe error | 502 | `{error}` |

`immediate_charge` is what the card will be charged **today** for an upgrade
(new-tier price minus `credit_applied`, the prorated credit for unused time).
`recurring_price` is the human-readable ongoing rate (e.g. `"$19.99/mo"`) to show
as "then renews at …". `requires_checkout: true` means there's nothing to prorate
— go straight to `create-checkout/` and open the returned `checkout_url`.

> **Free (tier 0) is not a valid preview/checkout target.** Tier 0 has no Stripe
> price, so `preview-change/` and `create-checkout/` return **400 "invalid tier"**.
> Reverting to Free is a **cancellation**: the mobile app routes the Free card's
> button to `cancel/`, not a tier change.

### `POST /api/subscription/create-checkout/` — commit the change
Request: `{ "tier": <id> }`. Behavior depends on whether the user already
subscribes:

| Case | HTTP | Body | App action |
|---|---|---|---|
| New subscriber | 200 | `{checkout_url}` | Open URL in in-app browser; Stripe confirms & webhook finalizes; bounce returns to app |
| Upgrade, card charged | 200 | `{modified: true, is_upgrade: true, tier, tier_name, change_at_period_end: -1, message}` | Show success; tier is live now |
| Downgrade scheduled | 200 | `{modified: true, is_upgrade: false, tier, tier_name, change_at_period_end: <tier>, message}` | Show "switches at next billing date; you keep current tier until then" |
| Re-selected current tier with a pending downgrade | 200 | `{modified: true, change_cancelled: true, tier, tier_name, change_at_period_end: -1, message}` | Show "scheduled change cancelled" |
| Re-selected current tier with a pending **cancellation** | 200 | `{modified: true, resumed: true, tier, tier_name, cancel_at_period_end: false, change_at_period_end: -1, message}` | Show "subscription resumed" |
| **Upgrade, card failed** | **402** | `{payment_failed: true, error}` | Show error; prompt to fix card via portal |
| Bad/invalid tier | 400 | `{error}` | — |
| Subscriptions disabled | 503 | `{error}` | — |
| Stripe error | 502 | `{error}` | — |

> ⚠️ The current app treats any non-`modified`/`checkout_url` response as a generic
> error. That still works, but to surface card failures well it should special-case
> **402 `payment_failed`**. Call `preview-change/` first so the user already saw
> and accepted the charge before this request.

### `POST /api/subscription/cancel/` — cancel at period end
On 200:
```json
{ "cancelled": true, "cancel_at_period_end": true,
  "period_end": "2026-07-13T00:00:00+00:00",
  "change_at_period_end": 0, "change_at_period_end_name": "Free",
  "message": "Your subscription will cancel at the end of the billing period." }
```
- 404 no sub · 409 already cancelling · 502 Stripe error.
- Any pending downgrade is **released and rewritten to Free** (`change_at_period_end: 0`);
  if there was no pending downgrade it's `null`. The user keeps their current tier
  until `period_end`, then drops to Free.

### `POST /api/subscription/reactivate/` — undo a pending cancel
On 200:
```json
{ "reactivated": true, "cancel_at_period_end": false,
  "change_at_period_end": null, "change_at_period_end_name": null,
  "message": "Your subscription has been reactivated and will renew normally." }
```
- 404 no sub · 409 not pending cancel · 502 Stripe error.
- Reactivating **keeps the current (higher) tier** — a downgrade that was pending
  before the cancel was already discarded, so `change_at_period_end` is `null`.

### `POST /api/subscription/portal/` — Stripe billing portal URL
`{portal_url}` on 200 (open in the in-app browser via `openStripeUrl`). **404** if
the user has no `stripe_customer_id` yet (never subscribed). The portal's
`return_url` must be the deep-link bounce (§4a) so the user returns to the app.
*(This route was missing before the `dockerized-app` branch — that was the original
404 bug.)*

### Recommended mobile change-tier flow
```
tap a plan
  -> if it's FREE (tier 0) while subscribed:
       POST cancel/   (reverting to Free is a cancellation, not a tier change)
  -> else if it's the CURRENT tier:
       POST create-checkout/ {tier}
         resumed: true         -> "subscription resumed"   (was pending cancel)
         change_cancelled: true -> "scheduled change cancelled" (was pending downgrade)
         409                   -> "already on this plan"
     else:
       POST preview-change/ {tier}
         409  -> "already on this plan"
         requires_checkout -> POST create-checkout/ -> open checkout_url (in-app browser)
         else -> show dialog with immediate_charge / effective_date
                  on confirm:
                    -> POST create-checkout/ {tier}
                         200 modified      -> success screen (read change_at_period_end)
                         402 payment_failed -> "update your card" -> portal/

cancel / reactivate (manage screen)
  -> POST cancel/      -> {cancel_at_period_end:true, change_at_period_end, period_end}
  -> POST reactivate/  -> {cancel_at_period_end:false, change_at_period_end:null}

open billing portal
  -> POST portal/ -> {portal_url} -> openStripeUrl(portal_url)  (in-app browser, auto-returns)
```

> After any of `create-checkout/`, `cancel/`, or `reactivate/`, the response now
> carries enough state (`cancel_at_period_end`, `change_at_period_end[_name]`,
> `period_end`) to update the manage screen directly — a follow-up `status/` call is
> optional, not required.

---

## Common bug-fix entry points

| Symptom | Where to look |
|---|---|
| User paid but tier didn't change | Webhook delivery + `_handle_checkout_completed`; confirm `metadata.user_id`/`tier` present on the Checkout Session. On **localhost** you must run `stripe listen --forward-to localhost:<port>/api/stripe/webhook/` and set its `whsec_…` as `STRIPE_WEBHOOK_SECRET_TEST` — otherwise the webhook never arrives and the tier never flips. |
| Mobile portal/checkout lands on a web error page | `return_url`/`success_url`/`cancel_url` for mobile must be the deep-link bounce (§4a); app must open via `openStripeUrl` (`openAuthSessionAsync`), not `Linking.openURL`. |
| Cancelled but still shows pending downgrade / cancel didn't stick | `_handle_subscription_updated` cancel reconciliation + `api_cancel_subscription` releases the schedule first. A schedule-managed sub rejects a plain `cancel_at_period_end`. |
| "invalid tier" when switching to Free | Tier 0 has no price — route the Free card to `cancel/`, not `preview-change/`/`create-checkout/`. |
| Deleted account still has an active Stripe subscription | `delete_scheduled_users` command calls `_cancel_stripe_subscription` (immediate `Subscription.cancel`) before deleting the user; failures are logged, not fatal. |
| Upgrade upgraded the tier but no charge happened | Expected for the *old* code (`create_prorations`, deferred). Current code uses `always_invoice` + `error_if_incomplete` — check `_execute_tier_change`. |
| Mobile "Manage billing" returns 404 | The `api/subscription/portal/` route — confirm it's still registered in `urls.py` (was the original bug). |
| Web upgrade charges without showing confirm page | `create_checkout_session` must redirect to `/subscription/confirm/` unless POST has `confirmed=1`; check the confirm page renders `_build_change_preview`. |
| Web confirm page redirects back to /plans/ | `_build_change_preview` returned an `error` (already on plan / Stripe error) — check flashed message. |
| Upgrade returns 402 / "card could not be charged" | `error_if_incomplete` raised `CardError` (declined or needs SCA). Tier correctly left unchanged; user should update card in billing portal. |
| Upgrade/downgrade applied to wrong direction | `TIER_RANKS` / `_is_upgrade` (tier IDs don't sort by level). |
| Tier reverts to Free unexpectedly | `_handle_subscription_deleted` firing; check Stripe sub status. |
| Unpaid upgrade still unlocked a tier | `_handle_subscription_updated` status guard (`active`/`trialing`) — verify it's intact. |
| `subscription_period_end` is null | `_subscription_period_end` helper / item-level `current_period_end` (dahlia API change). |
| Downgrade applied immediately instead of at period end | `proration_behavior='none'` branch in `_execute_tier_change`. |
| "Payment not configured" errors | Missing `STRIPE_*_PRICE_ID` or `STRIPE_SECRET_KEY` env vars. |
| Endpoints return 503 | `SUBSCRIPTIONS_ENABLED` is false. |
| Webhook 400s | `STRIPE_WEBHOOK_SECRET` mismatch / wrong endpoint secret. |
| Subscription webhook no-ops | `stripe_customer_id` not set or mismatched on the profile. |
| Preview amount ≠ actual charge | `api_preview_subscription_change` params must mirror `_execute_tier_change` exactly. |

---

## Sequence summary

```
NEW SUBSCRIBER (web)
  browser -> POST /subscription/checkout/create/ (tier)
          -> create Checkout Session (metadata: user_id, tier)
          -> 302 redirect to Stripe hosted checkout
  Stripe  -> user pays
          -> redirect to /subscription/success/   (UX only)
          -> POST /api/stripe/webhook/ checkout.session.completed  (DB truth)
                 -> profile.user_type / stripe_subscription_id updated

NEW SUBSCRIBER (mobile)
  app -> POST /api/subscription/create-checkout/ (JWT, {tier})
      <- { checkout_url }
  app opens checkout_url in in-app browser (openStripeUrl) ...
      success_url/cancel_url bounce to usqmobileapp://subscription/... -> browser closes
      ... then same webhook path as above

UPGRADE (existing sub) — confirmed on both platforms before charging
  web    -> POST /subscription/checkout/create/ (tier)        (no confirmed flag)
         -> 302 redirect /subscription/confirm/?tier=N        (confirm page)
         -> user clicks Confirm & Pay
         -> POST /subscription/checkout/create/ (tier, confirmed=1)
  mobile -> POST /api/subscription/preview-change/ {tier}      (no change yet)
         <- { immediate_charge, credit_applied, ... }          (confirm dialog)
         -> POST /api/subscription/create-checkout/ {tier}     (on confirm)
  both   -> _execute_tier_change: Subscription.modify(
                always_invoice + error_if_incomplete)   # NO billing_cycle_anchor
            paid OK     -> user_type bumped now, billing date UNCHANGED
                           (charged only the prorated difference for this period)
            card fails  -> CardError, tier UNCHANGED (web: flash, mobile: 402)

DOWNGRADE (existing sub)
  -> SubscriptionSchedule: phase0 = current price (until period end),
                          phase1 = new lower price (end_behavior=release)
  -> no charge, no refund; user_type UNCHANGED now
  -> subscription_change_at_period_end = new_tier  (UI shows pending-change warning)
  -> at period end the lower price activates -> customer.subscription.updated
       -> user_type = new_tier, subscription_change_at_period_end = -1
  (re-selecting current tier, or upgrading, releases the schedule + clears the flag)

CANCEL (mobile)  -> cancel_at_period_end = true   (webhook keeps period_end fresh)
CANCEL (web)     -> via Stripe Billing Portal
BILLING PORTAL (mobile) -> openStripeUrl(portal_url) -> in-app browser
       return_url bounces to usqmobileapp://subscription/manage -> browser closes
```
