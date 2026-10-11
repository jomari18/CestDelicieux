import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates, DeliveryPolicy } from "../../domain/contracts";
import { validateCoordinates } from "../../domain/validation";
import { getCurrentCoordinates } from "../../platform/location";
import { Button } from "../../components/Button";
import { StatusNotice } from "../../components/StatusNotice";
const markerIcon = L.divIcon({
  className: "destination-marker",
  html: "<span></span>",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});
export function DestinationPicker({
  policy,
  destination,
  onChange,
  onConfirm,
  disabled = false,
}: {
  policy: DeliveryPolicy;
  destination: Coordinates | null;
  onChange: (p: Coordinates) => void;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const div = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    marker = useRef<L.Marker | null>(null),
    change = useRef(onChange);
  change.current = onChange;
  const [lat, setLat] = useState(String(destination?.lat ?? policy.origin.lat)),
    [lng, setLng] = useState(String(destination?.lng ?? policy.origin.lng)),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!div.current) return;
    const current = L.map(div.current).setView(
      [policy.origin.lat, policy.origin.lng],
      13,
    );
    map.current = current;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(current);
    const pin = L.marker(
      [
        destination?.lat ?? policy.origin.lat,
        destination?.lng ?? policy.origin.lng,
      ],
      { icon: markerIcon, draggable: true },
    ).addTo(current);
    marker.current = pin;
    function choose(p: L.LatLng) {
      setLat(p.lat.toFixed(6));
      setLng(p.lng.toFixed(6));
      pin.setLatLng(p);
      change.current({ lat: p.lat, lng: p.lng });
    }
    pin.on("dragend", () => choose(pin.getLatLng()));
    current.on("click", (e) => choose(e.latlng));
    return () => {
      current.remove();
      map.current = null;
    };
  }, [policy.origin.lat, policy.origin.lng]);
  useEffect(() => {
    if (destination) {
      setLat(String(destination.lat));
      setLng(String(destination.lng));
      marker.current?.setLatLng([destination.lat, destination.lng]);
    }
  }, [destination?.lat, destination?.lng]);
  async function locate() {
    setBusy(true);
    const r = await getCurrentCoordinates();
    setBusy(false);
    if (r.ok) {
      onChange(r.data);
      map.current?.setView([r.data.lat, r.data.lng], 15);
      setError("");
    } else setError(r.message);
  }
  function coordinates() {
    const value = { lat: Number(lat), lng: Number(lng) };
    if (!lat.trim() || !lng.trim() || !validateCoordinates(value)) {
      setError("Enter valid latitude and longitude.");
      return;
    }
    onChange(value);
    map.current?.setView([value.lat, value.lng], 15);
    setError("");
  }
  return (
    <fieldset disabled={disabled} className="destination-picker">
      <legend>Where should we bring your meal?</legend>
      <p className="muted">
        {policy.label} · Up to {(policy.maxDistanceMetres / 1000).toFixed(0)} km
        by road. The map does not confirm your delivery address.
      </p>
      <div
        className="destination-map"
        ref={div}
        aria-label="Choose a delivery pin on the map"
      />
      <div className="coordinate-fields">
        <label>
          Latitude
          <input
            type="number"
            step="any"
            min={-90}
            max={90}
            value={lat}
            onChange={(e) => {
              setLat(e.target.value);
              onChange({ lat: Number(e.target.value), lng: Number(lng) });
            }}
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="any"
            min={-180}
            max={180}
            value={lng}
            onChange={(e) => {
              setLng(e.target.value);
              onChange({ lat: Number(lat), lng: Number(e.target.value) });
            }}
          />
        </label>
      </div>
      <div className="dialog-actions">
        <Button type="button" variant="outline" onClick={coordinates}>
          Place pin from coordinates
        </Button>
        <Button type="button" variant="outline" busy={busy} onClick={locate}>
          Use my location
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={
            !destination || !validateCoordinates(destination) || !policy.enabled
          }
        >
          Confirm pin & estimate delivery
        </Button>
      </div>
      <StatusNotice error message={error} />
    </fieldset>
  );
}
