import { it, expect } from "vitest";
import { getRoadDistance } from "../../supabase/functions/delivery-quote/provider";
const reservation = {
  id: "test",
  origin: { lat: 14.5995, lng: 120.9842 },
  destination: { lat: 14.61, lng: 120.99 },
  settingsVersion: 1,
  maxDistanceMetres: 25000,
};
it("reads metres from the documented driving-car response and sends longitude first", async () => {
  const transport: typeof fetch = async (input, init) => {
    expect(input).toBe(
      "https://api.heigit.org/openrouteservice/v2/directions/driving-car",
    );
    expect(JSON.parse(String(init?.body)).coordinates).toEqual([
      [120.9842, 14.5995],
      [120.99, 14.61],
    ]);
    expect(String(init?.body)).not.toContain("provider-key");
    return new Response(
      JSON.stringify({
        routes: [{ summary: { distance: 4123.45, duration: 300 } }],
      }),
    );
  };
  expect(await getRoadDistance(reservation, "provider-key", transport)).toBe(
    4123.45,
  );
});
it.each([
  { routes: [] },
  { routes: [{ summary: { distance: "4000" } }] },
  { error: { code: 2009, message: "No route" } },
])("rejects an unusable provider response", async (response) =>
  expect(
    getRoadDistance(
      reservation,
      "key",
      async () => new Response(JSON.stringify(response)),
    ),
  ).rejects.toThrow(),
);
it("rejects a quota error without treating it as a free route", async () =>
  expect(
    getRoadDistance(
      reservation,
      "key",
      async () => new Response("{}", { status: 429 }),
    ),
  ).rejects.toThrow());

it.each([401,403,429,500])("retains only safe provider HTTP status %s for diagnostics", async status => {
  await expect(getRoadDistance(reservation, "private-key", async () => new Response("private-provider-body", { status })))
    .rejects.toMatchObject({ status, message: "Route provider unavailable" });
});
