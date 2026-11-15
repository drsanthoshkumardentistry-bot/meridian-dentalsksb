import { describe, it, expect, vi } from "vitest";
import crypto from "node:crypto";
import { signSeal, verifySeal } from "../api/_lib/payCore.js";
import { buildPayLink, parsePayLink } from "../src/payLink.js";
import { checkPayLink } from "../src/paySeal.js";

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const sa = { client_email: "s@p.iam.gserviceaccount.com", private_key: privateKey, project_id: "p" };
const other = { ...sa, private_key: crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } }).privateKey };

describe("sealed payment details", () => {
  const ks = signSeal(sa, "uid1", "smile@okhdfc", "Smile Dental");
  it("accepts the exact details that were sealed", () => {
    expect(verifySeal(sa, { u: "uid1", pa: "smile@okhdfc", pn: "Smile Dental", ks })).toBe(true);
    expect(verifySeal(sa, { u: "uid1", pa: " SMILE@okhdfc ", pn: " Smile Dental ", ks })).toBe(true);
  });
  it("rejects a swapped UPI ID, a changed name, another account, or another server key", () => {
    expect(verifySeal(sa, { u: "uid1", pa: "thief@okhdfc", pn: "Smile Dental", ks })).toBe(false);
    expect(verifySeal(sa, { u: "uid1", pa: "smile@okhdfc", pn: "Smile Dentals", ks })).toBe(false);
    expect(verifySeal(sa, { u: "uid2", pa: "smile@okhdfc", pn: "Smile Dental", ks })).toBe(false);
    expect(verifySeal(other, { u: "uid1", pa: "smile@okhdfc", pn: "Smile Dental", ks })).toBe(false);
  });
  it("rejects missing or malformed seals and never throws", () => {
    for (const bad of [undefined, null, {}, { u: "uid1", pa: "smile@okhdfc", pn: "x", ks: "zz" }, { u: "", pa: "a@bb", pn: "", ks }, { u: "u".repeat(500), pa: "smile@okhdfc", pn: "", ks }, { u: 1, pa: 2, pn: 3, ks: 4 }]) {
      expect(verifySeal(sa, bad)).toBe(false);
    }
    expect(verifySeal(null, { u: "uid1", pa: "smile@okhdfc", pn: "Smile Dental", ks })).toBe(false);
  });
});

describe("pay link with a seal", () => {
  const ks = signSeal(sa, "uid1", "smile@okhdfc", "Smile Dental");
  it("carries the seal and reads it back", () => {
    const link = buildPayLink("https://x.in", { vpa: "smile@okhdfc", name: "Smile Dental", amountP: 50000, note: "I1", seal: { u: "uid1", ks } });
    expect(parsePayLink(new URL(link).search)).toMatchObject({ vpa: "smile@okhdfc", u: "uid1", ks });
    expect(parsePayLink(new URL(buildPayLink("https://x.in", { vpa: "smile@okhdfc", name: "S" })).search).ks).toBeUndefined();
  });
  it("ignores a malformed seal in the link", () => {
    expect(parsePayLink("?pay=1&pa=ab@upi&u=u1&ks=nothex").ks).toBeUndefined();
  });
});

describe("patient-side check", () => {
  const req = { vpa: "smile@okhdfc", name: "Smile Dental", u: "uid1", ks: "a".repeat(64) };
  const ans = (body, ok = true) => vi.fn(async () => ({ ok, json: async () => body }));
  it("says ok, bad, unknown or unsigned", async () => {
    expect(await checkPayLink(req, ans({ ok: true, configured: true }))).toBe("ok");
    expect(await checkPayLink(req, ans({ ok: false, configured: true }))).toBe("bad");
    expect(await checkPayLink(req, ans({ ok: false, configured: false }))).toBe("unknown");
    expect(await checkPayLink(req, ans({}, false))).toBe("unknown");
    expect(await checkPayLink(req, vi.fn(async () => { throw new Error("offline"); }))).toBe("unknown");
    expect(await checkPayLink({ vpa: "a@bb" }, ans({}))).toBe("unsigned");
  });
});
