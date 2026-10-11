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

Dependency audit reported moderate development-only Capacitor CLI transitive xcode/uuid advisories. These are not bundled in the client; forced incompatible upgrades were avoided. Recheck when a compatible patched toolchain is available. The demo pickup pin is deliberately illustrative, not a real restaurant address; configure a real service origin only when appropriate.

Final verification and review results are appended below when the completion checks finish.
