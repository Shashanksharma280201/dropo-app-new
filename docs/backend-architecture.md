# Backend Architecture Plan

## Tech Stack
- **Framework:** NestJS (Express adapter) for modular structure, DI, and testability.
- **Runtime:** Node.js 20 LTS.
- **ORM:** Prisma ORM targeting PostgreSQL for type-safe schema.
- **Database:** PostgreSQL (primary persistence). Use Supabase/Neon-compatible connection for managed hosting.
- **Cache & Jobs:** Redis (BullMQ) for OTP rate limiting, background notifications, cart caching.
- **Authentication:** Phone OTP via Twilio Verify. Backed by signed JWT access + refresh tokens.
- **API Style:** REST + OpenAPI spec, versioned under `/api/v1`.
- **Validation:** `class-validator`, `zod` for payload schema.
- **Documentation:** Swagger UI exposed at `/docs` in non-production.
- **Testing:** Jest + Supertest for integration tests.
- **Deployment:** Containerized with Docker; recommended host Render (managed PostgreSQL + Redis) or Fly.io. Provide GitHub Actions CI for lint/test.

## Core Modules & Entities

### Auth Module
- `POST /auth/request-otp`: Accepts phone number, enforces rate limit (5/min, 10/hr), triggers Twilio Verify OTP.
- `POST /auth/verify-otp`: Verifies code, creates user if new, returns access & refresh tokens.
- `POST /auth/refresh`: Rotates refresh token.
- `POST /auth/logout`: Invalidates refresh token (store hashed token in Redis blacklist).

### Users Module
- `GET /users/me`: Returns profile, default address, preferences.
- `PATCH /users/me`: Update name, email (optional), marketing opt-in.
- `PUT /users/me/push-token`: Store Expo push token (idempotent).

### Address Module
- `GET /addresses`: List saved addresses.
- `POST /addresses`: Create address with geocode lat/lng (via Google Maps Geocoding—backend call using service key).
- `PUT /addresses/:id`: Update label, details.
- `DELETE /addresses/:id`.
- `PATCH /addresses/:id/default`: Set default.

### Catalog Module
- `GET /catalog/categories`: Returns categories w/ hero imagery, color palette.
- `GET /catalog/products`: Supports query params `category`, `search`.
- `GET /catalog/products/:id`: Detailed info incl. default variant, nutrition, recommended add-ons.
- Entities:
  - `ProductCategory { id, name, description, heroImage, palette }`
  - `Product { id, categoryId, name, description, basePrice, nutrition, imageUrl, isRecommended }`
  - `ProductVariant { id, productId, sizeLabel, price, caloriesDelta }`
  - `AddonGroup { id, productId|null, name, selectionType (single/multi), minSelect, maxSelect }`
  - `AddonOption { id, groupId, name, priceDelta, isDefault }`
  - `ProductSuggestion { productId, suggestedProductId }`

### Cart Module
- Server-side cart keyed by user id.
- `GET /cart`: Fetch items.
- `POST /cart`: Upsert item (productVariantId, quantity, selectedAddons[], note).
- `PATCH /cart/:itemId`: Update quantity/add-ons.
- `DELETE /cart/:itemId`.
- `DELETE /cart`: Clear cart.

### Coupon Module
- `POST /coupons/apply`: Validate code, returns discount summary.
- `DELETE /coupons`: Remove applied coupon.
- Entities include usage limits, expiry, min order value.

### Orders Module
- `POST /orders`: Takes cart snapshot, address, payment method (Razorpay, COD). Creates `Order` + `OrderItem`s, triggers Razorpay order creation (handled by separate service stub since integration deferred).
- `GET /orders`: Paginated order history.
- `GET /orders/:id`: Detailed order states, timeline.
- `POST /orders/:id/cancel`: Cancel if allowed.
- Order statuses: `CREATED`, `PAYMENT_PENDING`, `PAID`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`.
- Webhooks:
  - `POST /webhooks/razorpay`: Stub endpoint so Razorpay integration can be layered later (verifies signature, updates order status).

### Notifications Module
- Service to send Expo push notifications using saved tokens.
- Background jobs to notify on order status updates.

## Database Schema Sketch

```prisma
model User {
  id              String   @id @default(cuid())
  phoneNumber     String   @unique
  name            String?
  email           String?  @unique
  defaultAddressId String?
  addresses       Address[]
  cartItems       CartItem[]
  orders          Order[]
  pushTokens      PushToken[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Address {
  id          String   @id @default(cuid())
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  label       String
  line1       String
  line2       String?
  city        String
  state       String
  postalCode  String
  latitude    Float
  longitude   Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProductCategory {
  id          String   @id @default(cuid())
  name        String
  description String?
  primaryColor String
  accentColor  String
  imageUrl    String?
  products    Product[]
}

model Product {
  id          String   @id @default(cuid())
  category    ProductCategory @relation(fields: [categoryId], references: [id])
  categoryId  String
  name        String
  slug        String   @unique
  description String
  imageUrl    String
  nutrition   Json
  isRecommended Boolean @default(false)
  variants    ProductVariant[]
  addonGroups AddonGroup[]
  suggestions ProductSuggestion[] @relation("ProductSuggestions")
  suggestedBy ProductSuggestion[] @relation("ProductSuggestedBy")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProductVariant {
  id         String  @id @default(cuid())
  product    Product @relation(fields: [productId], references: [id])
  productId  String
  name       String
  price      Decimal @db.Decimal(10,2)
  isDefault  Boolean @default(false)
}

model AddonGroup {
  id           String   @id @default(cuid())
  product      Product? @relation(fields: [productId], references: [id])
  productId    String?
  name         String
  selectionType String
  minSelect    Int       @default(0)
  maxSelect    Int       @default(1)
  options      AddonOption[]
}

model AddonOption {
  id          String @id @default(cuid())
  group       AddonGroup @relation(fields: [groupId], references: [id])
  groupId     String
  name        String
  priceDelta  Decimal @db.Decimal(10,2)
  isDefault   Boolean @default(false)
}

model CartItem {
  id          String  @id @default(cuid())
  user        User    @relation(fields: [userId], references: [id])
  userId      String
  product     Product @relation(fields: [productId], references: [id])
  productId   String
  variant     ProductVariant @relation(fields: [variantId], references: [id])
  variantId   String
  quantity    Int
  addons      CartItemAddon[]
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CartItemAddon {
  id          String @id @default(cuid())
  cartItem    CartItem @relation(fields: [cartItemId], references: [id])
  cartItemId  String
  addonOption AddonOption @relation(fields: [addonOptionId], references: [id])
  addonOptionId String
}

model Coupon {
  id          String @id @default(cuid())
  code        String @unique
  description String?
  discountType String // percentage or flat
  discountValue Decimal @db.Decimal(10,2)
  maxDiscount Decimal? @db.Decimal(10,2)
  minOrderValue Decimal? @db.Decimal(10,2)
  startsAt    DateTime?
  expiresAt   DateTime?
  usageLimit  Int?
  usedCount   Int       @default(0)
  createdAt   DateTime @default(now())
}

model Order {
  id           String   @id @default(cuid())
  user         User     @relation(fields: [userId], references: [id])
  userId       String
  address      Address  @relation(fields: [addressId], references: [id])
  addressId    String
  status       String
  subtotal     Decimal @db.Decimal(10,2)
  tax          Decimal @db.Decimal(10,2)
  deliveryFee  Decimal @db.Decimal(10,2)
  discount     Decimal @db.Decimal(10,2)
  total        Decimal @db.Decimal(10,2)
  paymentMethod String
  paymentStatus String
  razorpayOrderId String?
  couponCode   String?
  items        OrderItem[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model OrderItem {
  id          String @id @default(cuid())
  order       Order  @relation(fields: [orderId], references: [id])
  orderId     String
  productName String
  variantName String
  quantity    Int
  unitPrice   Decimal @db.Decimal(10,2)
  addons      Json
}

model PushToken {
  id        String @id @default(cuid())
  user      User   @relation(fields: [userId], references: [id])
  userId    String
  token     String @unique
  device    String?
  platform  String?
  createdAt DateTime @default(now())
}
```

## Seed Data
- 7 coffees (espresso, cappuccino, latte, mocha, cold brew, frappe, americano).
- 5 teas (masala chai, green tea, lemon tea, earl grey, iced tea).
- 10 beverages (smoothies, juices).
- 10 snacks (puff, croissant, fries, sandwiches, wraps).
- Each product defined with at least 2 size variants and relevant add-on groups (milk, toppings).

## Infrastructure Notes
- Provide Docker Compose with services: `api`, `postgres`, `redis`.
- Enable health checks (`/healthz`) and readiness.
- Use `@nestjs/throttler` for OTP endpoints.
- Global logging via Pino.
- Central error filter with consistent error envelope.

