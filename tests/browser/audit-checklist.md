# Browser and device audit checklist

- Run installed Playwright CLI with session `cest-audit`, the Vite server on 5180 and the local fixture server on 55435. Run `npm run test:browser` sequentially. No hosted writes.
- Check 1440/768/390/360 widths; images decoded; navigation, input labels, readable contrast, touch targets and absence of horizontal page overflow.
- Check auth mismatch, invalid OTP, successful code, resend cooldown, customer/staff restrictions and signout/account switching.
- Check persistent cart, current prices, lost-response retry/reload recovery, cancellation, history, staff progression and payment separately.
- Check map denial/manual pin, stale/expired/no-route quotes and changed fulfillment mode.
- Inspect screenshots in `outputs/audit`, console page errors and intentionally injected failure messages separately.
- On Android: install APK, inspect all screens, keyboard, notch/system bars, Back and exit dialog, background/resume, offline recovery and location denial/grant. These require a device.
- For hosted checks use only an owner-approved test account/order, verify email inbox and staff membership, configure Edge routing secrets/origins, then repeat real delivery cases.
