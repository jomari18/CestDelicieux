import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import type { ApiResult, Coordinates } from "../domain/contracts";
export async function getCurrentCoordinates(): Promise<ApiResult<Coordinates>> {
  try {
    if (Capacitor.isNativePlatform()) {
      const permission = await Geolocation.requestPermissions();
      if (
        permission.location !== "granted" &&
        permission.coarseLocation !== "granted"
      )
        throw { code: 1 };
      const p = await Geolocation.getCurrentPosition({
        timeout: 10000,
        maximumAge: 60000,
      });
      return {
        ok: true,
        data: { lat: p.coords.latitude, lng: p.coords.longitude },
      };
    }
    const p = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        maximumAge: 60000,
      }),
    );
    return {
      ok: true,
      data: { lat: p.coords.latitude, lng: p.coords.longitude },
    };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (code === 1) return {
      ok: false,
      code: "LOCATION_PERMISSION_DENIED",
      message: "Location permission was denied. Allow location access in your browser and device settings, then try again. You can also place the pin manually.",
    };
    if (code === 3) return {
      ok: false,
      code: "LOCATION_TIMEOUT",
      message: "Finding your location timed out. Try again or place the pin manually.",
    };
    return {
      ok: false,
      code: "LOCATION_UNAVAILABLE",
      message:
        "Your browser or device could not determine your location. Check that device location services are on, or place the pin manually.",
    };
  }
}
