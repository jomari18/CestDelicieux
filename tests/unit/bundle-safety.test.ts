import { it, expect } from "vitest";
import { assertSafeBundle } from "../../tools/bundle-safety";
const jwt = (role: string) =>
  [{ alg: "HS256", typ: "JWT" }, { role }, "synthetic-signature"]
    .map((value) =>
      typeof value === "string"
        ? value
        : Buffer.from(JSON.stringify(value)).toString("base64url"),
    )
    .join(".");
it.each(["service_role", "authenticated"])(
  "rejects a bundled legacy JWT with role %s",
  (role) => {
    expect(() => assertSafeBundle('const key="' + jwt(role) + '";')).toThrow();
  },
);
it("accepts anonymous/public configuration and rejects secret keys", () => {
  expect(() =>
    assertSafeBundle('const key="' + jwt("anon") + '";'),
  ).not.toThrow();
  expect(() =>
    assertSafeBundle("sb_secret_syntheticNotARealKey1234"),
  ).toThrow();
});
