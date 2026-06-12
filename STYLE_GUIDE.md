# My Congress — App Style Guide

Reference for building UI in this app. Keep this file updated when patterns change.

## Theming

All colors come from the theme objects in `app/theme/theme.tsx` (`LightTheme` / `DarkTheme`).
**Never hardcode colors** — read the theme from context:

```tsx
import { ThemeContext } from '../theme/themeContext';

const { theme } = useContext(ThemeContext);
const styles = createStyles(theme);
```

### Theme tokens

| Token | Use for |
|---|---|
| `background` | Screen and modal backgrounds |
| `text` | Body text |
| `titleText` | Headings and titles |
| `subtext` | Secondary/descriptive text |
| `innerText` | Text on filled primary buttons (always white) |
| `primary` | Brand blue — buttons, active states, accents, links |
| `accent` | Orange — sparing emphasis only |
| `secondary` | Ghost/secondary button backgrounds |
| `card` | Card surfaces |
| `inactive` | Disabled elements |
| `border` | Hairline borders, inactive dots |
| `shadow` | `shadowColor` for elevation |
| `overlay` | Modal backdrop |

Tinted fills are made by appending alpha hex to `primary`: background `theme.primary + '22'`,
border `theme.primary + '55'` (see `AIFeaturesCarousel`, `DemoFeatureButton`).

Theme-aware assets: check `theme.name === 'dark'` to pick `_dk` vs `_li` image variants.

### Style factory pattern

Every component defines styles as a factory taking the theme, declared after the component:

```tsx
const createStyles = (theme: any) => StyleSheet.create({ ... });
// (some files name it `styles` and alias as `const s = styles(theme)`)
```

Memoize with `useMemo(() => createStyles(theme), [theme])` in components that re-render often.

## Typography

- Default system font for UI. `Tinos_400Regular` / `Tinos_700Bold` are loaded for serif display text.
- Sizes: modal/screen titles **20/700** on `titleText`; section/feature titles **15–16/700**;
  body **14–15/400**, lineHeight ~1.4×; secondary/descriptions **12–14/500** on `subtext`;
  small labels (tab bar, chips) **12/600**.
- Uppercase section headers: **13/700**, `letterSpacing: 0.6`, with a 4×16 rounded accent bar
  (`theme.primary`) to the left (see `AIFeaturesCarousel` `sectionHeader`).
- Use `UnscalableText` (`app/components/UnscalableText.tsx`) where OS font scaling would break
  layout (tab labels, badges). Use `scaleFont()` (`app/utils/scaleFont.tsx`) for controlled
  scaling (clamps at 1.5×).

## Spacing & shape

- Border radius: **12** for cards and modals, **8–10** for buttons and small cards, **999** for pills/chips.
- Padding: **22** inside modals, **12–14** inside cards.
- Gaps: 6–10 between related elements, 12–14 between blocks.
- Shadows (cards): `shadowOffset {0,1}`, `shadowOpacity 0.06`, `shadowRadius 3–4`, `elevation 1–2`.
- Shadows (modals): `shadowOffset {0,2}`, `shadowOpacity 0.18`, `shadowRadius 6`, `elevation 6`.

## Components & patterns

### Buttons

- **Primary** (main action): filled `theme.primary`, radius 8, `minHeight 46`, text 16/600 `innerText`, full width.
- **Ghost/secondary**: filled `theme.secondary`, text 14/600 `theme.text`, often in a `flexDirection: 'row'` pair with `gap: 10`.
- **Tinted CTA** (feature links): `primary + '22'` bg, 1px `primary + '55'` border, `primary` text/icon — see `app/demos/DemoFeatureButton.tsx`.
- Use `Pressable` with pressed feedback: `opacity ~0.72` (and optionally `scale: 0.98`).

### Cards

- Base: `theme.card` background, radius 10–12, padding 12–14, light shadow.
- `AccentCard` (`app/components/AccentCard.tsx`): card with a 3px colored left border — use for categorized/status content.

### Modals (global, app-level)

Pattern used by `ReviewModal`, `WhatsNewModal`, etc. (`app/misc/`):

- Rendered unconditionally in `AppNavigation` (`app/_layout.tsx`), after the navigators.
- Component owns its own visibility, driven by a persisted zustand store; wait for the store's
  `_hasHydrated` flag before deciding, and guard with a `useRef` so the check runs once.
- RN `Modal` with `animationType="fade"`, `transparent`, `onRequestClose`.
- Layout: `SafeAreaView` overlay (`theme.overlay`, centered) → container `width: '88%'`,
  `maxWidth: 480`, `theme.background`, padding 22, radius 12, modal shadow.
- Navigation from a modal uses `navigate()` from `app/navigation/navigationRef.tsx` (close the modal first).

### Carousels

- Dot indicators: 6×6 circles in `theme.border`; active dot stretches to 16 wide in `theme.primary`; row `gap: 6`.
- Paged carousels use a horizontal `ScrollView` with `pagingEnabled` and a measured page width
  (`onLayout`); compact auto-advancing carousels use fade animation + `PanResponder` (see `AIFeaturesCarousel`).

### Icons

`Ionicons` from `@expo/vector-icons` (mostly `-outline` variants), 16–22px in content, colored
with theme tokens. `AntDesign` close icon lives in the shared `CloseButton` component.

## State & persistence

- Persisted client state: zustand + `persist` middleware with `zustandStorage`
  (`app/services/zustandStorage.ts`, AsyncStorage-backed). One store per concern in `app/store/`.
  Include a `_hasHydrated` flag set in `onRehydrateStorage` (see `appVersionStore.ts` for the minimal pattern).
- Authenticated API calls go through `authRequest` (`app/hooks/authRequest.tsx`); public endpoints
  use plain `fetch` wrappers in `app/api/`.

## Versioning & update modals

Two version sources, two modals (both in `app/misc/`, state in `app/store/appVersionStore.ts`):

- **Installed binary version** — `nativeApplicationVersion` from `expo-application`
  (Android `versionName` / iOS `CFBundleShortVersionString`).
- **Released version** — `GET https://www.usquery.com/api/auth/app-version/` → `{ "version": "1.0.4" }`.

**`WhatsNewModal`** — shows once after an update: the running app version
(`Constants.expoConfig.version`, falling back to the binary version) is newer than the persisted
`lastSeenVersion`; once shown, `lastSeenVersion` is set to that version.
Fully offline. **`UpdateAvailableModal`** — shows when the released version is newer than the
installed binary; "Maybe Later" mutes that released version (`dismissedUpdateVersion`). Skips any
launch where What's New is about to show, so the two never stack.

### Per-release checklist

1. For each user-facing feature, create `app/demos/<feature_key>/` with:
   - `<feature_key>_li.jpg` (light screenshot) and `<feature_key>_dk.jpg` (dark screenshot)
   - `description.txt` — one or two short sentences
   - `index.tsx` — exports a `DemoFeature` (see `app/demos/types.ts`) with a CTA button that
     calls `onDone()` then `navigate(...)` to the feature's screen
2. List the features in `app/demos/index.ts` (`DEMO_FEATURES`, order = carousel order).
3. Bump the binary version everywhere it lives — `version` in `app.json` **and** `versionName` in
   `android/app/build.gradle` (EAS `autoIncrement` only bumps `versionCode`, not `versionName`).
   What's New only triggers if this actually changes between releases.
4. After the release is live in the stores, bump the version returned by the app-version API —
   this is what triggers `UpdateAvailableModal` for users on older binaries.

`.txt` files are bundled as Metro assets (`metro.config.js`) and read with
`loadTextAsset()` (`app/utils/loadTextAsset.ts`). Store listing URLs live in
`constants/storeLinks.ts`.
