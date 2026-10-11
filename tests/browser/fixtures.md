# Browser fixture boundary

The installed `playwright-cli.cmd` session `cest-audit` drives the real React app at 127.0.0.1:5180. Browser routes intercept Supabase requests and forward them to the **explicit test-only** loopback HTTP adapter on 127.0.0.1:55435. Its synthetic Auth identities are A, B, staff and unverified under `example.test`; they are not hosted users.

The adapter executes the actual migration RPCs through real PostgreSQL on 127.0.0.1:55434 and applies role/JWT-sub settings from the fixed synthetic identities. Only test code creates the synthetic sessions. No production auth-bypass switch, mock backend import or test-only route exists in the app.

Provider tests use controlled road distances/failures/expiry and delays. A fixture distance is never used in the shipped delivery function. The lost-response control commits a real local order then returns a synthetic503 so identical retry/reload can be verified.

Do not run the fixture server on 0.0.0.0, deploy it or apply `tests/postgres/bootstrap.sql` to Supabase. `test:db` and browser fixture resets share the disposable cluster; run them sequentially.

Start `npm.cmd run dev`, then `node tools/browser-fixture-server.mjs`, then:

```powershell
& 'C:/Users/Mojxd/AppData/Roaming/npm/playwright-cli.cmd' -s=cest-audit open http://127.0.0.1:5180
npm.cmd run test:browser
```

Set `PLAYWRIGHT_CLI` for another installed CLI path. Screenshots use `outputs/audit`; sample names/data are synthetic. Exit and reopen the CLI session before a live public audit to remove fixture routes/storage.
