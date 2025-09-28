# Environment Variables & Sequencing

## Expo `.env`
```
EXPO_PUBLIC_API_BASE_URL=https://api.dropo.example
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyA7k2rXZ_EIPf768ZogKJhfZAhBTR06lvI
EXPO_PUBLIC_RAZORPAY_KEY_ID=                              # user-supplied; integration pending
EXPO_PUBLIC_APP_VERSION=1.0.5                             # keep in sync with app display
EXPO_PUBLIC_SENTRY_DSN=                                   # optional
```

> Secrets (OTP, Razorpay secret, DB, etc.) stay in backend `.env` only.

## Backend `.env`
```
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/dropo
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
JWT_ACCESS_TTL=900s
JWT_REFRESH_TTL=30d
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
GOOGLE_MAPS_SERVER_KEY=                                   # same key but treat as secret on server
EXPO_PUSH_ACCESS_TOKEN=                                   # optional for push broadcast
RAZORPAY_KEY_ID=                                          # placeholder until user integrates
RAZORPAY_KEY_SECRET=
```

## Sequencing
1. **Backend scaffolding**: initialize NestJS project under `server/`, configure Prisma schema, run migrations, seed catalog.
2. **Auth + OTP**: build request/verify endpoints, integrate Twilio, implement JWT issuance.
3. **Catalog endpoints**: categories/products/add-ons seeds accessible.
4. **Cart + Orders**: server-side cart, order creation (Razorpay stub), coupon application, webhook stub.
5. **Notifications**: push token storage and send helper.
6. **Frontend auth flow**: phone entry → OTP → name capture; store tokens.
7. **Home & catalog UI**: hook categories/products, dynamic theming.
8. **Product details & cart**: implement selectors, add to cart, cart screen, checkout summary using actual API.
9. **Profile/Addresses**: address CRUD with Google Places, order history, logout.
10. **Testing + QA**: ensure API and app flows stable; stub Razorpay until user completes integration.

