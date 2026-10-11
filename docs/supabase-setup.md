# Dedicated Supabase setup

Restaurant project: `https://xjcmygnnbkdnetkdsfyq.supabase.co`. Do not apply restaurant SQL to MediSched, MediSched-Staging, ZolNutrition or another app.

## Schema

The owner reported running `outputs/CestDelicieux-Supabase-Setup.sql`; the public products API returned 25 active products. The generated migration order is:

1. `20261011151015_restaurant_foundation.sql`
2. `20261011151444_transactional_orders.sql`
3. `20261011152046_staff_contact_apis.sql`
4. `supabase/seed.sql`

The combined setup is for a **new empty** restaurant database and is not an idempotent schema updater. Do not rerun it over existing tables. Seed alone is idempotent and does not replace staff price edits. UUID/sha256 helpers are built into the tested PostgreSQL versions; these migrations do not require a `pgcrypto` extension install.

All public tables have RLS and explicit grants. Orders, prices, fees, quote consumption, payment and audit events are validated in transactional APIs. Private staff membership and quote tables are not browser-writable. Review the security/performance advisors in the dedicated Supabase dashboard before a production release.

## Authentication

Keep email provider enabled and email confirmation required. Set Site URL to the deployed web HTTPS URL when it exists. Add exact authorized redirects such as `http://127.0.0.1:5180/verify` and the deployed `/verify` URL. Do not copy MediSched’s authentication configuration blindly.

The default confirmation link can verify the account; to use the code-entry screen, edit the **Confirm signup** email template to include `{{ .Token }}` and keep its normal confirmation link as an alternative. The client accepts 6–10 numeric digits; the dedicated Auth server determines which code is valid. Configure SMTP in the dashboard for reliable production delivery. Never put SMTP credentials in the client.

For Android, use code entry inside the app. Do not depend on a browser link redirecting into `https://localhost`; custom deep-link verification is outside this build. Register and verify an account before checkout. Staff is a separate approved membership grant: replace **only** the declaration placeholder in `docs/staff-access.sql`, leave its placeholder guard unchanged, and run it in the restaurant SQL Editor for a confirmed user. Never ship that SQL as an app endpoint.

## Routing function

Authenticate the Supabase CLI against the account that owns this project. A different cached CLI account is not permission to write into its projects.

```powershell
npx.cmd supabase login
npx.cmd supabase functions deploy delivery-quote --project-ref xjcmygnnbkdnetkdsfyq --use-api
```

Keep JWT verification enabled. In **Edge Functions → Secrets**, set `ORS_API_KEY` and `RESTAURANT_ALLOWED_ORIGINS`. Include exact deployed web origin(s), `http://127.0.0.1:5180`, `http://localhost:5180`, and native `https://localhost`. No trailing slash is needed in origins. The function uses Supabase-provided service credentials; do not send them through chat or the browser.

The full function source is under `supabase/functions/delivery-quote`. Without a provider key/function deployment, delivery shows retry/pickup feedback. Pickup remains available. Review provider quotas and costs before using a paid plan.

Run the commands from the `CestDelicieux` folder. Login with the account that owns that exact project; the current connected account cannot manage it. `--use-api` bundles on the server so Docker is not required. The deployment command does not rerun SQL or modify MediSched. If a key was pasted into chat, regenerate it first. Save only its value under the exact secret name `ORS_API_KEY`, not a sample request URL.

## Recovery and rollback

Export/backup orders before any database rollback. Do not drop the schema or run the disposable test bootstrap against hosted data. Roll back the web/native application to a compatible build first; database changes require a reviewed forward corrective migration. Restoring a database backup can remove later orders and must be planned separately.
