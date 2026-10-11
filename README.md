# C’est Délicieux

React + TypeScript restaurant ordering app, Supabase PostgreSQL/Auth and a Capacitor Android app. The selected **Atmospheric Supper Club** design uses charcoal, cream, burgundy, serif headings and original restaurant photography.

## Run the web app

Node 24+, Windows PowerShell:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
# Set the dedicated restaurant URL and publishable key in .env.local.
npm.cmd run dev
```

Open http://127.0.0.1:5180. `npm.cmd run build` produces `dist`; `npm.cmd run preview` uses port 5181. Netlify settings and SPA fallback are included. Set the same two **public** Vite variables in hosting before building. No service-role key or routing provider key belongs in Vite, the APK, or Git.

## Features

- 25 original menu products, five categories, search and a persistent anonymous cart (30 distinct dishes, 1–99 each).
- Registration, email verification/code resend, sign in, profile and account-isolated private data.
- Pickup or delivery, PHP and pay on receipt. Demo pickup origin in Metro Manila; no actual restaurant address is claimed.
- Explicit delivery pin confirmation; optional device location with a manual map/coordinate alternative. Road routing is server-side, initially ₱15/km, minimum ₱50, up to 25km. Fees round upward to whole pesos; quotes expire after five minutes.
- Transactional order placement, current prices/availability, immutable order snapshots, identical-request retries, safe interrupted-order recovery, history and pending cancellation.
- Staff order progress, separate receipt collection, audited changes, menu/category editing, delivery settings and contact inbox.
- Responsive navigation, 44px controls, keyboard dialogs, reduced motion and Android safe-area/back/offline handling. Orders are never queued for offline submission.

Pickup: pending → accepted → preparing → ready → completed. Delivery: pending → accepted → preparing → ready → out for delivery → delivered. Staff can reject pending orders or cancel pending/accepted orders. Membership is checked in the database, not editable user metadata.

## Supabase and delivery

Use only the dedicated restaurant project `xjcmygnnbkdnetkdsfyq`. The owner has run the schema/seed setup, and a read-only public API check returned all 25 products. See [Supabase setup](docs/supabase-setup.md), [delivery setup](docs/delivery-setup.md), [staff grant](docs/staff-access.sql), [database contract](docs/database-contracts.md) and [hosted verification](docs/hosted-verification.md).

**Live delivery still requires deploying the `delivery-quote` function and configuring an OpenRouteService key in that project’s Edge secrets.** Local route fixtures prove behavior but do not prove a live provider route. There is no fabricated estimate fallback.

## Checks

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run check:assets
npm.cmd run check:bundle
```

Real database tests require PostgreSQL installed locally. `tools/start-test-db.ps1` starts the separate disposable test cluster on 127.0.0.1:55434. `npm.cmd run test:db` resets only `cestdelicieux_test` and uses synthetic Auth fixtures. **Never run its bootstrap/fixtures in a hosted project.**

Browser regression tests use the installed Playwright CLI, not another browser runner. Start the dev server and `node tools/browser-fixture-server.mjs` in separate terminals, then open a CLI session named `cest-audit` and run `npm.cmd run test:browser`. See [browser fixtures](tests/browser/fixtures.md). The fixture server binds to loopback only and is not imported by the application.

## Android

App ID `com.jomaricandido.cestdelicieux`, API 24+, target API36. The app bundles `dist`; there is no development server URL. See [Android setup](docs/android-setup.md) for the verified JDK/SDK and reproducible debug build. Artifacts are in `outputs/`. A debug APK is for testing; Play Store signing/publication is separate.

## Deliverables and evidence

[Audit](AUDIT.md), [source mapping](docs/source-mapping.md), [release checklist](docs/release-checklist.md). Photography and menu are imported from the supplied source ZIP and optimized as WebP. The journal retains original text and labels the app as a demonstration. The original supplied project was static HTML/JS; no existing database was present to migrate.
