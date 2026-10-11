import { it, expect } from "vitest";
import { readPublicConfig } from "../../src/lib/config";
it("rejects a legacy privileged JWT rather than exposing it in a frontend build", () => {
  const token = [{ alg: "HS256" }, { role: "service_role" }, "synthetic"]
    .map((v) => (typeof v === "string" ? v : btoa(JSON.stringify(v))))
    .join(".");
  expect(
    readPublicConfig({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: token,
    }).ok,
  ).toBe(false);
});
