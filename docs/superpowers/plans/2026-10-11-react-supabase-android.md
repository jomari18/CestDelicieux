# C’est Délicieux Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the supplied restaurant website into a database-backed React ordering application and installable Capacitor Android debug APK.

**Architecture:** One React application serves public browsing, customer checkout/history and an authenticated staff workspace. Supabase owns authorization, transactional orders and status transitions; an Edge Function obtains trusted road-distance quotes. Capacitor bundles the production web build for Android.

**Tech Stack:** React, TypeScript, Vite, React Router, Supabase JS/Postgres/Edge Functions, Leaflet, Capacitor Android, Vitest and installed Playwright CLI.

**Spec:** [Approved conversion design](../specs/2026-10-11-react-supabase-android-design.md)

Status: plan for owner review. No application implementation or hosted database changes have started. Paths below are relative to `CestDelicieux/`.

## Global Constraints

- Use **02 — Atmospheric Supper Club**: charcoal, cream, burgundy, cinematic restaurant photography and serif headings.
- Preserve the existing brand and legitimate menu/content/assets while repairing the original incomplete behavior. Keep this project separate from MediSched and its databases.
- Pickup and delivery, Philippine pesos, payment on receipt, **₱15 per kilometre with a ₱50 minimum**.
- Initial origin: latitude **14.5995**, longitude **120.9842**, labelled **“Demo pickup point — Metro Manila”**. Initial delivery limit: **25 km road distance**, editable by staff.
- Fee in whole pesos: `max(50, ceil(distance_metres × 15 / 1000))`, stored as integer centavos. Calculate from provider metres, not rounded displayed distance.
- Quotes expire after **five minutes**. Only a service-side function can create quotes. Order placement consumes one valid quote atomically.
- Cart limits: **30 distinct products**, quantity **1–99 each**. Verified login is required before checkout. Never store passwords or OTPs.
- Do not clear the cart until a durable successful order response. Unknown order-save outcomes preserve the exact request UUID and payload for retry.
- Staff authorization uses private database membership, never editable user metadata. Payment collection is separate from fulfillment.
- Pickup: pending → accepted → preparing → ready → completed. Delivery: pending → accepted → preparing → ready → out_for_delivery → delivered.
- Staff can reject a pending order and cancel a pending or accepted order; terminal states cannot be advanced. Customers can cancel pending orders.
- Manual destination pin remains available when geolocation is denied. No fabricated or straight-line fallback when routing fails.
- **44px minimum touch targets**, no horizontal page overflow, scrollable dialogs, safe-area spacing, reduced-motion support and no offline checkout/tile prefetch.
- Deliver source, optimized assets/mapping, migrations/seed, setup/staff instructions, audit, production web build, Android project and **actual installable debug APK**. Store publication/release signing are separate.
- Live deployment, real messages/orders and paid service/account creation must be explicitly identified before execution. Never populate hosted production with synthetic fixtures automatically.

## Review Focus

1. Lost order response after commit: identical retry returns one order; changing the locked request fails — Tasks 4/10.
2. Menu price/availability changes with an open cart: require correction/review, never silently charge or lose the cart — Tasks 4/8/10.
3. Destination/account/policy changes during a slow quote: discard stale responses and require a new owner-bound quote — Tasks 3/6/7/9.
4. Two staff act on one order: reject stale versions/invalid transitions without duplicate audit or payment — Tasks 5/11.
5. Android back/keyboard/denied location/offline: preserve fields, close the topmost dialog first and prohibit false successful checkout — Tasks 9/10/12.

## Files and shared contracts

`src/app/` owns routes/providers/shell; `src/domain/` owns plain TypeScript contracts/validation; `src/lib/` owns config/Supabase/API errors. Feature code stays together under `src/features/{catalog,auth,cart,delivery,checkout,orders,staff,contact}/`. Styles live in `src/styles/`, optimized photographs in `public/assets/`, migrations and Edge code in `supabase/`. Distinct tests live under `tests/{unit,postgres,edge,browser}/`; tooling under `tools/`. Native source lives in `android/`; ignored APK/screenshots in `outputs/`. Do not commit SDKs, caches, environment files, auth state or signing keys.

Define these common types in `src/domain/contracts.ts` before consumers; SQL/Edge payloads match this JSON shape:

```ts
type Fulfillment = 'pickup' | 'delivery';
type Coordinates = { lat: number; lng: number };
type CartLine = { productId: string; quantity: number };
type Recipient = { name: string; phone: string };
type OrderRequest = {
  requestId: string; items: CartLine[]; expectedSubtotalCentavos: number;
  recipient: Recipient; notes: string; fulfillment: Fulfillment;
  address: string|null; destination: Coordinates|null; quoteId: string|null;
};
type DeliveryQuote = {
  id: string; destination: Coordinates; distanceMetres: number;
  feeCentavos: number; settingsVersion: number; issuedAt: string; expiresAt: string;
};
type OrderAction = {
  actionId: string; orderId: string; expectedVersion: number;
  action: 'accept'|'prepare'|'ready'|'dispatch'|'complete'|'deliver'|'reject'|'cancel'|'collect_payment';
};
type ApiResult<T> = {ok:true;data:T}|{ok:false;code:string;message:string};
type Page<T> = {items:T[];nextCursor:string|null};
```

Task 1 also defines `Product` (id/categoryId/slug/name/description/imageUrl/priceCentavos/active/version), `Category` (id/slug/name/active/sortOrder/version), `Profile` (id/displayName/phone), `DeliveryPolicy` (origin/label/perKmCentavos/minimumCentavos/maxDistanceMetres/enabled/version), `OrderSummary` (id/reference/status/fulfillment/paymentState/totalCentavos/createdAt/version), `OrderDetail` (summary plus immutable items/recipient/address/destination/quote-distance-fee-policy snapshots/events), `ContactRequest` (requestId/name/email/phone/message), and `ContactMessage` (request plus id/ownerId/createdAt/reviewedAt/version). `MenuMutation` is a category/product discriminated union with entity ID, action UUID, expected version (null on creation) and editable fields; `PolicyMutation` carries expectedVersion/actionId/editable policy fields.

Money is integer centavos; UUIDs strings, timestamps UTC ISO, dates displayed in `Asia/Manila`. Bounds: name 2–100, notes ≤500, delivery address 10–500, message 10–2000, email ≤254, optional contact phone ≤32 characters. Order phone accepts `09…`/`+639…`, normalized to `+63` plus ten digits. Reject nonfinite/out-of-range coordinates (latitude −90..90, longitude −180..180). Product price 1..10,000,000 centavos, rate/minimum 0..100,000 centavos, radius 1..100,000 metres, total ≤3,000,000,000 centavos. Lists default20/max50, keyset pagination.

Public RPCs accept `p_request jsonb` except `get_my_access()`. Responses use `ApiResult`; unexpected infrastructure errors are redacted. Public wrappers are SECURITY INVOKER; narrowly privileged implementations live in unexposed `restaurant_private`, independently verify identity/membership, use fixed search paths and explicit execute grants. Quote reservation/storage APIs are service-only. Revoke default PUBLIC execution and direct writes; check grants as well as RLS.

## Version and execution baseline

Read-only npm metadata checked 11 October 2026: React/React DOM **19.3.0**, Vite **8.3.4**, TypeScript **7.0.2**, React plugin **6.1.2**, Supabase JS **2.117.3**, React Router DOM **7.18.4**, Leaflet **1.9.4**, Vitest **5.0.3**; Capacitor core/CLI/Android **8.5.3**, App **8.1.2**, Geolocation **8.2.3**. Pin exact versions and lockfile; resolve compatible exact type/test/asset tooling versions in Task 1. Use available Node **24.16.0**; verify engines/peers rather than upgrade majors mid-task.

Capacitor 8 documents Node22+, minSDK24, compile/targetSDK36, and Android Studio Otter2025.2.1+ for IDE use. Recheck the **8.5 guide and generated template** for JDK/Gradle/AGP specifics before native setup. Provision official command-line Android SDK/compatible JDK into ignored local tooling, verify checksums, discover package names via `sdkmanager --list`, follow license acceptance. An IDE window is unnecessary for the command-line build.

All commands run from this nested project in PowerShell (`npm.cmd`, `npx.cmd`). Use installed `playwright-cli` skill and `playwright-cli.cmd` for browser automation. Keep the existing `codex/restaurant-conversion` repository separate; do not stage parent/MediSched files. Read the chosen execution skill after approval. Every task inherits Global Constraints.

### Task 1: Executable React shell and domain contracts

**Files:** Create `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.env.example`, `src/main.tsx`, `src/app/App.tsx`, `src/domain/{contracts,money,validation,workflow}.ts`, `src/lib/config.ts`; test `tests/unit/domain.test.ts`.

**Interfaces:** Produces shared types; `deliveryFeeCentavos(distanceMetres:number,perKmCentavos:number,minimumCentavos:number):number`, `normalizePhone(input:string):string`, `canTransition(fulfillment:Fulfillment,status:string,action:OrderAction['action']):boolean`, `readPublicConfig(env:Record<string,string|undefined>):ApiResult<{url:string;publishableKey:string}>`.

- [ ] Add pinned packages/strict TS and scripts `dev`, `build`, `typecheck`, `test:unit`, `test:db`, `test:edge`, `test:browser`, `check:assets`, `check:bundle`, `android:sync`; install with `npm.cmd install`. Save public config placeholders only; ignore toolchains/builds/credentials.
- [ ] Write failing assertions: fees `(100,1500,5000)=5000`, `(3000,...)=5000`, `(4000,...)=6000`, `(12000,...)=18000`; reject NaN/negative distance; phone `09171234567`→`+639171234567`; pickup cannot dispatch, delivery cannot complete; collecting payment does not advance status. Run `npm.cmd run test:unit -- tests/unit/domain.test.ts`, expect import/assertion failure.
- [ ] Implement named contracts/validators/workflow/config gate and root route. Absent config shows actionable setup feedback rather than a crash or successful fake backend.
- [ ] Run targeted units, `npm.cmd run typecheck`, `npm.cmd run build`; require green. Commit task files only: `feat: establish React shell and ordering contracts`.

### Task 2: Reconciled catalogue and optimized assets

**Files:** Create `tools/import-source.py`, `tools/check-assets.mjs`, `docs/source-mapping.md`, `src/features/catalog/seed-manifest.json`, `public/assets/manifest.json`, `public/assets/*`, `supabase/seed.sql`; test `tests/unit/catalog-seed.test.ts`.

**Interfaces:** Produces deterministic UUID/slugs/category/source-price/image mappings for unique source dishes; asset records `{source,output,width,height,bytes}`. Seed URLs are root-relative, never developer paths.

- [ ] Extract approved ZIPs into ignored local inputs with zip-slip checks; catalogue source menu/cart entries, prices/story text. Document duplicate ID28/repeated dishes and reconciliation before seed generation.
- [ ] Write failing assertions: unique IDs/slugs, positive integer original-price centavos, one resolved entry per retained dish, every seed image resolves to asset manifest. Run targeted unit suite; expect failure before outputs exist.
- [ ] Implement importer with Pillow or exact-pinned compatible tooling: ~480px thumbnails/~960px detail/≤1920px hero, aspect-preserving WebP/fallback. Target ≤600KB hero/≤250KB dish; retain original ZIPs unchanged and exclude large originals from builds. Preserve UTF-8 names/source prices.
- [ ] Run seed test/`npm.cmd run check:assets`; visually inspect hero/representative dishes, document justified budget exceptions. Commit `feat: import source menu and optimized restaurant assets`.

### Task 3: Database foundation and secure quote storage

**Files:** Create `supabase/config.toml`, CLI-generated `restaurant_foundation` migration, `tools/test-db.mjs`, `tests/postgres/{bootstrap,access,quotes}.sql`, `docs/database-contracts.md`.

**Interfaces:** Consumes seed/contracts; produces spec tables/private membership/quotes/throttle records, public active catalogue/policy, owner profile update, `get_my_access():ApiResult<{verified:boolean;staff:boolean}>`, service-only `reserve_quote_request(p_request jsonb)` and `store_delivery_quote(p_request jsonb)`. Reservation binds user/destination/settingsVersion; store validates it and computes trusted fee from provider metres.

- [ ] Discover Supabase CLI version/help; use `supabase migration new restaurant_foundation`, record actual generated path in database docs. Prepare disposable **`cestdelicieux_test`** with synthetic Auth roles/users/claims and ordered migrations runner; never reuse hosted/MediSched data. If full local Supabase unavailable, label real Postgres tests as Auth-fixture tests.
- [ ] Write failing SQL cases: anonymous active catalogue only, customer A cannot read B’s profile/quote, metadata staff forgery denied, quote writes service-only, five-minute expiry, version invalidation and concurrent throttling. Quote limit5/customer/60seconds; contact limit3/customer/10minutes. Run `npm.cmd run test:db -- access quotes`, expect missing schema/API failure.
- [ ] Implement FK/check/index/RLS/grants, Auth-profile trigger with validated display name, private membership and bounded default policy. Seed twice without duplicates. Atomic throttle precedes provider calls; quote API cannot accept client fee/expiry or stale policy.
- [ ] Run access/quote tests and available security advisors; document applicable findings/mitigations. Commit `feat: establish secured restaurant database and quotes`.

### Task 4: Atomic orders and customer history APIs

**Files:** CLI-generated `transactional_orders` migration; create `tests/postgres/orders.sql`, `tests/postgres/order-concurrency.mjs`; modify database docs/runner.

**Interfaces:** `place_order(OrderRequest):ApiResult<OrderDetail>`, `list_my_orders({cursor,limit}):ApiResult<Page<OrderSummary>>`, `get_my_order({orderId}):ApiResult<OrderDetail>`, `find_my_order_request({requestId}):ApiResult<OrderDetail|null>`, `resolve_unknown_request({requestId}):ApiResult<{order:OrderDetail|null;abandoned:boolean}>`, `customer_cancel_order({orderId,expectedVersion,actionId}):ApiResult<OrderDetail>`; all through `p_request jsonb`.

- [ ] Write failing assertions: anonymous/unverified denied; pickup fee0;31products/qty100/inactive denied; stale expected subtotal yields `PRICE_CHANGED`; foreign/expired/consumed/policy-stale quote denied. Concurrent same request returns one order; changed payload `REQUEST_CONFLICT`; distinct IDs cannot consume one quote twice. Run order/concurrency tests, expect absent RPC failure.
- [ ] Implement transaction with canonical normalized payload hash, owner/request uniqueness locks and **identical existing request lookup before expiry checks**. Validate current active prices/verified identity; snapshot all order fields/items, compute trusted totals, consume quote under consistent row locks. Private `order_requests` records bind UUID to owner/hash/order or abandoned state. Recovery shares the same lock: return existing order or atomically tombstone an unused UUID, so a delayed old submission cannot commit after recovery authorizes a new request. Owner reads/lookup are private and paginated; cancel pending only with audit/action UUID. Check server clock and settings again within transaction.
- [ ] Run all order/access/concurrency cases, including rollback preserving quote/no partial order, price edits not rewriting history, UUID lookup inaccessible cross-owner and recovery racing a delayed submission (existing order returned or old UUID permanently rejected, never two orders). Commit `feat: add transactional orders and customer history`.

### Task 5: Audited staff operations and contact persistence

**Files:** CLI-generated `staff_contact_apis` migration; create `tests/postgres/{staff,contact}.sql`, `docs/staff-access.sql`; modify database docs.

**Interfaces:** `staff_apply_order_action(OrderAction):ApiResult<OrderDetail>`, `staff_save_menu(MenuMutation):ApiResult<Product|Category>`, `staff_save_policy(PolicyMutation):ApiResult<DeliveryPolicy>`, `submit_contact(ContactRequest):ApiResult<{id:string}>`, `staff_review_contact({id,expectedVersion,actionId}):ApiResult<ContactMessage>`; `staff_list_orders({status,fulfillment,search,cursor,limit})`, `staff_get_order({orderId})`, `staff_list_messages({cursor,limit})` return the corresponding order/page types.

- [ ] Write failing tests for every pickup/delivery transition, terminal denial, concurrent staff versions, identical action replay/changed-action conflict and separate payment collection. Nonstaff/metadata forgery denied; contact content bounds/throttle/owner privacy checked. Run staff/contact SQL tests; expect missing API failure.
- [ ] Implement private membership checks, versioned atomic mutations/events, bounded lists/search, menu/category CRUD with deactivation, settings-version changes invalidating quotes and read-only inbox/review action. Menu/settings replay use stored action IDs/results. Staff assignment script targets one confirmed account and retains placeholder guard. Contact success means saved, not email sent.
- [ ] Run all DB tests/concurrency; verify no raw browser grants to edit prices/collect payment/staff membership. Commit `feat: add audited staff operations and contact inbox`.

### Task 6: Real road-routing Edge boundary

**Files:** Create `supabase/functions/delivery-quote/{index,handler,provider}.ts`, `tests/edge/delivery-quote.test.ts`, `src/features/delivery/api.ts`, `src/lib/{supabase,api}.ts`, `docs/delivery-setup.md`.

**Interfaces:** `handleQuote(request:Request,deps:QuoteDependencies):Promise<Response>`; dependencies verify confirmed user/reserve request/load policy/call route/store quote. `requestDeliveryQuote(destination:Coordinates,signal?:AbortSignal):Promise<ApiResult<DeliveryQuote>>`; POST `{destination}`, no client fee/owner/origin.

- [ ] Write failing tests: no/invalid auth, invalid coordinates, throttle429, missing key, timeout/provider error/no route/nonfinite distance, >25,000m, policy changed before storage;4,000m→6,000centavos. Assert no token/address/provider key in logs. Run `npm.cmd run test:edge`, expect handler failure.
- [ ] Implement current documented JWT verification with publishable keys, confirmed user, explicit web/Capacitor CORS origins and OPTIONS; fixed ORS `/v2/directions/driving-car` URL/10second timeout. Reserve throttle first, validate provider metres, store quote via service-only SQL; redacted retry/pickup errors. ORS key/service credentials remain Edge secrets.
- [ ] Run Edge and real local service-role quote-storage integration tests. Document provider account/key/quota setup and real-service check; missing provider config means delivery unavailable. Commit `feat: add server validated road delivery quotes`.

### Task 7: Reference shell and account lifecycle

**Files:** Create `src/styles/{tokens,global,components}.css`, `src/app/{routes,AppShell,Navigation,providers}.tsx`, `src/components/{Button,Dialog,StatusNotice,Icon}.tsx`, `src/features/auth/{api,AuthProvider,AuthPage,VerifyPage,ProfilePage}.tsx`, `tests/unit/auth-lifecycle.test.ts`; modify `src/app/App.tsx`.

**Interfaces:** `useAuth()` exposes session/profile/verified/staff/loading/error/auth actions; identity changes increment `authEpoch` and discard mismatched private responses. Routes `/`, `/menu`, `/cart`, `/checkout`, `/auth`, `/verify`, `/profile`, `/orders`, `/orders/:id`, `/stories/:slug`, `/staff/{orders,menu,settings,messages}`.

- [ ] Write failing lifecycle cases: anonymous cart survives login; account A→B discards A’s delayed response/pending checkout; resend cooldown/network error and signout private-data clearing. Run targeted unit suite, expect failure.
- [ ] Implement reference tokens (#191d19/#242623 charcoal,#fbf2e3 cream,#862d43/#6e2136 burgundy), serif headings/photo layout, responsive navigation, focus-trapped dialogs/return focus/keyboard, visible focus and readable contrast. Avoid heavy UI framework.
- [ ] Implement real registration/signin/verification/resend/profile/signout/loading/errors with verified checkout and database-backed staff guard. OTP length/template follows dedicated-project settings; do not assume MediSched’s configuration. SDK sessions persist; password/OTP transient; identity epochs isolate private state.
- [ ] Run lifecycle/typecheck/build and Playwright CLI public/auth desktop/390px/error/cooldown/focus tests using declared fixtures rather than real email sends. Commit `feat: implement restaurant shell and account lifecycle`.

### Task 8: Public site, menu, stories and resilient cart

**Files:** Create `src/features/catalog/{api,LandingPage,MenuPage,StoryPage}.tsx`, `src/features/cart/{state,CartProvider,CartPage}.tsx`, `src/features/contact/{api,ContactForm}.tsx`, `src/domain/cart.ts`, `tests/unit/cart.test.ts`; modify routes.

**Interfaces:** `listCatalog():Promise<ApiResult<{products:Product[];categories:Category[]}>>`, `reconcileCart(lines:CartLine[],products:Product[]):{lines:CartLine[];issues:string[];subtotalCentavos:number}`; `useCart()` supplies add/setQuantity/remove/clear/reconcile. Versioned storage contains IDs/quantities only.

- [ ] Write failing cart cases: max30/qty1–99, duplicate IDs merge safely, corrupt storage resets safely, inactive/missing items require correction, changed prices require review. Run targeted test; expect failure.
- [ ] Implement active DB catalogue/category/search/quantity/loading/empty/retry, current-price cart and explicit corrections. Build reference02 landing/story/contact/footer from source, repair empty links and alert-only contact; saved contact requires signin. Preserve cart through reload/auth without private fields.
- [ ] Run cart tests and Playwright CLI at1440×900,768×1024,390×844,360×800; inspect photo/text/navigation/cart and width. Contact uses declared API fixtures/local synthetic data. Commit `feat: rebuild restaurant browsing and cart`.

### Task 9: Confirmed destination and quote lifecycle

**Files:** Create `src/features/delivery/{DestinationPicker,DeliveryQuotePanel}.tsx`, `src/features/delivery/state.ts`, `src/platform/location.ts`, `tests/unit/delivery-state.test.ts`.

**Interfaces:** `getCurrentCoordinates():Promise<ApiResult<Coordinates>>` selects native/browser location adapter; picker accepts destination/onConfirm; quote state consumes Task6 API and exposes idle/loading/valid/expired/error with server expiry/destination.

- [ ] Write failing assertions: drag makes zero route calls, confirm makes one; changed pin/fulfillment/identity clears quote; stale response discarded; denied location leaves manual pin; expiry/policy conflict requires requote. Run targeted suite, expect failure.
- [ ] Implement Leaflet marker/coordinate confirmation/attribution/manual coordinate alternative, explicit “Use my location,” visible demo origin/radius and required written address. Request only on confirmation; use epochs/abort and server TTL with monotonic elapsed time to avoid phone-clock skew; show distance/fee/countdown/Retry/Pickup. Handle a slower-than-TTL response as expired.
- [ ] Run units/Edge/typecheck and Playwright CLI denial/no-route/expiry/pin-change tests with declared provider fixtures. Commit `feat: add confirmed delivery destinations and quotes`.

### Task 10: Durable checkout and customer orders

**Files:** Create `src/features/checkout/{state,CheckoutPage,OrderReview}.tsx`, `src/features/orders/{api,OrderHistoryPage,OrderDetailPage}.tsx`, `tests/unit/checkout.test.ts`; modify providers/routes.

**Interfaces:** `placeOrder(request:OrderRequest):Promise<ApiResult<OrderDetail>>`; checkout state contains editable draft or locked canonical UUID/payload/outcome; `retryLockedOrder()` resends identical request. `findMyOrderRequest(requestId:string):Promise<ApiResult<OrderDetail|null>>` checks saved outcomes; `resolveUnknownRequest(requestId:string):Promise<ApiResult<{order:OrderDetail|null;abandoned:boolean}>>` safely resolves a lost in-memory payload after reload.

- [ ] Write failing assertions: pickup fee0/no address; delivery needs confirmed valid quote; doubleclick one request; lost success response preserves cart/UUID/payload; retry same order; definite `PRICE_CHANGED` requires refreshed review; offline never successful. Run targeted suite, expect failure.
- [ ] Implement validated recipient/notes/fulfillment/summary/confirm/pay-on-receipt and immutable pending request. Do not edit/new-submit while outcome unknown. Persist only non-PII owner/request UUID marker; same-tab retry retains payload in memory. After reload check owner lookup; if absent, an explicit recovery action calls `resolveUnknownRequest`, which either returns the committed order or tombstones the old UUID before permitting a fresh reviewed request. Failed recovery stays locked. Identity switch clears active private pending state and never submits A’s draft as B.
- [ ] Implement private paginated history/detail/timeline/payment/fee snapshots/Asia-Manila display, pending customer cancel and version/action UUID handling. Confirmed durable save clears cart once; network failures preserve fields.
- [ ] Run checkout units/order DB concurrency and Playwright CLI desktop/phone checkout/history/response-loss tests. Commit `feat: complete durable checkout and customer orders`.

### Task 11: Functional staff workspace

**Files:** Create `src/features/staff/{api,StaffShell,StaffOrdersPage,StaffOrderDetail,StaffMenuPage,StaffSettingsPage,StaffMessagesPage}.tsx`, `tests/unit/staff-actions.test.ts`; modify routes/styles.

**Interfaces:** Typed Task5 RPC wrappers; `deriveAvailableActions(order:OrderDetail):OrderAction['action'][]`; mutations preserve action UUID/version until definite outcome, list filters use Task5 contract.

- [ ] Write failing assertions: valid actions per status/fulfillment only, stale version forces reload without optimistic success, duplicate payment not counted twice, customer guard cannot render staff data. Run targeted test, expect failure.
- [ ] Implement filters/lists/details/events/receipt collection separately, permitted status actions/conflict reload, validated menu/category create/edit/deactivate, rate/origin/radius policy editor and contact inbox. Phone cards or bounded table scroller preserve controls without page overflow. No UI-only authorization.
- [ ] Run units/DB concurrency and Playwright CLI synthetic staff flows at desktop/phone; verify policy/price edits invalidate customer quotes/totals. Commit `feat: deliver restaurant staff workspace`.

### Task 12: Android integration and installable APK

**Files:** Create `capacitor.config.ts`, generated `android/`, `src/platform/{back,network}.ts`, `tools/{check-bundle,build-android}.mjs`, `tests/unit/native-navigation.test.ts`, `docs/android-setup.md`; modify shell/location/styles.

**Interfaces:** AppID `com.jomaricandido.cestdelicieux`, name `C’est Délicieux`, `webDir:'dist'`, **no production server.url**. `handleBack({modalOpen,canGoBack},actions)` closes modal then navigates then exits only at root. Bundle check rejects secrets/local developer paths and missing backend config.

- [ ] Write failing assertions: modal closes before back route; root exits only explicitly; reconnect never duplicates order; keyboard keeps confirmation reachable. Run targeted native unit test, expect failure.
- [ ] Implement native listeners/cleanup/permission-on-request, installed Capacitor edge-to-edge safe-area behavior, bundled icons/splash, public backend config and network feedback without offline queue.
- [ ] Provision official verified JDK/Android SDK into ignored tooling, record versions/checksums/licenses, install compatible listed platform/build-tools, generate native project with local CLI and sync after build. Keep generated compatible Gradle wrapper; exclude local paths/debug keystore.
- [ ] Run `npm.cmd run build`, `npm.cmd run android:sync`, `npm.cmd run check:bundle`, `android/gradlew.bat --no-daemon assembleDebug`; verify APK manifest/signature and copy to `outputs/CestDelicieux-debug.apk` with SHA256. Blocked tool downloads mean a missing deliverable, not completed Android conversion.
- [ ] Smoke install/launch/back/location/keyboard/session/network on available emulator/device; mark unavailable device checks unverified while retaining actual build evidence. Commit source only: `feat: package Cest Delicieux for Android`.

### Task 13: Full audit, regression checks and remediation

**Files:** Create `tests/browser/{fixtures,audit-checklist}.md`, `tools/browser-fixture-server.mjs`, `AUDIT.md`; screenshots `outputs/audit/`; fix reproduced defects only in relevant feature files.

**Interfaces:** `test:browser` supplies reproducible **Playwright CLI** commands/documented unused app/fixture ports. Fixtures live in explicit test harness; never add production auth-bypass/demo-backend switch.

- [ ] Read Playwright CLI skill, confirm CLI/help, start existing `dev` script. Audit all public/auth/customer/staff screens, transitions, loading/errors/empty states, focus, responsive widths/reduced motion; capture screenshots of visual issues.
- [ ] Exercise routing failures/denial/expiry/account switch/stale menu/lost response/concurrent staff and permissions; inspect console/network/image failures. Redact logs/screenshots; separate mocked browser, real SQL, hosted and device evidence.
- [ ] Fix reproduced issues then run relevant regressions and `typecheck`, `test:unit`, `test:db`, `test:edge`, `build`, `check:assets`, `check:bundle`; require all green. Resync/rebuild APK after changes affecting bundle/native code.
- [ ] Write AUDIT severity/repro/expected/actual/screenshots/remedy/retest and untested reasons. Obtain chosen workflow’s fresh final review and resolve material findings before completion claims. Commit `test: verify restaurant conversion and document audit`.

### Task 14: Dedicated hosted setup and final delivery

**Files:** Create `README.md`, `docs/{supabase-setup,hosted-verification,release-checklist}.md`, `netlify.toml`; update `.env.example`, audit, native docs, spec/plan status.

**Interfaces:** Public `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`; ORS/service secrets server-only. Web hosting uses SPA route fallback; Android bundles assets with approved backend.

- [ ] Document clean install/build, actual generated migration order/seed, dedicated project/email-verification/public-key/Edge-secret/CORS setup, staff grant, demo policy/routing quotas, and reviewed rollback/export instructions. Missing configuration remains actionable setup feedback.
- [ ] Identify a **new dedicated restaurant Supabase project** and any quota/cost before hosted writes; obtain missing project/provider/account information or creation approval when necessary. Continue independent local work while setup is pending. Never point at MediSched/ZolTrack/ZolNutrition.
- [ ] On authorized dedicated staging, review/apply migrations/seed, check permissions/advisors, validate real ORS quote and owner/staff persistence. Synthetic accounts/messages/orders need explicit staging permission. Report unavailable integration checks; do not auto-deploy live or publish store.
- [ ] Run clean-install/web/APK verification, secret scan and final review after hosted/config changes. Package source ZIP without caches/env/toolchains plus separate APK/checksum; link deliverables and design differences/verification limitations. Commit `docs: deliver web Android and Supabase setup`.

## Self-review and execution handoff

### Implementation status — 12 October 2026

Local implementation, final review remediation, clean install/build, 59 unit/Edge tests, seven real PostgreSQL suites with concurrency checks, installed Playwright CLI desktop/mobile audits, and signed debug APK generation are verified. Source, web, APK and screenshot artifacts are delivered separately. The unchecked original steps remain the original plan; the authoritative execution evidence and pending boundaries are in `docs/delivery-verification.md`, `docs/final-review.md` and `AUDIT.md`.

Dedicated hosted SQL was applied by the owner and public catalogue reads are verified. Hosted Auth/staff/advisors/order persistence and live ORS/function deployment remain pending because the connected management account lacks access. Physical Android installation and device behavior remain unverified because no device/emulator is attached. No hosting publication or app-store release was performed.

Coverage: source/assets2/8; design/auth7; persistent cart/checkout/history4/8/10; staff/contact5/11; secure quotes/maps/failures3/6/9; Android/APK12; responsive audit13; hosted setup/delivery14. Each Review Focus condition has an owning test. Keep JSON/RPC names consistent and regenerate/check Supabase types after schema edits.

Recommended: **native implementation in this chat with a fresh final reviewer**. Tasks share domain/RPC contracts and source context, so keeping implementation context together reduces coordination overhead. Subagent-driven execution with task-by-task independent reviews is available if preferred.

Owner reviews this plan and selects execution method before implementation. This plan-writing step does not implement product code or change hosted resources.

References: [Capacitor8 prerequisites](https://capacitorjs.com/docs/updating/8-0), [Capacitor8.5 guide](https://capacitorjs.com/docs/updating/8-5), [Supabase SQL security](https://supabase.com/docs/guides/database/functions), [ORS directions response](https://giscience.github.io/openrouteservice/v9.10.0/api-reference/endpoints/directions/requests-and-return-types), [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/). Recheck relevant Supabase changelog/auth docs before implementation.
