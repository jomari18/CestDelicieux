import type { Reservation } from "./handler.ts";
export async function getRoadDistance(
  reservation: Reservation,
  key: string,
  transport: typeof fetch = fetch,
): Promise<number> {
  const response = await transport(
    "https://api.heigit.org/openrouteservice/v2/directions/driving-car",
    {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: key },
      body: JSON.stringify({
        coordinates: [
          [reservation.origin.lng, reservation.origin.lat],
          [reservation.destination.lng, reservation.destination.lat],
        ],
      }),
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw Error("Route provider unavailable");
  const body = await response.json();
  const distance = body?.routes?.[0]?.summary?.distance;
  if (
    typeof distance !== "number" ||
    !Number.isFinite(distance) ||
    distance < 0
  )
    throw Error("No valid route");
  return distance;
}
