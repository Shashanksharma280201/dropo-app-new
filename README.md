# Dropo App

Dropo is a two-part monorepo delivering a mobile-first coffee ordering experience. The Expo client handles the customer journey (auth, catalog, cart, checkout) while a NestJS + Prisma backend powers authentication, catalog management, and order orchestration.

## Repository Layout
- `app/` – Expo Router entry point with segmented routes for auth and protected areas.
- `components/` – Shared presentational widgets such as `Icon`, `ProductList`, `StatusBar`.
- `constants/` – Theme tokens (`COLORS`, `SIZES`) consumed across the UI.
- `lib/` – API client wrapper, data mocks, and shared TypeScript types.
- `stores/` – Zustand stores with persistency adapters (MMKV ⇢ AsyncStorage fallback).
- `server/` – NestJS service (modules for Auth, Catalog, Cart, Orders, Users, Health) plus Prisma schema.
- `assets/` – Fonts, images, and splash assets bundled by Expo.
- `docs/` – Planning docs for system architecture, environments, and frontend milestones.

## Frontend Architecture (Expo)
### Routing & Navigation
- Uses `expo-router` with stack + tab layouts. `app/_layout.tsx` wraps the app with `GestureHandlerRootView`, `SafeAreaProvider`, and `QueryClientProvider`.
- Authenticated vs unauthenticated flows are separated with folder-based routes:
  - `app/(auth)` handles phone OTP login and pre-profile onboarding.
  - `app/(protected)` presents the tabbed experience (Home, Orders, Cart, Profile) and hidden stack routes (addresses, checkout, product detail).
- Guard logic in each segment (`app/(auth)/_layout.tsx`, `app/(protected)/_layout.tsx`) redirects based on hydration state, token presence, and profile completeness.

### State & Data Fetching
- `stores/userStore.ts` persists session data (tokens, profile, addresses) using Zustand + `createJSONStorage`. MMKV is preferred; AsyncStorage is a fallback inside Expo Go.
- `lib/api.ts` creates a shared Axios instance, injects `Authorization` headers from the user store, and handles 401 refresh via a memoised promise to avoid stampedes.
- Fetching layer is powered by `@tanstack/react-query` (query client is scoped at the layout root). Components rely on hooks that consult the query cache and user store.

### UI Foundation
- Theme primitives are centralised in `constants/`; colors map to design palettes, while spacing/typography values drive consistent layout.
- `components/ProductList.tsx` showcases the animated carousel pattern: Reanimated interpolations drive parallax, tapping pushes to the product slug route.
- Fonts are loaded via Expo Font (see `assets/fonts` and the `Splash` configuration) and applied through style constants.
- `components/StatusBar.tsx` ensures status bar styles stay in sync with the current theme.

### Auth & Session Flow
1. Phone login (`/(auth)/phone`) captures the phone number and calls `/auth/request-otp` on the backend.
2. OTP verification (to be implemented) should call `/auth/verify-otp` and hydrate the user store with tokens.
3. If the profile lacks a name, the user is redirected to `/name` before entering the protected tabs.
4. Refresh tokens rotate transparently through the Axios interceptor; failures clear the store and return to the auth stack.

### Catalog, Cart, and Orders (planned wiring)
- Home screen fetches categories/products and applies palette-driven theming per category.
- Product detail route `/(protected)/product/[slug]` is prepared for deep linking and will fetch rich product data.
- Cart and checkout routes orchestrate server-side state; optimistic updates should go through React Query mutations.
- Address management and order history are hidden tab routes surfaced from the Profile screen.

## Backend Architecture (NestJS)
### Core Modules
- `AuthModule` – OTP via Twilio Verify, JWT issuance/refresh, guards for protected endpoints.
- `UsersModule` – Profile CRUD, Expo push token registration.
- `CatalogModule` – Category/product browsing, palette metadata, suggested items.
- `CartModule` – Server-side cart keyed by user, handles add/update/remove endpoints.
- `OrdersModule` – Order submission, status tracking, webhook stubs for Razorpay integration.
- `PrismaModule` – Database access layer; wraps PrismaClient with Nest DI.
- `HealthModule` – `/healthz` endpoint for readiness checks.

### Application Setup
- `src/main.ts` boots NestExpress with validation pipes, CORS (allowed origins from config), and API namespace `api/v1`.
- Global throttling is enabled with `@nestjs/throttler` to protect OTP endpoints.
- Configuration is sourced from `.env` and `.env.development` via `@nestjs/config`.
- Prisma migrations live under `server/prisma`; seeds populate the catalog for demos.

### Data Model & Persistence
- PostgreSQL holds users, addresses, catalog, cart, and order data defined in Prisma schema (`server/prisma/schema.prisma`).
- Redis (via BullMQ) is recommended for rate limiting, OTP caching, and background notification jobs.
- Twilio credentials drive OTP delivery; Razorpay keys unlock online payments once ready.

### API Conventions
- REST endpoints versioned under `/api/v1` with DTO validation using `class-validator`.
- JWT auth uses access + refresh tokens; refresh rotation happens via `/auth/refresh`.
- Errors follow standardized Nest HTTP exceptions, enabling predictable client handling.

## Local Development
### Prerequisites
- Node.js 20 LTS and npm 10+
- Expo CLI (`npx expo`), Android Studio or Xcode simulators for device testing.
- PostgreSQL 15+, Redis 6+ (Docker compose recommended).
- Twilio Verify sandbox account for OTP workflows.

### Run the Expo Client
```bash
npm install
npx expo prebuild --clean # only if generating native builds
npx expo start            # interactive dev server
```
Use `npm run lint` to run Expo’s ESLint rules before commits.

### Run the API Server
```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate     # creates local schema (use --name for clarity)
npm run start:dev          # watches TypeScript sources
```
Seed data with `npm run prisma:seed` when catalog fixtures are required.

## Environment Variables
### Expo Client (`.env` in repo root)
```
EXPO_PUBLIC_API_BASE_URL=https://api.dropo.example
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<maps-browser-key>
EXPO_PUBLIC_RAZORPAY_KEY_ID=<public-key>
EXPO_PUBLIC_APP_VERSION=1.0.5
EXPO_PUBLIC_SENTRY_DSN=<optional>
```

### Backend (`server/.env`)
```
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dropo
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<random-string>
JWT_REFRESH_SECRET=<random-string>
JWT_ACCESS_TTL=900s
JWT_REFRESH_TTL=30d
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
TWILIO_VERIFY_SERVICE_SID=<verify-service>
GOOGLE_MAPS_SERVER_KEY=<server-side-key>
EXPO_PUSH_ACCESS_TOKEN=<optional>
RAZORPAY_KEY_ID=<optional-until-live>
RAZORPAY_KEY_SECRET=<optional-until-live>
```
Keep client/public keys in Expo config only; all secrets belong in the backend environment.

## Before Shipping to Production
- **Source control** – Ensure `main` is up to date, PRs are merged, and version numbers (`app.json`, `EXPO_PUBLIC_APP_VERSION`, backend `package.json`) are bumped together.
- **Quality gates** – Run `npm run lint` (client) and `npm run build` + `npm run start:dev` smoke test (server). Add Jest/Supertest coverage for critical flows before first launch.
- **Migrations** – Review Prisma schema changes, generate SQL, and test `npm run prisma:deploy` against a staging database. Back up production DB prior to deploying.
- **Configuration** – Populate all required `.env` values, rotate JWT secrets, and verify Twilio/Razorpay credentials in the target environment. Confirm Expo EAS secrets mirror backend values where needed.
- **Security & compliance** – Enable HTTPS termination (Reverse proxy or API gateway), enforce CORS whitelist, configure rate limits for OTP endpoints, and audit third-party API quotas.
- **Build artifacts** – Create release builds (`eas build --profile production`, `npm run build` inside `server`) and smoke test on real devices with staging backend.
- **Monitoring** – Wire up logging (Pino pretty to stdout, centralised log shipping) and crash/error reporting (Sentry, Expo Updates rollouts). Set up health checks and uptime monitors for `/healthz`.
- **Rollout readiness** – Prepare migration plan for push notifications (Expo access token), confirm deep links and universal links, and stage feature flags for incomplete modules.

## Additional Resources
- See `docs/backend-architecture.md` for the broader service design and schema sketch.
- See `docs/frontend-implementation-plan.md` for the outstanding UI tasks and sequencing.
- See `docs/environment-and-sequencing.md` when provisioning secrets across environments.
