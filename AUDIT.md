# C’est Délicieux implementation audit

Date: 12 October 2026. Scope: approved React/Supabase/Capacitor conversion with Atmospheric Supper Club styling. This report distinguishes local integration evidence from hosted and physical-device checks.

## Environment and method

React/TypeScript/Vite, Supabase JS, Leaflet and Capacitor Android. Existing development command: `npm run dev` at `http://127.0.0.1:5180`. Installed Playwright CLI was used through its managed `cest-audit` browser and `run-code` scripts, not replaced with another browser tool.

Viewports: desktop 1440×900, tablet 768×1024, phones 390×844 and 360×800. Browser workflow requests were routed to a disclosed local fixture service backed by real PostgreSQL migrations/RPCs and synthetic Auth sessions. Fixtures never created hosted accounts or orders. See `tests/browser/fixtures.md`.

The owner reported running the setup SQL in the dedicated restaurant project. A read-only public REST check confirmed 25 active menu products. The agent did not run that hosted SQL, and this public check does not establish complete hosted security or Auth correctness.

## Findings and disposition

| ID | Severity | Reproduction / actual behavior before fix | Expected behavior / fix | Evidence |
|---|---|---|---|---|
| A01 | Important — fixed | Receive a delivery quote that expires before the UI accepts it; the estimate request could remain busy. | Reject the stale quote, stop loading and allow a fresh estimate. Acceptance failure now clears busy state and explains expiry. | `tests/browser/workflow-audit.js`, delivery expiry case; `src/features/delivery/DeliveryQuotePanel.tsx`. |
| A02 | Important — fixed | Supply a legacy JWT with a privileged role as the frontend key. Validation formerly accepted legacy keys without checking role. | Reject non-anon legacy keys before initializing the public client. | `tests/unit/public-config.test.ts`, observed failing test then passing. No real secret was used. |
| A03 | Important — fixed | Finish an action that removes its dialog trigger from the DOM. Focus could return to a detached element. | Restore focus to the trigger when present, otherwise to the workspace heading. | `src/components/Dialog.tsx`; CLI workflow tests keyboard trapping/Escape; `staff-order-completed-390.png`. |
| A04 | Important — build resolved | Build Android on this Windows host; Gradle failed moving a completed transform cache with AccessDeniedException. | Produce a signed, verifiable APK. Completed cache recovery plus bounded workers allowed the build; provisioning/build instructions record the environment limitation. | `docs/android-setup.md`, APK signature verification and checksum artifact. |
| A05 | Minor — improved | Eagerly bundle checkout maps and every staff view with the landing page. Initial JS exceeded Vite's 500 KB warning threshold. | Load checkout and staff views on demand through React lazy/Suspense. | Production build chunk sizes; no new dependency. |

## Functional evidence

- Public navigation, search/category filters, persistent cart and unavailable-item handling; no horizontal page overflow at audited viewport widths.
- Registration password mismatch, invalid/successful synthetic email codes, resend cooldown and authenticated customer/staff navigation.
- Pickup checkout with current server prices; a deliberately lost success response retains the original request and retries without duplicate orders. Reload recovers the committed order. Price conflicts require review rather than silently changing the total.
- Customer pending-order cancellation and private history separation between two synthetic users.
- Staff accept/prepare/ready/complete transitions, separately recorded payment, menu price updates, delivery settings and contact inbox persistence.
- Delivery manual pin after denied geolocation, server-issued 3.5 km fixture quote, changed-pin invalidation, no-route errors, expired quotes and slow responses discarded after switching to pickup.
- Database access restrictions, quote throttling, payload/owner-bound idempotency, order recovery tombstones, concurrent versions and payment-event replay are tested against local PostgreSQL.
- Dialog keyboard focus/Escape, reduced-motion behavior, responsive checkout and phone staff screens.

Expected injected HTTP failures are part of the resilience tests, including a lost order response and unavailable route. The successful workflow audit reported no uncaught page errors. Provider tiles/network behavior depends on connectivity; the address and coordinate fallback remain usable if map tiles fail.

## Screenshot references

All screenshots are in `outputs/audit/`. Key references: `auth-desktop.png`, `auth-mobile.png`, `register-mobile.png`, `landing-1440.png`, `landing-768.png`, `landing-loaded-360.png`, `menu-390.png`, `cart-390.png`, `checkout-1440.png`, `checkout-390.png`, `lost-response-390.png`, `order-detail-390.png`, `staff-orders-1440.png`, `staff-orders-390.png`, `staff-order-completed-390.png`, `staff-menu-390.png`, `staff-delivery-390.png`, `staff-inbox-390.png`, `delivery-quote-390.png`, `delivery-no-route-390.png`. Some early full-page landing captures preceded lazy image decoding; the loaded capture shows the complete artwork.

## Not yet verified / recommended next steps

| Area | Why it remains unverified | Next step |
|---|---|---|
| Hosted registration, mailbox delivery, staff assignment, real orders | Dedicated project is outside the connected account's permissions; no authorization to create hosted test accounts/orders. | Owner tests an approved account and assigns staff using `docs/staff-access.sql`; follow `docs/hosted-verification.md`. |
| Live road routing and delivery checkout | Routing provider key and deployed Edge Function are not yet confirmed. Browser quote cases use a declared provider fixture. | Configure the routing key only as a server secret, deploy the function in the dedicated project and verify real distance/error behavior. |
| Hosted RLS/advisors and migration ledger | Public catalogue success cannot inspect privileged hosted metadata. | Reconnect the correct account or run hosted advisors and verify all three migrations. |
| Android installation/GPS/system bars/Back/keyboard/resume | No connected emulator or physical device. Browser checks and a signed APK do not prove device behavior. | Install the debug APK and follow the device checklist. |
| Release publication and production email reliability | No web/store publication requested; default email services may have limits. | Configure deployment origins/email and complete the release checklist before wider use. |

An earlier dependency audit reported moderate development-only Capacitor CLI transitive xcode/uuid advisories. The final clean pinned install reported zero vulnerabilities; the transitive uuid deprecation warning remains. No forced incompatible upgrade was applied. The demo pickup pin is deliberately illustrative, not a real restaurant address; configure a real service origin only when appropriate.

## Final review remediation

The most capable reviewer attempted the fresh review but stopped at an account usage limit without a verdict. An available GPT-6.1 reviewer completed the read-only whole-branch review. No Critical findings; seven Important findings and one optional-phone finding were identified. The phone finding was regraded Important because it prevented a valid contact message without an optional phone number. All eight entered one fix pass.

| ID | Severity / status | Steps and actual behavior before fix | Expected / implemented behavior | Regression evidence |
|---|---|---|---|---|
| R01 | Important — fixed | Edit checkout recipient, profile or a staff dish, then call the real SDK `refreshSession()` for the same synthetic account. Recipient/profile reset and staff dialog unmounted. | Preserve same-owner mounted state and dirty drafts; clear private state on identity changes. Fresh access checks still fail closed, and superseded refresh responses are discarded. | `review-regressions.js`: three observed failing draft cases then passing; lost staff save also survives refresh. |
| R02 | Important — fixed | Commit a contact message but inject a lost response. Fields remain editable and same UUID with changed text causes `REQUEST_CONFLICT`. | Lock a defensive copy and offer **Retry same message**. A definite rejection unlocks correction; unknown outcomes retain the exact UUID/content. | Browser observed unlocked-fields failure then identical two-request replay passing. |
| R03 | Important — fixed | Start a delayed delivery quote and edit the written address. The old response restores the estimate. | Address is part of the quote binding; editing invalidates/aborts the request and clears displayed estimate. | Browser stale-estimate failure then passing. |
| R04 | Important — fixed | Receive actual SQL rejections `INVALID_CONTACT`, `INVALID_FULFILLMENT`, `INVALID_CART`, `INVALID_DESTINATION` or `TOTAL_TOO_LARGE`. They were treated as uncertain, retaining an uncorrectable request. A subtotal at the cap plus delivery fee is a valid trigger for the total rejection. | These known business failures unlock correction; transport failures remain locked. | Five unit cases observed failing then passing. |
| R05 | Important — fixed | Receive unclassified staff failure such as `FIXTURE_LOST_RESPONSE` or `PGRST000`. The old classifier discarded action identity. | Only enumerated business rejections unlock; all unknown outcomes retain the original mutation. | Three failing unit cases then passing; browser real SQL lost-save retry verifies identical payload/action UUID across session refresh. |
| R06 | Important — fixed | Append a synthetic service-role JWT to built JS and run the old bundle guard; it incorrectly passes. No real leaked secret was found. | Decode JWT candidates and reject non-anon roles. Build configuration also rejects privileged frontend credentials before Vite can embed them. | Actual bundle probe observed failure then passing, plus three scanner unit tests. The probe always restores the original JS. |
| R07 | Important — fixed | Use the old `api.openrouteservice.org` host, whose quota is restricted and shutdown is announced. | Use `https://api.heigit.org/openrouteservice/v2/directions/driving-car` with server Authorization. | Provider endpoint assertion failed then passed; [official ORS migration announcement](https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912). Live credentials still require verification. |
| R08 | Important — fixed after regrading | Leave contact mobile number empty; HTML validation and normalization prevent sending an otherwise valid message. | Mobile number is optional, matching approved schema/spec. Normalize only a supplied number. | Browser required-field failure then successful empty-phone SQL contact submission. |

Post-fix unit/Edge suite: **59 tests passed** across 12 files. Typecheck, production build, optimized assets (55 / 2.99 MB), actual bundle probe and public bundle guard passed. The final full PostgreSQL/browser/APK checks are recorded in the delivery verification document. No second code review was dispatched after fixes.

Real public browser checks also verified all 25 hosted menu products, decoded images at desktop/mobile widths, offline feedback, and zero uncaught page errors or failed Supabase requests, with **zero hosted writes**. Screenshots: `live-landing-1440.png`, `live-landing-390.png`, `live-menu-1440.png`, `live-menu-390.png`.

## Live delivery diagnostic follow-up — 12 October 2026

The owner reported a live manual-pin estimate failing with `ROUTING_UNAVAILABLE`, alongside optional device-location failure. Read-only hosted checks confirmed service-role schema/function privileges and two recent quote reservations but no stored quotes. This narrows the live failure to routing/storage; it does not prove an invalid ORS key. Secret-name/digest listing confirmed `ORS_API_KEY` exists without retrieving its value.

The generic server catch concealed the failed stage and provider status (Medium diagnostic issue). Eight regressions first failed, then passed after adding redacted stage/status reporting and distinct routing-credentials/access and quota messages. Provider bodies, keys, addresses, coordinates and tokens are not logged or sent back in errors. Unknown failures retain the original retry/pickup response. All67 unit/Edge tests and the production build passed. Function version2 is ACTIVE with JWT verification still enabled. No hosted SQL, accounts or orders were changed; the owner must retry the authenticated estimate to identify the underlying live failure.
