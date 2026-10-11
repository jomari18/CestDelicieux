# Deployment verification — 2026-10-12

- Public repository: https://github.com/jomari18/CestDelicieux
- Production site: https://cestdelicieux.netlify.app/
- Netlify is connected to repository branch `main`; initial published commit `1147e93`.
- Build: `npm run build`, publish directory `dist`, Node 24.
- Hosting has only the restaurant public Supabase URL and publishable key as Vite variables. Local SMTP credentials and environment files are ignored and excluded from Git history.
- Supabase Site URL is the production HTTPS origin. Exact `/verify` callbacks are saved for production and both local web origins.
- Delivery origins include production, both local web origins, and the existing Capacitor origins. Routing credentials were not changed.

Fresh checks: 71 unit/edge tests passed; TypeScript/production build and bundle guard passed. Playwright CLI loaded all 25 real menu products at desktop 1440×900 and mobile 390×844, decoded landing images, checked overflow and offline feedback, and reported no page errors or backend request failures. `/auth` returns HTTP 200 through the SPA fallback; `X-Frame-Options` is DENY. Delivery OPTIONS returns 204 with the exact production origin allowed. GitHub `main` matches the initial deployment commit.

The deployed audit performed zero hosted writes. The owner previously confirmed live registration, routing and a delivery order on the local web app. Authenticated production checkout/staff behavior and physical iOS/Android testing remain owner verification tasks; responsive browser checks do not prove native device behavior.
