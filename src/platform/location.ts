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
        throw Error();
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
  } catch {
    return {
      ok: false,
      code: "LOCATION_UNAVAILABLE",
      message:
        "Location is unavailable. Place the pin on the map or enter coordinates instead.",
    };
  }
}
