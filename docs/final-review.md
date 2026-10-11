# Final review and execution decisions

Read-only review baseline: 879e0ee; reviewed implementation: 2eac9ffc205e2c92e6f560eafa51bc65509077b4. The first GPT-6-astra attempt exhausted account usage before finishing; GPT-6.1 completed the replacement fresh review before the single remediation pass. Reviewer assessed transactional SQL owner/version/idempotency safeguards as sound and requested seven Important corrections. AUDIT.md records every correction, the regraded optional-phone correction and failing/passing evidence.

There were no Critical findings and no deferred Minor findings after regrading. The reviewer's unavailable-integration boundaries stand: local tests do not prove hosted Auth/provider permissions or physical Android behavior; publication, release signing and native email deep links remain outside the approved build.

## Rulings in execution order

1. Use Node/PowerShell bookkeeping instead of upstream Bash helpers, which failed resolving Windows repository paths. Cost: local tooling maintains the same brief/base/test contract rather than using upstream scripts.
2. Complete Task7 network-fixture resend/error/signout/dialog coverage in Task13 once checkout/staff routes exist. Cost: earlier auth implementation remained verification-pending until the later audit; those checks subsequently passed.
3. Preserve generated Gradle 8.14.3 and recover the completed project-local transform cache after Windows AccessDeniedException. Cost: a fresh Windows environment may need the documented recovery. No security settings were disabled.
4. Owner applied dedicated hosted SQL; verify the public catalogue read-only and report privileged Auth/advisors/ORS checks separately because the connected account lacks project access and hosted synthetic writes were not authorized. Cost: live delivery and hosted security may remain unproven until owner setup/testing.
5. Replace the quota-blocked most-capable reviewer with the available GPT-6.1 reviewer before any final fixes. Cost: the completed fresh review uses the available model, not the initially selected model.
6. Regrade optional contact phone from Minor to Important: requiring it prevents valid messages from users who omit optional personal data. Cost: optional phone is now allowed as approved; staff may have only email to reply.
7. Unavailable hosted integration checks remain pending, not inferred successful from local fixtures. Cost: deployment/configuration faults may still surface in owner integration tests.
8. Deliver a signed debug APK with explicit unverified device checks because no emulator/phone is attached. Cost: GPS, keyboard, resume and system-bar differences may still need corrections after device testing.
9. Store publication, release signing and email deep links remain excluded per the approved scope; in-app verification uses an emailed code. Cost: a browser confirmation link will not automatically launch the native app.
10. Keep the local conversion branch and provide artifacts; no merge/push/publication was requested for this restaurant project. Cost: repository hosting and release integration remain owner decisions.
