// Explicit test harness only. Never bundled, deployed or used as production Auth.
import http from "node:http";
import { randomUUID } from "node:crypto";
import { pool, setup, ids, actor, rpc } from "./db-test-lib.mjs";
await setup();
let loseNextOrder = false,
  routeMode = "ok",
  routeDelay = 0;
const calls = [];
const fixtureUser = (kind) => ({
  id: ids[kind],
  aud: "authenticated",
  role: "authenticated",
  email: `${kind}@example.test`,
  email_confirmed_at: kind === "unverified" ? null : new Date().toISOString(),
  created_at: new Date().toISOString(),
  app_metadata: { provider: "email" },
  user_metadata: { display_name: `Synthetic ${kind}` },
});
function session(kind) {
  const user = fixtureUser(kind),
    token = [
      { alg: "HS256", typ: "JWT" },
      {
        sub: user.id,
        aud: "authenticated",
        role: "authenticated",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "fixture-only",
    ]
      .map((v) =>
        typeof v === "string"
          ? v
          : Buffer.from(JSON.stringify(v)).toString("base64url"),
      )
      .join(".");
  return {
    access_token: token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: `fixture-${kind}`,
    user,
  };
}
function identity(req) {
  try {
    const jwt = req.headers.authorization?.split(" ")[1],
      sub = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url")).sub;
    return Object.values(ids).includes(sub) ? sub : null;
  } catch {
    return null;
  }
}
const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5180");
  res.setHeader("Access-Control-Allow-Headers", "*");
  const url = new URL(req.url, "http://127.0.0.1:55435"),
    path = url.pathname;
  let payload = {};
  function send(data, status = 200) {
    res.statusCode = status;
    res.end(JSON.stringify(data));
  }
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length) payload = JSON.parse(Buffer.concat(chunks).toString());
    if (req.method === "OPTIONS") {
      send({});
      return;
    }
    if (path === "/__fixture/control") {
      if (payload.reset) {
        await setup();
        calls.length = 0;
        loseNextOrder = false;
        routeMode = "ok";
        routeDelay = 0;
      }
      if (payload.loseNextOrder) loseNextOrder = true;
      if (payload.routeMode) routeMode = payload.routeMode;
      if (payload.routeDelay !== undefined) routeDelay = payload.routeDelay;
      if (payload.priceId)
        await pool.query(
          "update public.products set price_centavos=price_centavos+100,version=version+1 where id=$1",
          [payload.priceId],
        );
      send({ ok: true, calls });
      return;
    }
    if (path.startsWith("/auth/v1/")) {
      const kind = String(payload.email ?? "a@example.test").split("@")[0],
        valid = Object.keys(ids).includes(kind) ? kind : "a";
      if (path.endsWith("/token")) {
        if (payload.password === "wrong-password") {
          send({ msg: "Invalid login credentials" }, 400);
          return;
        }
        send(session(valid));
        return;
      }
      if (path.endsWith("/verify")) {
        if (payload.token !== "123456") {
          send({ msg: "Token has expired or is invalid" }, 400);
          return;
        }
        send(session(valid));
        return;
      }
      if (path.endsWith("/signup")) {
        send({ user: fixtureUser("unverified"), session: null });
        return;
      }
      if (path.endsWith("/resend")) {
        send({});
        return;
      }
      if (path.endsWith("/logout")) {
        send({});
        return;
      }
      if (path.endsWith("/user")) {
        const id = identity(req),
          kind = Object.keys(ids).find((k) => ids[k] === id);
        send(kind ? fixtureUser(kind) : {}, kind ? 200 : 401);
        return;
      }
    }
    const id = identity(req),
      role = id ? "authenticated" : "anon";
    if (path.includes("/rpc/")) {
      const name = path.split("/").pop();
      calls.push({ name, requestId: payload.p_request?.requestId, actor: id });
      const result = await actor(
        id,
        async (client) =>
          name === "get_my_access" || name === "staff_get_catalog"
            ? (await client.query(`select public.${name}() as result`)).rows[0]
                .result
            : rpc(client, name, payload.p_request ?? {}),
        role,
      );
      if (name === "place_order" && loseNextOrder && result.ok) {
        loseNextOrder = false;
        send(
          {
            code: "FIXTURE_LOST_RESPONSE",
            message: "Synthetic interrupted response after commit",
          },
          503,
        );
        return;
      }
      send(result);
      return;
    }
    if (path === "/functions/v1/delivery-quote") {
      calls.push({ name: "delivery-quote", actor: id });
      const destination = payload.destination;
      if (routeDelay) await new Promise((r) => setTimeout(r, routeDelay));
      if (routeMode === "no-route") {
        send(
          {
            ok: false,
            code: "ROUTE_UNAVAILABLE",
            message:
              "A road route could not be found. Try another pin or choose pickup.",
          },
          503,
        );
        return;
      }
      const reserved = await actor(
        null,
        (c) => rpc(c, "reserve_quote_request", { ownerId: id, destination }),
        "service_role",
      );
      if (!reserved.ok) {
        send(reserved, 400);
        return;
      }
      const quote = await actor(
        null,
        (c) =>
          rpc(c, "store_delivery_quote", {
            reservationId: reserved.data.id,
            distanceMetres: 3500,
          }),
        "service_role",
      );
      if (routeMode === "expired" && quote.ok) {
        quote.data.issuedAt = "2026-01-01T00:00:00.000Z";
        quote.data.expiresAt = "2026-01-01T00:00:00.001Z";
      }
      send(quote, quote.ok ? 200 : 400);
      return;
    }
    const table = path.split("/").pop();
    if (
      !["products", "categories", "profiles", "restaurant_settings"].includes(
        table,
      )
    ) {
      send({ message: "Unknown fixture endpoint" }, 404);
      return;
    }
    const result = await actor(
      id,
      async (client) => {
        if (req.method === "PATCH" && table === "profiles") {
          return (
            await client.query(
              "update public.profiles set display_name=$1,phone=$2 where id=$3 returning *",
              [payload.display_name, payload.phone, id],
            )
          ).rows;
        }
        return (
          await client.query(
            `select * from public.${table}${table === "profiles" ? " where id=$1" : table === "products" || table === "categories" ? " where active=true" : ""}`,
            table === "profiles" ? [id] : [],
          )
        ).rows;
      },
      role,
    );
    send(
      req.headers.accept?.includes("vnd.pgrst.object")
        ? (result[0] ?? null)
        : result,
    );
  } catch (error) {
    console.error("Fixture request failed:", path, error.message);
    send({ message: "Fixture API failure" }, 500);
  }
});
server.listen(55435, "127.0.0.1", () =>
  console.log(
    "TEST ONLY synthetic Auth + real Postgres fixtures on 127.0.0.1:55435",
  ),
);
process.on("SIGINT", () => {
  server.close();
  void pool.end();
});
