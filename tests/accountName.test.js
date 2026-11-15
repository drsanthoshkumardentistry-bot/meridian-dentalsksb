import { describe, it, expect } from "vitest";
import { shareName } from "../src/accountName.js";

describe("shareName", () => {
  it("prefers the clinic name", () => { expect(shareName("Smile Care", { displayName: "Dr. A" })).toBe("Smile Care"); });
  it("falls back to the account name", () => { expect(shareName("  ", { displayName: "Dr. Santhoshkumar" })).toBe("Dr. Santhoshkumar"); });
  it("then to the start of the e-mail", () => { expect(shareName("", { displayName: "", email: "drx@mail.com" })).toBe("drx"); });
  it("is empty when nothing is known", () => { expect(shareName(undefined, null)).toBe(""); });
});
