import { describe, it, expect } from "vitest";
import { groupRecipients, fillMessage, messageLink } from "../src/bulkMessage.js";

const patients = [
  { id: "1", name: "Asha", phone: "9876543210" },
  { id: "2", name: "Ravi", phone: "12345" },
  { id: "3", name: "Meena", phone: "9123456780", consent: { whatsapp: false } },
  { id: "4", name: "Kiran", phone: "9000000001" },
];
describe("bulk message", () => {
  it("skips patients with bad numbers or no consent", () => {
    const r = groupRecipients("all", { patients });
    expect(r.recipients.map((p) => p.id)).toEqual(["1", "4"]);
    expect(r.skipped).toBe(2);
  });
  it("uses the list shown on screen and ignores duplicates", () => {
    const r = groupRecipients("shown", { patients, shown: [patients[0], patients[0], patients[3]] });
    expect(r.recipients.map((p) => p.id)).toEqual(["1", "4"]);
  });
  it("finds patients with a pending balance", () => {
    const invoices = [{ patientId: "4", id: "I1", total: 500, paid: 0, items: [{ name: "x", qty: 1, price: 500 }], payments: [] }];
    const r = groupRecipients("balance", { patients, invoices });
    expect(r.recipients.map((p) => p.id)).toEqual(["4"]);
  });
  it("fills the message and builds a wa.me link", () => {
    expect(fillMessage("Hi {name}, {clinic}", { patient: patients[0], clinicName: "Smile" })).toBe("Hi Asha, Smile");
    expect(messageLink(patients[0], "Hi {name}", "Smile")).toBe("https://wa.me/919876543210?text=Hi%20Asha");
  });
});
