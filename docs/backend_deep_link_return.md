# Backend TODO — Deep-link "bounce" URLs for the mobile app

> **Goal:** make Stripe's billing portal and Checkout return the mobile user to the
> **app**, not a logged-out web page. The app already opens Stripe in an in-app
> browser (`openStripeUrl` → `ASWebAuthenticationSession` / Chrome Custom Tabs) that
> watches for the `usqmobileapp://` scheme and auto-closes. The backend just has to
> make Stripe redirect there.
>
> **Why a bounce URL:** Stripe validates `return_url` / `success_url` / `cancel_url`
> and **rejects custom schemes** like `usqmobileapp://`. So we point Stripe at a
> small **https** endpoint that immediately `302`s to the app's deep link. The
> in-app browser sees the `usqmobileapp://` hop and dismisses.
>
> ```
> in-app browser → Stripe page → (https) /subscription/return-to-app/?status=success
>                                      → 302 → usqmobileapp://subscription/manage?status=success
>                                      → browser auto-closes, app resumes
> ```

The app scheme is `usqmobileapp` (declared in the mobile app's `app.json`). The app
matches the **scheme only**, so the path/query you send can be anything — but send a
`status` so the app can tell success from cancel.

---

## 1. Add the bounce view

`USQuery/app/views.py` (or wherever the other subscription views live):

```python
from django.http import HttpResponseRedirect
from django.utils.html import escape

# Custom scheme the mobile app registers (app.json: "scheme": "usqmobileapp").
APP_SCHEME = "usqmobileapp"

# Stripe can't redirect to a custom scheme directly, so it redirects here (https)
# and we bounce to the app. status: "success" | "cancel" | "manage".
def return_to_app(request):
    status = request.GET.get("status", "manage")
    if status not in ("success", "cancel", "manage"):
        status = "manage"
    deep_link = f"{APP_SCHEME}://subscription/manage?status={status}"

    # A 302 to the scheme is enough for ASWebAuthenticationSession / Custom Tabs.
    # We also return a tiny HTML body with a tappable fallback link + a JS hop, in
    # case the automatic 302-to-scheme is ever blocked by the in-app browser.
    safe = escape(deep_link)
    html = (
        f'<!doctype html><meta charset="utf-8">'
        f'<meta http-equiv="refresh" content="0;url={safe}">'
        f'<script>window.location.replace("{safe}");</script>'
        f'<p>Returning to the app… '
        f'<a href="{safe}">Tap here if it doesn\'t open automatically.</a></p>'
    )
    resp = HttpResponseRedirect(deep_link)
    resp.content = html  # body shown only if the redirect is intercepted
    return resp
```

> Keep it **unauthenticated** — the in-app browser has no Django session, and the
> page exposes nothing sensitive (just a redirect to a fixed scheme).

---

## 2. Register the route

`USQuery/app/urls.py`:

```python
path("subscription/return-to-app/", views.return_to_app, name="return_to_app"),
```

Quick check (should `302` to the scheme):

```bash
curl -i "https://<host>/subscription/return-to-app/?status=success"
# HTTP/1.1 302 Found
# Location: usqmobileapp://subscription/manage?status=success
```

---

## 3. Point the **mobile** Stripe sessions at the bounce

Only the mobile/JWT endpoints change. **Leave the web (session) views as-is** —
they already return users to real web pages.

Build the absolute URL with `request.build_absolute_uri(reverse("return_to_app"))`
so it works across environments (localhost, staging, prod).

### 3a. Mobile billing portal — `api_billing_portal`

```python
from django.urls import reverse

return_url = request.build_absolute_uri(reverse("return_to_app"))  # no status = "manage"

session = stripe.billing_portal.Session.create(
    customer=user_profile.stripe_customer_id,
    return_url=return_url,
)
```

Replace the old hardcoded `return_url = "https://www.usquery.com/subscription/manage/"`.

### 3b. Mobile new-subscriber checkout — `api_create_checkout_session`

For the `stripe.checkout.Session.create(...)` call in the **mobile** path:

```python
base = request.build_absolute_uri(reverse("return_to_app"))

session = stripe.checkout.Session.create(
    mode="subscription",
    # ... line_items, customer, metadata={user_id, tier} (unchanged) ...
    success_url=f"{base}?status=success",
    cancel_url=f"{base}?status=cancel",
)
```

> The webhook (`checkout.session.completed`) is still the source of truth for the
> tier flip. These URLs are **UX only** — they just get the user back into the app.
> Do **not** rely on `?status=success` to grant the subscription.

---

## 4. What the app does with the result (FYI, already implemented)

- **Portal:** after the in-app browser closes, the plans screen refreshes
  (`loadData()`), so a card update or cancellation made inside the portal shows up.
- **Checkout:** the app reads the returned URL — `?status=cancel` → just refresh;
  otherwise → show the success screen. The webhook finalizes the tier regardless.

So the `status` value only needs to be **`success`**, **`cancel`**, or omitted
(treated as `manage`). No other contract.

---

## 5. Test checklist

- [ ] `curl` the bounce URL → `302` with `Location: usqmobileapp://...` (step 2).
- [ ] **Portal (dev build, real device/emulator):** subscribe → open billing portal
      → tap the portal's "Return" / close → in-app browser closes and you're back on
      the plans screen (not a web page).
- [ ] **Checkout success:** new subscriber → complete Checkout → bounced back into
      the app → success screen; tier flips once the webhook lands.
- [ ] **Checkout cancel:** start Checkout → hit Stripe's back/cancel → bounced back
      into the app → plans screen, no tier change.
- [ ] Confirm **web** flows are unchanged (web `return_url`/`success_url`/`cancel_url`
      still point at the real web pages).

---

## Notes & gotchas

- **Dev build required for the app side.** `usqmobileapp://` only resolves in a
  development build / standalone app, not Expo Go (which uses `exp://`). If the app's
  auth session can't start it falls back to the system browser (no auto-return) — so
  the bounce page's visible "Tap here…" link is the safety net.
- **iOS shows a one-time consent dialog** ("…Wants to Use stripe.com to Sign In")
  the first time — expected for `ASWebAuthenticationSession`.
- **Keep portal plan-switching disabled** in the Stripe Dashboard billing-portal
  config (see `stripe_integrations.md` §4) — unrelated to this change but still
  required so tier changes flow through the app.
- **Alternative not taken:** iOS Universal Links / Android App Links could avoid the
  bounce view, but they're unreliable *inside* the in-app auth browser (they tend to
  open the web page instead of the app), and they need `apple-app-site-association` +
  `assetlinks.json` hosting. The scheme bounce is simpler and works in-browser on
  both platforms. (See `stripe_integrations.md` §4a.)
```
