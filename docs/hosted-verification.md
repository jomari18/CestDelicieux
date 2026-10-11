# Hosted verification — 12 October 2026

The owner created the separate project and supplied its URL/publishable key. The current Supabase connector and cached CLI account could not manage that project; no privileged hosted writes were performed by the agent. The owner reported running the combined restaurant setup SQL.

Verified read-only: active products API HTTP200, **25 products**. Public Auth settings were inspected for email provider/confirmation behavior. No hosted synthetic accounts, messages or orders were created.

Remaining integration checks:

- Owner account registration, confirmation email/code, resend and durable session in the dedicated project.
- Grant a confirmed staff account using the provided SQL; verify private API access in that project.
- Deploy `delivery-quote`, set its server-only ORS key and exact CORS origins, run a real driving route and review the distance/fee.
- An explicitly approved hosted pickup/delivery order through receipt completion.
- Run project security/performance advisors with an authorized dashboard/connector.
- Actual APK installation/back/keyboard/location/offline behavior on a device. Browser viewport emulation is not a native-device test.

Local real-Postgres tests and browser fixtures validate application behavior but are reported separately in AUDIT.md.
