# Frontend Implementation Plan (Expo App)

## Global
- Install `@tanstack/react-query` for API data fetching + caching.
- Introduce `axios` (or `ky`) wrapper configured with `EXPO_PUBLIC_API_BASE_URL` and auth interceptors.
- Centralize theme tokens extracted from Figma (colors, typography, spacing). Convert existing `COLORS` to category-specific palettes.
- Load fonts on app start and provide fallback text styles.
- Add global error boundary / toast notifications (e.g., `react-native-toast-message`).
- Revise routing guard: switch from name-only guard to auth token check. If no token, route to authentication flow (OTP).

## Authentication Flow
1. **Phone entry screen**: capture phone number, call `/auth/request-otp`.
2. **OTP verification screen**: 6-digit input, handle resend timer, verify via `/auth/verify-otp`.
3. Store tokens (access + refresh) securely using `expo-secure-store` or `react-native-mmkv`.
4. Update `useUserStore` to persist auth state (name, phone, tokens) and expose `logout`.
5. After verification, prompt for name (existing screen) if missing.

## Home / Dashboard (`/(protected)/index`)
- Fetch categories via `useQuery` and display horizontal segment with icons defined in Figma.
- Fetch products filtered by selected category; show card carousel with gradient backgrounds, price, rating (if any). Use data from API.
- Integrate search bar (if present in design) and daily offers section.
- `View all` navigates to category listing screen.
- Update header to include location label, change detection when user selects different address.

## Product Details (`/(protected)/[itemId]`)
- Replace hard-coded data with API fetch by slug.
- Render hero image with gradient overlay as per Figma.
- Implement selectors for size, milk, add-ons; compute dynamic price.
- Show nutrition facts, recommended combos.
- `Add to cart` triggers API call to `/cart` and updates local cache (React Query invalidate/optimistic update).
- Bottom sheet displays summary with ability to adjust add-ons before finalizing.

## Cart Screen (`/(protected)/cart`)
- Layout as per design: list items (image, title, add-ons), quantity steppers, price breakdown.
- Display coupon section with apply/remove via API.
- Show delivery address summary with option to change.
- CTA `Checkout` leading to review screen.

## Checkout Flow
- **Order Review Screen**: replicates PDF layout (bill summary, last-minute add-ons, coupon, totals, pay button).
- **Payment**: Since Razorpay integration deferred, implement placeholder hooking into backend `POST /orders` with `paymentMethod: "COD"` and show success state.
- After backend returns order confirmation, navigate to order tracking screen.

## Order Tracking / History
- Order timeline page showing statuses (chips, progress bars) according to design.
- Order history list under profile.
- Option to repeat or customize order (prefill cart with previous items).

## Address Management
- Listing screen with addresses, add/edit forms (maps autocomplete, location picker).
- Use Google Places Autocomplete (`react-native-google-places-autocomplete`) with provided API key.
- Save selected address to server and set default.

## Profile & Settings
- Match design for profile header (avatar, name, phone).
- Implement items: Address management, Order history, Queries (open WhatsApp deep link), Logout.
- Show app version at bottom.

## Notifications
- Request notification permissions, register Expo push token, send to backend via `/users/me/push-token`.
- Handle incoming notifications for order updates (link to relevant screen).

## State Management & Storage
- Expand `useUserStore` to hold tokens, selected address, cart count.
- Add `useCartStore` or rely on React Query caches + selectors.

## Navigation
- Introduce new screens in router: `/(auth)/phone`, `/(auth)/otp`, `/(protected)/cart`, `/(protected)/checkout`, `/(protected)/orders`, `/(protected)/addresses`, etc.
- Use nested stack for modals (e.g., map picker, payment status).

## Styling
- Derive typography scale from Figma (H1, H2, body, caption) and consolidate into theme file.
- Ensure spacing and rounded corners match design tokens.
- Add shadows/elevations as per design using `expo-linear-gradient` and `react-native-svg` if necessary.

## Testing & QA
- Unit test hooks/utilities.
- Use MSW (Mock Service Worker) for API mocking in tests.
- Provide Storybook (optional) or at least a component playground for verifying UI states.

