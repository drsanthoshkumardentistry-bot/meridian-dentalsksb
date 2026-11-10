import { geohashForLocation, geohashQueryBounds, distanceBetween } from "geofire-common";

export const validCoords = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

export const geoFields = (lat, lng) => ({ geo: { lat, lng }, geohash: geohashForLocation([lat, lng]) });

/** [start, end] geohash ranges that together cover a circle. Results must still be filtered by real distance. */
export const searchBounds = (lat, lng, radiusKm) => geohashQueryBounds([lat, lng], radiusKm * 1000);

export const distanceKm = (from, to) => distanceBetween([from.lat, from.lng], [to.lat, to.lng]);

/** Adds distanceKm and drops anything outside the radius (the geohash ranges overshoot). */
export const withinRadius = (docs, center, radiusKm) =>
  docs
    .filter((d) => d.geo && validCoords(d.geo.lat, d.geo.lng))
    .map((d) => ({ ...d, distanceKm: distanceKm(center, d.geo) }))
    .filter((d) => d.distanceKm <= radiusKm);

/** Look an address up on OpenStreetMap (Nominatim). Called from the browser, one request per submit. */
export const geocodeAddress = async (address, fetchFn = globalThis.fetch) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(address)}`;
  const res = await fetchFn(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("geocode failed");
  const rows = await res.json();
  if (!rows.length) return null;
  const lat = Number(rows[0].lat);
  const lng = Number(rows[0].lon);
  return validCoords(lat, lng) ? { lat, lng, label: rows[0].display_name || "" } : null;
};
