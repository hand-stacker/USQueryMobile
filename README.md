# USQ Mobile App

A React Native app built with Expo, using the Expo Router for file-based routing and Apollo Client for GraphQL data fetching. This README gives quick setup instructions, explains the repo layout, and points to common developer patterns used across the codebase.

## Requirements

- Node.js (16+ recommended)
- npm
- Expo CLI (optional: `npx expo` works)

## Install

```bash
npm install
```

## Run (development)

Start the Expo dev server:

```bash
npm start
# or
npx expo start
```

Then open the app on a simulator, device (Expo Go / Dev Client), or web from the dev tools.

Platform shortcuts (package.json scripts):

```bash
npm run android
npm run ios
npm run web
```

## Reset helper

To scaffold a fresh `app` directory from the starter example run:

```bash
npm run reset-project
```

This moves starter code to `app-example` and creates a blank `app` so you can begin a new implementation.

## Project Overview and Key Files

- Root layout / router: [app/_layout.tsx](app/_layout.tsx)
- Apollo Client: [app/api/apollo.js](app/api/apollo.js)
- Global styles: [app/globals.css](app/globals.css)
- Main screens and routes: `app/` (file-based routing via Expo Router)
- Hooks: [app/hooks/](app/hooks) — lightweight hooks encapsulate GraphQL queries and return normalized defaults
- Reusable UI: [app/components/](app/components)

Notable dynamic routes and conventions:

- Bill detail: [app/bill/[bill_id].tsx](app/bill/[bill_id].tsx)
- Member detail: [app/member/[membershipId].tsx](app/member/[membershipId].tsx)
- Vote detail: [app/vote/[vote_id].tsx](app/vote/[vote_id].tsx)

Filename conventions:

- Dynamic routes use bracketed names (e.g. `[bill_id]`).
- Suffix `_info`, `_sm`, etc. denote alternate/detail variants.

## Routing & Layout

This project uses Expo Router's file-based routing. The root layout is defined in [app/_layout.tsx](app/_layout.tsx) and registers stacks and top-level routes (including `(tabs)` and `bill/*`). Tabs live under `app/(tabs)/`.

## Data fetching (Apollo)

Apollo Client is configured in [app/api/apollo.js](app/api/apollo.js). The codebase prefers small custom hooks in `app/hooks/` that wrap GraphQL queries with `gql` and `useQuery` and return stable defaults (avoid `undefined` on return values). Example hooks include `useGetBill`, `useGetRecentBills`, `useGetVote`, etc.

When modifying a GraphQL query that returns relay-style `edges.node`, update consumers or maintain the same shape to avoid runtime errors.

## Hooks & Components

- Hooks are the canonical place for GraphQL queries: [app/hooks/](app/hooks)
- Reusable components live in [app/components/] and `app/bill/components/`, `app/vote/components/`, `app/member/components/` as appropriate.

Follow these patterns:

- Keep hooks prefixed with `use` and return sensible defaults (empty arrays, null-safe objects).
- Use component props for small UI pieces; screens compose these reusable components.

## Styling

The project uses `nativewind` (Tailwind for React Native). Global CSS is in [app/globals.css](app/globals.css) and Tailwind tokens are in `tailwind.config.js`. Prefer `className` utility classes for layout and quickly compose designs.

## Tests / Linting

- Lint: `npm run lint`

There are no automated tests by default; add unit or integration tests as needed under a `__tests__` folder.

## Useful Commands

- Install: `npm install`
- Start: `npm start` or `npx expo start`
- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`
- Reset project: `npm run reset-project`
- Lint: `npm run lint`

## Where to look for examples

- Hook pattern: [app/hooks/useGetRecentBills.tsx](app/hooks/useGetRecentBills.tsx)
- Apollo config: [app/api/apollo.js](app/api/apollo.js)
- Routing and layout: [app/_layout.tsx](app/_layout.tsx)
- UI component example: [app/components/SearchButton.tsx](app/components/SearchButton.tsx)

## Contributing

- Keep changes minimal and focused.
- Preserve query shapes when changing GraphQL responses or update all consumers.
- Add new screens under `app/` following the existing naming conventions.

If you'd like, I can:

- run the app locally and verify startup
- add a short developer checklist or PR template

---
Updated to reflect project patterns and helpful links for contributors.
