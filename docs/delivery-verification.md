# Delivery verification — 12 October 2026

The implemented source is on local branch `codex/restaurant-conversion`. It has not been pushed, merged into another repository, published to web hosting or released to an app store.

Verified:

- Clean installation with the pinned lockfile and production TypeScript/Vite build.
- The first clean-install attempt encountered a native-module file lock from the running Vite server. Stopping that server and rerunning `npm ci --offline` succeeded; its reported dependency audit found zero vulnerabilities. Vite now ignores local toolchains, test scratch data, Android output and delivery artifacts so native builds do not trigger reload storms.
- 59 unit/Edge tests across12 files, including all final-review regressions.
- Seven real local PostgreSQL suites plus concurrent quote throttling, checkout/recovery and staff/payment checks.
- Installed Playwright CLI: auth/public/workflow/resilience/final-review scripts. Desktop1440, tablet768, phone390/360; lost checkout and contact responses, same-owner SDK refresh, staff mutation replay, optional phone, stale address quotes and ordinary pickup lifecycle all pass.
- Live public catalogue:25 products at1440/390; decoded imagery, no page overflow, offline notice, no uncaught page errors or failed Supabase requests; zero hosted writes.
- Optimized55 WebP assets, 2.99MB total. Public bundle scan, a synthetic privileged-JWT injection probe, and build configuration checks pass.
- Capacitor Android APK built from the current `dist`, signature verified with apksigner and manifest checked with aapt. API24+, target36, application ID `com.jomaricandido.cestdelicieux`. Its SHA-256 is in the companion checksum file.

The reviewer identified no Critical issue. All seven Important issues plus the regraded optional-phone issue were fixed with observed failing then passing regressions; no second post-fix review was dispatched. See AUDIT.md and final-review.md for details and decisions.

Unverified: dedicated hosted registration/mailbox/staff/advisors/order persistence, live ORS routing/function deployment, and physical Android installation/GPS/keyboard/Back/resume. These are explicit pending integration checks, not claims inferred from local tests. The owner applied hosted SQL and public reads work, but the connected management account lacks this project's permissions.

Download artifacts are produced in `outputs`: source ZIP (no environment files/caches/SDK/signing key), compiled web ZIP, debug APK/checksum and audit screenshots ZIP. Source ZIP includes the reviewed schema/seed setup bundle. A debug APK is for device testing; release signing remains separate.

Design differences: the selected visual direction is applied to functional React screens using original optimized photography and serif typography. Illustrative catalogue/staff content is replaced by application data. Checkout, status/history, map and staff management extend the reference to support the approved ordering flows. The original static site's cart IDs/prices are preserved in the import mapping; duplicate dishes are merged into25 unique products. The pickup location is clearly a Metro Manila demo pin.
