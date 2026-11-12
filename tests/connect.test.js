import { describe, it, expect } from "vitest";
import {
  validateProfile, validateConsult, orderResults, filterResults, canMoveTo, waLink, telLink, specialtyLabel, MAX_SUMMARY,
} from "../src/connect/rules.js";
import { geoFields, searchBounds, withinRadius, distanceKm, geocodeAddress, validCoords } from "../src/connect/geo.js";

const profile = {
  fullName: "Dr A", qualification: "MDS", specialty: "endodontics", councilState: "Tamil Nadu",
  registrationNo: "TN-1", clinicName: "C", clinicAddress: "1 Road, Coimbatore 641001", phone: "9876543210", whatsapp: "",
};

describe("Connect profile and consult validation", () => {
  it("accepts a complete profile and names the first missing field", () => {
    expect(validateProfile(profile)).toBe("");
    expect(validateProfile({ ...profile, registrationNo: " " })).toMatch(/registration number/);
    expect(validateProfile({ ...profile, specialty: "magic" })).toMatch(/specialty/);
    expect(validateProfile({ ...profile, phone: "12345" })).toMatch(/10-digit/);
    expect(validateProfile({ ...profile, whatsapp: "99" })).toMatch(/WhatsApp/);
    expect(validateProfile({ ...profile, phone: "+91 98765 43210" })).toBe("");
  });

  it("needs consent for case details and blocks full names as patient reference", () => {
    const ok = { urgency: "routine", patientRef: "A.D.", caseSummary: "", consent: false };
    expect(validateConsult(ok)).toBe("");
    expect(validateConsult({ ...ok, caseSummary: "Pain in 46", consent: false })).toMatch(/agreed/);
    expect(validateConsult({ ...ok, caseSummary: "Pain in 46", consent: true })).toBe("");
    expect(validateConsult({ ...ok, patientRef: "Asha Devi Kumar" })).toMatch(/initials/);
    expect(validateConsult({ ...ok, urgency: "now" })).toMatch(/urgent/);
    expect(validateConsult({ ...ok, caseSummary: "x".repeat(MAX_SUMMARY + 1), consent: true })).toMatch(/under/);
  });

  it("orders by distance then name with no other signal, and filters", () => {
    const list = [
      { id: "1", fullName: "Zed", distanceKm: 2, specialty: "endodontics" },
      { id: "2", fullName: "Amy", distanceKm: 2, specialty: "orthodontics", acceptingReferrals: false },
      { id: "3", fullName: "Bob", distanceKm: 1, specialty: "endodontics", rating: 5, paid: true },
    ];
    expect(orderResults(list).map((d) => d.id)).toEqual(["3", "2", "1"]);
    expect(filterResults(list, { specialty: "endodontics" }).map((d) => d.id)).toEqual(["1", "3"]);
    expect(filterResults(list, { acceptingOnly: false, excludeId: "3" }).map((d) => d.id)).toEqual(["1", "2"]);
  });

  it("only allows sensible status moves and builds contact links", () => {
    expect(canMoveTo("sent", "accepted")).toBe(true);
    expect(canMoveTo("sent", "declined")).toBe(true);
    expect(canMoveTo("accepted", "completed")).toBe(true);
    expect(canMoveTo("declined", "accepted")).toBe(false);
    expect(canMoveTo("sent", "completed")).toBe(false);
    expect(waLink("98765 43210", "hi there")).toBe("https://wa.me/919876543210?text=hi%20there");
    expect(waLink("", "x")).toBe("");
    expect(telLink("+91 98765 43210")).toBe("tel:+919876543210");
    expect(specialtyLabel("endodontics")).toMatch(/Endodontics/);
  });
});

describe("Connect geography", () => {
  const cbe = { lat: 11.0168, lng: 76.9558 };
  const near = { lat: 11.03, lng: 76.97 }; // about 2 km
  const far = { lat: 13.0827, lng: 80.2707 }; // Chennai

  it("computes distances and filters by real distance", () => {
    expect(distanceKm(cbe, cbe)).toBe(0);
    const d = distanceKm(cbe, near);
    expect(d).toBeGreaterThan(1.5);
    expect(d).toBeLessThan(3);
    const docs = [{ id: "n", geo: near }, { id: "f", geo: far }, { id: "x" }, { id: "bad", geo: { lat: 999, lng: 0 } }];
    const hits = withinRadius(docs, cbe, 10);
    expect(hits.map((h) => h.id)).toEqual(["n"]);
    expect(hits[0].distanceKm).toBeCloseTo(d, 5);
  });

  it("stores a geohash and covers the circle with ranges that include a nearby point", () => {
    const f = geoFields(near.lat, near.lng);
    expect(f.geohash).toMatch(/^[0-9b-hjkmnp-z]{10}$/);
    const bounds = searchBounds(cbe.lat, cbe.lng, 10);
    expect(bounds.length).toBeGreaterThan(0);
    expect(bounds.some(([a, b]) => f.geohash >= a && f.geohash <= b)).toBe(true);
    const chennai = geoFields(far.lat, far.lng).geohash;
    expect(bounds.some(([a, b]) => chennai >= a && chennai <= b)).toBe(false);
  });

  it("geocodes through an injected fetch and handles misses and failures", async () => {
    const ok = async () => ({ ok: true, json: async () => [{ lat: "11.0", lon: "76.9", display_name: "Coimbatore" }] });
    expect(await geocodeAddress("addr", ok)).toEqual({ lat: 11, lng: 76.9, label: "Coimbatore" });
    expect(await geocodeAddress("addr", async () => ({ ok: true, json: async () => [] }))).toBeNull();
    await expect(geocodeAddress("addr", async () => ({ ok: false }))).rejects.toThrow();
    expect(validCoords(NaN, 1)).toBe(false);
  });
});

import { directionsLink, toggleSaved, shareText, DISTANCES_KM } from "../src/connect/rules.js";
import { currentPosition } from "../src/connect/geo.js";
describe("connect location and saving", () => {
  const list = [{ id: "1", specialty: "endodontics", emergencyAvailable: true }, { id: "2", specialty: "endodontics", emergencyAvailable: false }, { id: "3", specialty: "general" }];
  it("filters by emergency and by saved ids", () => {
    expect(filterResults(list, { emergencyOnly: true }).map((d) => d.id)).toEqual(["1"]);
    expect(filterResults(list, { onlyIds: ["2", "3"] }).map((d) => d.id)).toEqual(["2", "3"]);
    expect(filterResults(list, { onlyIds: [] })).toEqual([]);
  });
  it("offers up to 100 km", () => { expect(DISTANCES_KM.at(-1)).toBe(100); });
  it("builds directions only for real coordinates", () => {
    expect(directionsLink(11.0, 76.9)).toBe("https://www.google.com/maps/dir/?api=1&destination=11,76.9");
    expect(directionsLink(undefined, 76.9)).toBe("");
  });
  it("toggles saved ids and survives bad data", () => {
    expect(toggleSaved(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleSaved(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleSaved(null, "a")).toEqual(["a"]);
    expect(toggleSaved([1, "x"], "y")).toEqual(["x", "y"]);
  });
  it("writes a shareable contact", () => {
    expect(shareText({ fullName: "Dr A", qualification: "MDS", specialty: "endodontics", clinicName: "C", clinicAddress: "Coimbatore", phone: "9043205927" })).toBe("Dr A, MDS\nEndodontics (root canal)\nC, Coimbatore\nPhone: 9043205927");
  });
  it("reads the device location and explains a refusal", async () => {
    const ok = { getCurrentPosition: (s) => s({ coords: { latitude: 11, longitude: 77 } }) };
    expect(await currentPosition(ok)).toEqual({ lat: 11, lng: 77 });
    const no = { getCurrentPosition: (_s, e) => e({ code: 1 }) };
    await expect(currentPosition(no)).rejects.toThrow(/blocked/);
    await expect(currentPosition(null)).rejects.toThrow(/cannot share/);
  });
});
