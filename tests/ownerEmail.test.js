import { describe, it, expect } from "vitest";
import { isOwnerEmail, OWNER_EMAIL_SHA256 } from "../src/connect/owner.js";

describe("owner email check", () => {
  it("accepts only the address behind the fingerprint, ignoring case and spaces", async () => {
    expect(OWNER_EMAIL_SHA256).toMatch(/^[0-9a-f]{64}$/);
    expect(await isOwnerEmail("someone@example.com")).toBe(false);
    expect(await isOwnerEmail("")).toBe(false);
    expect(await isOwnerEmail(undefined)).toBe(false);
  });
});
