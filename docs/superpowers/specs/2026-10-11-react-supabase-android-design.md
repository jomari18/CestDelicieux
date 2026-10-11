# C’est Délicieux — React, Supabase and Android conversion

Date: 11 October 2026. Status: approved by owner; implementation plan prepared, not implemented.

## Intent and accepted requirements

Convert the supplied restaurant ordering website into a complete, working React web application and installable Android app backed by a dedicated Supabase project. Use **02 — Atmospheric Supper Club** from `design-directions-preview.zip`: charcoal, cream, burgundy, cinematic restaurant photography and serif headings. The source archive is `CC104-finalproj-main (1).zip`.

The owner selected React + Capacitor, pickup and delivery, Philippine pesos, payment on receipt, and automatic distance-based delivery fees of **₱15 per kilometre with a ₱50 minimum**. The pickup location must be a clearly labelled demo pin around Metro Manila, not a claimed actual restaurant address. Preserve the existing brand and legitimate menu/content/assets while repairing the original incomplete behavior. Keep this project separate from MediSched and its databases.

Success means a customer can browse real database-backed products, register/verify/sign in, build a cart, get a server-validated delivery quote or choose pickup, place one durable order, and follow its history/status. Authorized staff can maintain the menu and process orders. The same application must build as a web release and an installable Android debug APK, with native back navigation and phone-friendly layouts.

## Source audit and mapping

- `index.html`: landing, restaurant/story content, menu, contact form and blog-style stories. Rebuild as React sections and routes; turn contact submission into a saved message, and story links into readable content instead of empty anchors.
- `cart.html` / `cart.js`: hardcoded catalogue and in-memory cart; rebuild as menu, cart and checkout. The original checkout displays an alert rather than persisting an order. There is no existing database or authentication to migrate.
- Original cart faults include an undefined `checkoutBtn`, stray `t` reference, repeated ID 28, duplicate product entries and inconsistent product price handling. Preserve unique dishes and source prices; reconcile duplicate IDs/products into stable database IDs. Use normal UTF-8 names with verified image mappings.
- Original archives contain large 3375 × 3375 PNGs, several above 8–11 MB. Produce responsive optimized derivatives for the delivered web/Android app and retain an asset provenance/mapping list. Do not put the entire mockup over the UI.
- Design preview supplies two concepts; only concept 02 becomes the application, with its menu/cart/mobile guidance carried across all screens.

## Architecture and alternatives

**Selected:** React + TypeScript + Vite, React Router, a small cart/auth state layer, Supabase JS, SQL/RPC functions and a Supabase Edge Function for delivery quotes; Capacitor wraps the built application for Android. One source tree, one domain contract and one backend serve web and Android.

Alternatives considered: React Native as a second mobile implementation would require duplicate UI/navigation and separate testing; the owner chose Capacitor. A frontend-only distance calculation would permit modified prices and would confuse straight-line distance with delivery road distance; use authenticated server-side routing instead. Avoid building a separate Node application server when the transactional work belongs in Postgres and the routing call fits an Edge Function.

Implementation uses current compatible pinned dependency versions, checked against official documentation before installation. Framework conversion is explicitly authorized. Use dependencies for React routing, accessible maps and Capacitor platform integration; avoid a large UI framework for a custom reference design.

## Screens and design system

### Public browsing

Landing: dark navigation, cinematic hero with cream serif headline, burgundy ordering CTA, signature-dish feature, numbered categories, story section and contact/footer. Use the supplied photography as real assets. Preserve source story content without inventing restaurant contact details or operating hours.

Menu: public active catalogue, category filtering, text search, readable dish panels, pesos formatting, quantities and Add to order controls. Loading, empty search and network errors must be visible and recoverable.

Contact: validated name, email, optional phone and message. Authenticated customers submit through a bounded backend endpoint; signed-out customers receive a sign-in prompt. Staff have a read-only message inbox and can mark messages reviewed. Do not claim an email was sent when only a message was saved.

### Customer account and checkout

Registration/sign-in, email verification and resend, sign-out and basic profile fields. Browse/cart work without login; verified login is required before checkout. Preserve the cart through sign-in and reload. Store product IDs/quantities only; refresh prices and availability from the backend. Never store passwords or OTPs.

Cart: line quantities, remove controls, current subtotal and clear actions. Cart limits: 30 distinct products, quantity 1–99 each. Disabled/unavailable items require correction before order placement.

Checkout: pickup/delivery selection, contact name and phone, notes, item summary, fulfillment fee and total, explicit pay-on-receipt label, and a confirmation step. Delivery requires a descriptive address and confirmed map pin; pickup does not require an address or delivery quote. Do not clear the cart until a durable successful order response.

Order detail/history: human-readable order reference, immutable product/price snapshots, fulfillment choice, fee/distance snapshot, total, payment state and status timeline. Owners see only their own records. Customers can cancel pending orders; later stages direct them to restaurant staff.

### Staff workspace

Database-assigned staff only: orders with status/fulfillment/search filters, details and bounded pagination; permitted status actions; menu/category create/update/deactivate; restaurant delivery settings; contact-message inbox. No role selection on registration and no authorization through editable user metadata.

Pickup flow: pending → accepted → preparing → ready → completed. Delivery flow: pending → accepted → preparing → ready → out_for_delivery → delivered. Staff can reject a pending order and cancel a pending or accepted order; terminal states cannot be advanced. Separate payment state is unpaid → collected, recorded when payment is received; fulfillment must never imply a successful online transaction.

### Responsive and Android presentation

Desktop: cinematic landing and content columns; checkout/order summary side by side; staff tables. Tablet: balanced two-column cards. Phones: stacked cards, collapsible navigation, sticky cart/checkout action, safe-area spacing and 44px minimum touch targets. No horizontal page overflow; dialogs remain scrollable with the keyboard open. Maintain reference colors and typography without sacrificing contrast or readable prices.

Android: local bundled web assets, release backend configuration rather than a localhost `server.url`, correct system back handling, network/offline feedback, session restoration and location permission only after the customer requests “Use my location.” Location denial always leaves a manual pin option. Reduced-motion preferences stop decorative motion. No offline checkout, hidden tile download, live courier tracking or push notifications are implied.

## Delivery estimate

### Demo origin and coverage

Initial origin: latitude 14.5995, longitude 120.9842, labelled **“Demo pickup point — Metro Manila”**. This is an approximate map origin for the portfolio app, not a claimed street address or real operating venue. Staff can edit the pin and label. The initial delivery limit is **25 km road distance**, editable by staff; the checkout must display the configured limit. Location edits invalidate outstanding quotes.

Destination: choose a map pin or explicitly request current location, then confirm it with the written address. Show coordinates/map marker and allow correction. Do not silently use a geolocation result or infer a physical address from a postcode.

### Routing and quote security

Use OpenRouteService driving-car directions behind the Supabase `delivery-quote` Edge Function. Its documented summary returns route distance in metres. Keep the provider key in Edge secrets; never ship it to the browser/APK. Leaflet provides the pin UI with properly attributed OSM tiles for normal interactive use; no offline tile prefetching. Routing integration is configurable and must have a real service check before delivery is labelled ready.

The endpoint accepts authenticated, confirmed customers and validated destination coordinates. It loads the restaurant origin/rate/coverage policy from trusted settings, calls the fixed provider URL with timeout, checks route response/finite distance, rejects routes outside the configured limit, and creates an owner-scoped quote. Apply backend request throttling and avoid route calls on every pin drag; request after explicit pin confirmation.

Fee in whole pesos: `max(50, ceil(distance_metres × 15 / 1000))`, stored as integer centavos. Thus 100 m → ₱50, 3 km → ₱50, 4 km → ₱60, 12 km → ₱180. Calculate from provider metres, not the rounded distance displayed to the user. Editable rates are versioned; minimum and per-km values must be nonnegative bounded integers.

Quotes expire after five minutes and bind owner, destination, origin/settings version, provider distance and fee. Only a service-side function can create quotes. Order placement consumes one valid quote atomically; retries using the same order request ID return the existing order. Changing destination/fulfillment or delivery settings requires a new quote. Do not trust client fee/distance or reuse another account’s quote.

If routing is unavailable, quota-limited or no road route is found, show a meaningful error and Retry/Pickup options. Never substitute a fabricated route or silently charge a straight-line estimate. A missing routing key is a setup limitation, not a successful delivery quote.

## Supabase data and authorization

Use a **separate C’est Délicieux Supabase project**. No changes to MediSched or ZolTrack/ZolNutrition resources. Create ordered SQL migrations and a deterministic seed catalogue; there is no source database dump to transfer. Host only public URL/publishable key in React/Android configuration.

Tables: profiles, categories, products, restaurant_settings, orders, order_items, order_events, contact_messages; private staff_memberships, delivery_quotes and quote-rate-limit records. Profiles come from the Auth insertion trigger. Products/categories are public-read while enabled; profiles/order records are owner-scoped, staff operations use bounded authorized APIs. Private tables are not directly readable by browser roles.

Orders snapshot recipient/contact/address, fulfillment, currency, prices, distance/fee and policy version. Order items snapshot product name/unit price/quantity, so future menu edits do not rewrite history. Money uses integer centavos and checked bounds. Deactivate products instead of deleting referenced order history.

`place_order` derives customer identity from verified Auth, reads active products and current prices, validates cart/contacts/fulfillment, computes subtotal and total in one transaction and consumes the quote for delivery. Stable UUID request IDs ensure identical retries make one order; changed payload/owner with the same ID fails. A price mismatch returns a review-required response, not an unnoticed charge. Pickup always has zero delivery fee.

Staff mutations verify private membership, expected version and valid transition, update atomically and append an audit event with an action UUID. Repeated identical actions are idempotent; stale/different actions fail with reload guidance. Payment collection is separately audited and idempotent. Product changes and delivery-policy updates are staff-only.

Use RLS, explicit grants, fixed search paths and server-derived identity. Anonymous access cannot submit orders/quotes or read customer information. Contact submissions have validation and throttling. Logs must not expose auth tokens, full addresses or provider secrets. Tests run in a separate disposable local database with synthetic accounts; never populate hosted production with test fixtures automatically.

## Errors, concurrency and privacy

Network failures leave the cart and entered fields available. Unknown order-save outcomes preserve the exact request UUID and payload for retry; do not offer a new submission that duplicates an order. Account switches clear private orders/staff data and invalidate in-flight responses while preserving only the current user’s safe cart policy. Quote latency and timer use server issuance/expiry. User-edited fields clear stale quotes.

The customer cannot forge a price, take another user’s quote, set payment collected, grant themselves staff, advance fulfillment or bypass email verification. The application does not process card payments or guarantee real fulfillment; customer-facing copy identifies the portfolio demonstration and the demo pickup pin.

## Verification and deliverables

Delivery includes complete source, optimized asset pack/mapping, SQL migrations/seed, staff assignment instructions, `.env.example`, setup docs, audit report, web production build and Android project/debug APK. Release signing and Play Store publication require the owner’s signing/account information and remain separate from an installable debug build.

Current PC has Node/npm but no detected Android SDK/JDK/Android Studio. The implementation plan must provision the required official Android toolchain before claiming an APK build; generating only an Android folder does not satisfy the Android deliverable. Never commit signing keys or local SDK files.

Checks: TypeScript/build and focused unit tests; isolated Postgres authorization, money, quote expiry/ownership/consumption, request idempotency and staff transitions; Edge routing provider failures and response validation; installed Playwright CLI desktop/tablet/phone flows; Android Gradle build, bundled asset/backend config checks, emulator/physical device tests when available. Tests cover routing denial, invalid/out-of-range coordinates, delivery/pickup switches, stale totals, duplicate clicks, stock/deactivation changes and Android back/navigation.

Audit distinguishes mocked browser results, real local database behavior, real hosted integration and physical device evidence. Live deployment, real messages/orders and any paid service/account creation must be explicitly identified before execution. Do not announce the conversion complete while a mandatory deliverable or required check is unavailable.

## Scope boundaries

Included: all source website sections, repaired persistent ordering, auth, order history, contact persistence, staff menu/order/settings management, automatic delivery quotes, responsive redesign and React/Android build conversion.

Not added without another request: online payment gateways, rider accounts/live GPS tracking, multi-branch restaurants, reservations, inventory procurement, loyalty points, SMS or store publication. Database-backed delivery quotes do not imply these features.

## Reference documentation

- React/Supabase: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
- SQL functions/security: https://supabase.com/docs/guides/database/functions
- Capacitor environment: https://capacitorjs.com/docs/getting-started/environment-setup
- OpenRouteService directions: https://giscience.github.io/openrouteservice/v9.10.0/api-reference/endpoints/directions/requests-and-return-types
- Map tile policy: https://operations.osmfoundation.org/policies/tiles/
