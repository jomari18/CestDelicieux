# Road delivery setup

Use a dedicated CestDelicieux Supabase project. Obtain an OpenRouteService account/key on the desired plan; check its current daily/minute quotas. Put `ORS_API_KEY` in Edge secrets only, never Vite config, screenshots or the APK. Set `RESTAURANT_ALLOWED_ORIGINS` to comma-separated deployed HTTPS web origin(s), local development origins when needed, and Capacitor's `https://localhost` origin. Preserve `verify_jwt=true`: requests need a signed-in user JWT in Authorization and the publishable key in apikey.

Deploy the `delivery-quote` folder after applying all restaurant migrations. The function gets a fresh user from Supabase Auth and uses only the trusted backend's origin/settings; service-role credentials are server-provided secrets. SDK secrets support named key maps or legacy injected variables. Route responses provide metres; there is no straight-line fallback. 5 requests/user/minute, 10second timeout, 25km initial route limit, 5minute owner-bound quote, whole-peso fee minimum50/per-km15, calculated in Postgres. Missing key/service/route gives an honest Retry/Pickup error.

Before delivery is declared ready, test a real driving-car route, review its distance/fee and place an explicitly authorized staging order. Unit provider fixtures and local Postgres checks do not prove provider credentials, quota or live routes.

The adapter uses the current `https://api.heigit.org/openrouteservice/v2/directions/driving-car` endpoint. [The provider's migration announcement](https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912) deprecates the older hostname. Copy only the API key from the provider dashboard into `ORS_API_KEY`; neither the request URL nor its sample start/end coordinates is a secret value. Regenerate a key if it was shared publicly or pasted into chat.

