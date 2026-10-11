import { afterEach, expect, it, vi } from "vitest";
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
import { getCurrentCoordinates } from "../../src/platform/location";
afterEach(() => vi.unstubAllGlobals());
it.each([[1, "LOCATION_PERMISSION_DENIED"], [2, "LOCATION_UNAVAILABLE"], [3, "LOCATION_TIMEOUT"]])("distinguishes browser location failure %s", async (code, expected) => {
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: (_success: unknown, failure: (e: unknown) => void) => failure({ code }) } });
  expect(await getCurrentCoordinates()).toMatchObject({ ok: false, code: expected });
});
it("returns the device coordinates without substituting a fallback pin", async () => {
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: (success: (p: unknown) => void) => success({ coords: { latitude: 14.62, longitude: 120.99 } }) } });
  expect(await getCurrentCoordinates()).toEqual({ ok: true, data: { lat: 14.62, lng: 120.99 } });
});
