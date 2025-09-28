# Dropo Backend API

NestJS + Prisma service powering the Dropo mobile client.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local or hosted)
- Redis (optional, for future background jobs)

## Quick start

```bash
cd server
npm install
cp .env.example .env # update with your secrets
npm run prisma:generate
npm run prisma:migrate -- --name init # first run creates migrations
npm run prisma:seed                     # populate catalog data (requires database)
npm run start:dev
```

The API will be available at `http://localhost:4000/api/v1`. A public health check is exposed at `http://localhost:4000/healthz`.

## Available endpoints (initial)

- `POST /api/v1/auth/request-otp` – generates an OTP via Twilio Verify when credentials are configured; falls back to dev mode logging the code.
- `POST /api/v1/auth/verify-otp` – validates the OTP, creates or updates a user, and issues JWT/refresh tokens.
- `GET /api/v1/catalog/categories` – lists menu categories with color palettes.
- `GET /api/v1/catalog/products` – lists products with optional `category`, `search`, and `limit` query params.
- `GET /api/v1/catalog/products/:slug` – detailed product payload including variants, add-ons, and suggestions.
- `GET /api/v1/cart` / `POST /api/v1/cart` / `PATCH /api/v1/cart/:id` / `DELETE /api/v1/cart/:id` – server-side cart management with totals.
- `POST /api/v1/orders` – creates an order from the current cart (no payment capture yet) and clears the cart.
- `GET /api/v1/orders` / `GET /api/v1/orders/:id` – fetch order history and detail views.
- `GET /api/v1/users/me` / `PATCH /api/v1/users/me` – retrieve and update the authenticated profile.
- `GET /api/v1/users/me/addresses` plus CRUD endpoints for saved addresses.

## Environment variables

Refer to [`.env.example`](./.env.example) for the full list. Key settings:

- `DATABASE_URL` – PostgreSQL connection string.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_TTL` – token signing secrets and lifetimes.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` – enables production OTP delivery.
- `GOOGLE_MAPS_SERVER_KEY` – used later for server-side geocoding.

## Seeding catalog data

The Prisma seed script creates:

- 7 coffee beverages
- 5 tea beverages
- 10 cold beverages
- 10 snacks

Each product includes size variants, nutrition info, and add-on groups that match the Dropo design system.

Run it after migrations:

```bash
npm run prisma:seed
```

## Development notes

- OTP dev mode logs the generated code to the console and returns it in the API response (`devCode`) until Twilio credentials are supplied.
- Refresh/logout endpoints are scaffolded and will be completed once session management is finalised.
- Cart and order modules expose placeholder responses; wiring to Prisma is next on the agenda.

## Linting & testing

Testing harness is not yet configured; add Jest/Supertest in a follow-up once primary flows are stable.
