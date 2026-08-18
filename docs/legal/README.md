# Legal documents

Plain-text masters for the two legal documents. Keep these paste-ready: no
markdown, no editorial notes — whatever is in the file is what a user or an App
Review engineer reads.

| File | Used for |
|---|---|
| `terms-of-use.txt` | The EULA. Pasted into App Store Connect → App Information → License Agreement → *Custom License Agreement* (all territories). |
| `privacy-policy.txt` | The privacy policy. |

Each document exists in three places that must be changed together:

1. **This directory** — the master copy.
2. **usquery.com** (separate repo, Django + Bootstrap dark theme) —
   https://www.usquery.com/terms-of-service/ and
   https://www.usquery.com/privacy-policy/. Note the terms page is *titled*
   "Terms of Use"; only the URL slug says terms-of-service. These are the URLs
   `TERMS_OF_USE_URL` / `PRIVACY_POLICY_URL` in `constants/iap.ts` point at, and
   the ones Apple checks resolve.
3. **In-app copies** — `app/misc/terms_of_use.tsx`,
   `app/misc/privacy_policy.tsx`, `app/misc/PrivacyPolicyModal.tsx`, and the
   summary in `app/misc/TermsOfUseModal.tsx`.

Bump the effective date at the top of a document whenever you change it, and
update it in the in-app copies too.

## On re-prompting for acceptance

`app/store/appSettingsStore.ts` records acceptance as three one-time booleans
(`disclaimerAccepted` → `privacyAccepted` → `termsAccepted`), shown in that
order by the modals in `app/misc/`. They fire once and never again.

This is deliberate. Section 12 of the Terms says continued use after reasonable
notice constitutes acceptance, so routine edits do not need a new gate — and
re-prompting on every change trains users to dismiss the modal unread, which
makes the consent record weaker, not stronger. If a genuinely material change
lands (liability, dispute resolution, a new category of data processing),
handle it deliberately rather than automatically: add a version number to the
relevant flag and reset it for that release.
