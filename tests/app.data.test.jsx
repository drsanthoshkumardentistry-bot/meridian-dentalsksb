import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth, cb) => {
    setTimeout(() => cb({ uid: "u-test", email: "t@example.com", displayName: "Test", emailVerified: true, providerData: [{ providerId: "google.com" }] }), 0);
    return () => {};
  },
}));
vi.mock("../src/firebase", () => ({
  auth: {}, db: null, storage: null, firebaseConfigured: true,
  loginWithGoogle: async () => {}, logoutUser: async () => {}, completeRedirectLogin: async () => null,
  signInWithEmail: async () => {}, signUpWithEmail: async () => {}, sendPasswordReset: async () => {}, resendVerificationEmail: async () => {}, refreshVerifiedStatus: async () => false,
}));
vi.mock("firebase/firestore", () => ({
  collection: () => ({}), doc: () => ({}), setDoc: async () => {}, onSnapshot: () => () => {}, deleteDoc: async () => {},
}));

import App from "../src/App.jsx";

const KEY = (n) => `merident_u-test_${n}`;
const stored = (n) => JSON.parse(localStorage.getItem(KEY(n)) || "[]");

async function openApp() {
  render(<App />);
  await screen.findAllByText("Patients & Odontogram");
}
const nav = (label) => fireEvent.click(screen.getAllByText(label)[0]);
const input = (container, label) => {
  const lab = within(container).getAllByText(new RegExp("^" + label))[0];
  return lab.parentElement.querySelector("input,select");
};
const type = (el, value) => fireEvent.change(el, { target: { value } });

beforeEach(() => { cleanup(); localStorage.clear(); });

async function fillPatient(form, o = {}) {
  type(input(form, "Full Name"), o.name ?? "Asha Devi");
  type(input(form, "Age"), o.age ?? "34");
  type(input(form, "Gender"), o.gender ?? "Female");
  type(input(form, "WhatsApp Phone"), o.phone ?? "+91 98765 43210");
  if (o.consent !== false) fireEvent.click(within(form).getByLabelText(/agrees to dental examination/i));
}

describe("demographics and required data", () => {
  it("validates patient registration, guardian rule and consent", async () => {
    await openApp();
    nav("Patients & Odontogram");
    fireEvent.click(await screen.findByText("Add Patient"));
    const form = (await screen.findByText("Add New Patient")).closest("form");
    await fillPatient(form, { consent: false });
    fireEvent.submit(form);
    expect(await screen.findByText(/Consent for examination/i)).toBeTruthy();
    expect(stored("patients").length).toBe(0);
    type(input(form, "WhatsApp Phone"), "12345");
    fireEvent.click(within(form).getByLabelText(/agrees to dental examination/i));
    fireEvent.submit(form);
    expect(await screen.findByText(/valid 10-digit Indian mobile/i)).toBeTruthy();
    type(input(form, "WhatsApp Phone"), "9876543210");
    type(input(form, "Age"), "8");
    expect(within(form).getByText(/Parent \/ guardian/i)).toBeTruthy();
    fireEvent.submit(form);
    expect(await screen.findByText(/Guardian name is required/i)).toBeTruthy();
    expect(stored("patients").length).toBe(0);
  });

  it("registers an adult with clean phone, consent record and unique id; details are editable", async () => {
    await openApp();
    nav("Patients & Odontogram");
    fireEvent.click(await screen.findByText("Add Patient"));
    const form = (await screen.findByText("Add New Patient")).closest("form");
    await fillPatient(form);
    type(input(form, "City"), "Coimbatore");
    fireEvent.submit(form);
    await waitFor(() => expect(stored("patients").length).toBe(1));
    const p = stored("patients")[0];
    expect(p.phone).toBe("9876543210");
    expect(p.consent.treatment).toBe(true);
    expect(p.consent.whatsapp).toBe(true);
    expect(typeof p.consent.recordedAt).toBe("string");
    expect(p.id).toMatch(/^P-[0-9a-z]{8,}/);
    expect(p.city).toBe("Coimbatore");
    fireEvent.click(await screen.findByText("Patient Details"));
    const occ = (await screen.findAllByText(/^Occupation/))[0].parentElement.querySelector("input");
    type(occ, "Teacher");
    await waitFor(() => expect(stored("patients")[0].occupation).toBe("Teacher"));
    const dob = screen.getAllByText(/^Date of birth/)[0].parentElement.querySelector("input");
    type(dob, `${new Date().getFullYear() - 20}-01-01`);
    await waitFor(() => expect(Number(stored("patients")[0].age)).toBeGreaterThanOrEqual(19));
  });

  it("systemic review and habits are stored per patient, not shared", async () => {
    await openApp();
    nav("Patients & Odontogram");
    const addPatient = async (name, phone) => {
      fireEvent.click(await screen.findByText("Add Patient"));
      const form = (await screen.findByText("Add New Patient")).closest("form");
      await fillPatient(form, { name, phone });
      fireEvent.submit(form);
      await waitFor(() => expect(stored("patients").some((x) => x.name === name)).toBe(true));
    };
    await addPatient("Patient A", "9876543210");
    fireEvent.click(await screen.findByText("Systemic Review"));
    fireEvent.click((await screen.findByText("Hypertension (BP)")).parentElement.querySelector("input"));
    type((await screen.findAllByText(/^Tobacco/))[0].parentElement.querySelector("select"), "Betel quid / areca nut");
    await waitFor(() => {
      const a = stored("patients").find((x) => x.name === "Patient A");
      expect(a.systemic.hypertension).toBe(true);
      expect(a.habits.tobacco).toBe("Betel quid / areca nut");
    });
    fireEvent.click(screen.getByText("Close Window"));
    await addPatient("Patient B", "9123456780");
    fireEvent.click(await screen.findByText("Systemic Review"));
    expect((await screen.findByText("Hypertension (BP)")).parentElement.querySelector("input").checked).toBe(false);
    expect((await screen.findAllByText(/^Tobacco/))[0].parentElement.querySelector("select").value).toBe("Not recorded");
  });

  it("practice profile validates GSTIN and pincode", async () => {
    await openApp();
    nav("Practice Profile");
    const gst = (await screen.findByText(/^GSTIN/)).parentElement.querySelector("input");
    type(gst, "abc");
    expect(await screen.findByText(/GSTIN must be 15 characters/i)).toBeTruthy();
    type(gst, "33ABCDE1234F1Z5");
    await waitFor(() => expect(screen.queryByText(/GSTIN must be 15 characters/i)).toBeNull());
    type((await screen.findByText(/^Pincode/)).parentElement.querySelector("input"), "6410");
    expect(await screen.findByText(/Pincode must be 6 digits/i)).toBeTruthy();
  });

  it("staff need a mobile number and license status is computed", async () => {
    await openApp();
    nav("Employee Roles & Roster");
    fireEvent.click(await screen.findByText("Add Staff Member", { selector: "button" }));
    const form = (await screen.findAllByText("Add Staff Member")).map((e) => e.closest("form")).find(Boolean);
    type(form.querySelector('input[placeholder="e.g. Dr. Ramesh Kumar"]'), "Dr. Ravi");
    type(form.querySelector('input[type="tel"]'), "123");
    fireEvent.submit(form);
    expect(await screen.findByText(/valid 10-digit staff mobile/i)).toBeTruthy();
    type(form.querySelector('input[type="tel"]'), "9876501234");
    type(form.querySelector('input[type="date"]'), "2020-01-01");
    fireEvent.submit(form);
    await waitFor(() => expect(stored("employees").length).toBe(1));
    expect(await screen.findByText(/Expired \d+ days ago/)).toBeTruthy();
    expect(screen.queryByText(/Expires in 30 days/)).toBeNull();
  });

  it("appointments require a valid mobile and a doctor, and autofill from existing patients", async () => {
    await openApp();
    nav("Patients & Odontogram");
    fireEvent.click(await screen.findByText("Add Patient"));
    const pf = (await screen.findByText("Add New Patient")).closest("form");
    await fillPatient(pf, { name: "Meena K", phone: "9000000001", age: "40" });
    fireEvent.submit(pf);
    await waitFor(() => expect(stored("patients").length).toBe(1));
    fireEvent.click(screen.getByText("Close Window"));
    nav("Appointments Diary");
    const book = (await screen.findAllByText(/Book/)).find((e) => e.closest("button"));
    fireEvent.click(book.closest("button"));
    const form = (await screen.findAllByText("Patient Name *"))[0].closest("form");
    type(form.querySelector('input[list="patient-options"]'), "Meena K");
    expect(form.querySelector('input[type="tel"]').value).toBe("9000000001");
    fireEvent.submit(form);
    expect(await screen.findByText(/Choose the attending doctor/i)).toBeTruthy();
    type(form.querySelector('input[list="doctor-options"]'), "Dr. Test");
    type(form.querySelector('input[type="tel"]'), "99");
    fireEvent.submit(form);
    expect(await screen.findByText(/valid 10-digit mobile/i)).toBeTruthy();
    type(form.querySelector('input[type="tel"]'), "9000000001");
    fireEvent.submit(form);
    await waitFor(() => expect(stored("appointments").length).toBe(1));
    const a = stored("appointments")[0];
    expect(a.doctor).toBe("Dr. Test");
    expect(a.patientId).toBeTruthy();
    expect(a.visitType).toBe("New patient");
  });

  it("invoices require amount and treatment, and self-pay hides insurance fields", async () => {
    await openApp();
    nav("Dental Insurance & Invoices");
    fireEvent.click(await screen.findByText("New Invoice"));
    const form = (await screen.findAllByText("Patient Name *"))[0].closest("form");
    type(form.querySelector('input[list="patient-options"]'), "Walk In");
    expect(within(form).queryByText("Insurance / TPA", { selector: "label" })).toBeNull();
    type(form.querySelector("select"), "Insurance / TPA");
    expect(within(form).getByText("Insurance / TPA", { selector: "label" })).toBeTruthy();
    type(form.querySelector("select"), "Cash");
    expect(within(form).queryByText("Insurance / TPA", { selector: "label" })).toBeNull();
    fireEvent.submit(form);
    expect(await screen.findByText(/bill amount greater than zero/i)).toBeTruthy();
    type(form.querySelector('input[type="number"]'), "1500");
    fireEvent.submit(form);
    expect(await screen.findByText(/Describe the treatment/i)).toBeTruthy();
    type(form.querySelector('input[placeholder^="e.g. Root Canal"]'), "Scaling");
    fireEvent.submit(form);
    await waitFor(() => expect(stored("invoices").length).toBe(1));
    const inv = stored("invoices")[0];
    expect(inv.paymentMode).toBe("Cash");
    expect(inv.provider).toBe("Self Pay");
    expect(inv.claimId).toBe("");
    expect(inv.id).toMatch(/^INV\/\d{4}-\d{2}\/0001$/);
    expect(inv.totalP).toBe(150000);
    expect(inv.taxP).toBe(0);
  });

  it("adds 18% GST for cosmetic work and takes part payments without overpaying", async () => {
    await openApp();
    nav("Dental Insurance & Invoices");
    fireEvent.click(await screen.findByText("New Invoice"));
    const form = (await screen.findAllByText("Patient Name *"))[0].closest("form");
    type(form.querySelector('input[list="patient-options"]'), "Smile Client");
    type(form.querySelector('input[placeholder^="e.g. Root Canal"]'), "Teeth whitening");
    const selects = form.querySelectorAll("select");
    type(selects[selects.length - 1], "cosmetic");
    type(form.querySelector('input[type="number"]'), "10000");
    fireEvent.submit(form);
    await waitFor(() => expect(stored("invoices").length).toBe(1));
    const inv = stored("invoices")[0];
    expect(inv.totalP).toBe(1180000);
    expect(inv.cgstP).toBe(90000);
    expect(inv.sgstP).toBe(90000);

    fireEvent.click(await screen.findByText("Collect"));
    const amount = await screen.findByPlaceholderText(/Amount \(max/);
    type(amount, "5000");
    fireEvent.submit(amount.closest("form"));
    await waitFor(() => expect(stored("invoices")[0].payments.length).toBe(1));
    type(amount, "999999");
    fireEvent.submit(amount.closest("form"));
    expect(await screen.findByText(/more than the balance/i)).toBeTruthy();
    expect(stored("invoices")[0].payments.length).toBe(1);
  });

  it("bills several treatments on one invoice, mixing exempt and 18% GST", async () => {
    await openApp();
    nav("Dental Insurance & Invoices");
    fireEvent.click(await screen.findByText("New Invoice"));
    const form = (await screen.findAllByText("Patient Name *"))[0].closest("form");
    type(form.querySelector('input[list="patient-options"]'), "Multi Client");
    type(form.querySelector('input[placeholder^="e.g. Root Canal"]'), "Root Canal");
    type(form.querySelector('input[type="number"]'), "5000");
    fireEvent.click(within(form).getByText(/Add another treatment/i));
    type(within(form).getByLabelText("Treatment 2 description"), "Whitening");
    type(within(form).getByLabelText("Treatment 2 amount before tax"), "2000");
    type(within(form).getByLabelText("Treatment 2 tax category"), "cosmetic");
    fireEvent.submit(form);
    await waitFor(() => expect(stored("invoices").length).toBe(1));
    const inv = stored("invoices")[0];
    expect(inv.lines.length).toBe(2);
    expect(inv.treatment).toBe("Root Canal, Whitening");
    expect(inv.taxP).toBe(36000);
    expect(inv.totalP).toBe(736000);
  });

  it("rejects a second treatment row with no amount, and rows can be removed", async () => {
    await openApp();
    nav("Dental Insurance & Invoices");
    fireEvent.click(await screen.findByText("New Invoice"));
    const form = (await screen.findAllByText("Patient Name *"))[0].closest("form");
    type(form.querySelector('input[list="patient-options"]'), "Row Client");
    type(form.querySelector('input[placeholder^="e.g. Root Canal"]'), "Filling");
    type(form.querySelector('input[type="number"]'), "800");
    fireEvent.click(within(form).getByText(/Add another treatment/i));
    fireEvent.submit(form);
    expect(await screen.findByText(/bill amount greater than zero/i)).toBeTruthy();
    expect(stored("invoices").length).toBe(0);
    fireEvent.click(within(form).getByLabelText("Remove treatment 2"));
    fireEvent.submit(form);
    await waitFor(() => expect(stored("invoices").length).toBe(1));
  });

  it("treatment plans: create, approve, then bill into one invoice", async () => {
    localStorage.setItem(KEY("patients"), JSON.stringify([
      { id: "P-1", name: "Plan Patient", phone: "9876543210", age: "30", gender: "Male", toothConditions: {}, registeredDate: "01/11/2026" },
    ]));
    await openApp();
    nav("Patients & Odontogram");
    fireEvent.click(await screen.findByText("Plan Patient"));
    fireEvent.click(await screen.findByText("Treatment Plan"));
    fireEvent.click(await screen.findByText(/New plan/i));
    fireEvent.click(screen.getByText("Save plan"));
    expect(await screen.findByText(/Give the plan a title/i)).toBeTruthy();
    type(screen.getByLabelText("Plan title"), "Smile makeover");
    type(screen.getByLabelText("Plan item 1 treatment"), "Root canal");
    type(screen.getByLabelText("Plan item 1 tooth"), "46");
    type(screen.getByLabelText("Plan item 1 amount"), "5000");
    fireEvent.click(screen.getByText("Add treatment"));
    type(screen.getByLabelText("Plan item 2 treatment"), "Whitening");
    type(screen.getByLabelText("Plan item 2 amount"), "2000");
    type(screen.getByLabelText("Plan item 2 tax category"), "cosmetic");
    fireEvent.click(screen.getByText("Save plan"));
    await waitFor(() => expect(stored("patients")[0].plans?.length).toBe(1));
    expect(stored("patients")[0].plans[0].status).toBe("Proposed");
    expect(screen.queryByText("Create invoice")).toBeNull();
    fireEvent.click(screen.getByText(/Mark approved/i));
    await waitFor(() => expect(stored("patients")[0].plans[0].status).toBe("Approved"));
    fireEvent.click(await screen.findByText("Create invoice"));
    const form = (await screen.findAllByText("Patient Name *"))[0].closest("form");
    expect(form.querySelector('input[list="patient-options"]').value).toBe("Plan Patient");
    expect(within(form).getByLabelText("Treatment 1 description").value).toBe("Root canal (tooth 46)");
    fireEvent.submit(form);
    await waitFor(() => expect(stored("invoices").length).toBe(1));
    expect(stored("invoices")[0].totalP).toBe(736000);
    await waitFor(() => expect(stored("patients")[0].plans[0].status).toBe("Billed"));
    expect(stored("patients")[0].plans[0].invoiceId).toBe(stored("invoices")[0].id);
  });

  it("odontogram: tap to mark, tap again to clear, and findings are summarised", async () => {
    localStorage.setItem(KEY("patients"), JSON.stringify([
      { id: "P-1", name: "Chart Patient", phone: "9876543210", age: "30", gender: "Male", toothConditions: {}, registeredDate: "01/11/2026" },
    ]));
    await openApp();
    nav("Patients & Odontogram");
    fireEvent.click(await screen.findByText("Chart Patient"));
    fireEvent.click(await screen.findByRole("radio", { name: /Caries/ }));
    const tooth16 = () => screen.getByLabelText(/^Tooth 16, Upper right first molar/);
    fireEvent.click(tooth16());
    await waitFor(() => expect(stored("patients")[0].toothConditions).toEqual({ 16: ["CAR"] }));
    expect(tooth16().getAttribute("aria-label")).toMatch(/Caries/);
    expect(screen.getByText(/teeth 16|tooth 16/)).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Restored/ }));
    fireEvent.keyDown(screen.getByLabelText(/^Tooth 26,/), { key: "Enter" });
    await waitFor(() => expect(stored("patients")[0].toothConditions[26]).toEqual(["RES"]));
    fireEvent.click(screen.getByRole("radio", { name: /Caries/ }));
    fireEvent.click(tooth16());
    await waitFor(() => expect(stored("patients")[0].toothConditions[16]).toBeUndefined());
  });

  it("odontogram: one tooth can hold several findings, and one can be removed on its own", async () => {
    localStorage.setItem(KEY("patients"), JSON.stringify([
      { id: "P-1", name: "Multi Patient", phone: "9876543210", age: "30", gender: "Male", toothConditions: { 36: "CAR" }, registeredDate: "01/11/2026" },
    ]));
    await openApp();
    nav("Patients & Odontogram");
    fireEvent.click(await screen.findByText("Multi Patient"));
    fireEvent.click(await screen.findByRole("radio", { name: /RCT Done/ }));
    fireEvent.click(screen.getByLabelText(/^Tooth 36,/));
    await waitFor(() => expect(stored("patients")[0].toothConditions[36]).toEqual(["CAR", "RCT"]));
    expect(screen.getByLabelText(/^Tooth 36,/).getAttribute("aria-label")).toMatch(/Caries \+ RCT Done/);
    fireEvent.click(screen.getByRole("button", { name: /Remove Caries from tooth 36/ }));
    await waitFor(() => expect(stored("patients")[0].toothConditions[36]).toEqual(["RCT"]));
  });

  it("plans can be suggested from the chart, and planned teeth show on the odontogram", async () => {
    localStorage.setItem(KEY("patients"), JSON.stringify([
      { id: "P-1", name: "Link Patient", phone: "9876543210", age: "30", gender: "Male", toothConditions: { 16: "CAR", 36: "SCL", 11: "RES" }, registeredDate: "01/11/2026" },
    ]));
    await openApp();
    nav("Patients & Odontogram");
    fireEvent.click(await screen.findByText("Link Patient"));
    fireEvent.click(await screen.findByText("Treatment Plan"));
    fireEvent.click(await screen.findByText(/New plan/i));
    fireEvent.click(screen.getByText("Suggest from chart"));
    expect(screen.getByLabelText("Plan item 1 tooth").value).toBe("16");
    expect(screen.getByLabelText("Plan item 2 tooth").value).toBe("36");
    expect(screen.queryByLabelText("Plan item 3 tooth")).toBeNull();
    type(screen.getByLabelText("Plan title"), "Phase 1");
    type(screen.getByLabelText("Plan item 1 amount"), "1200");
    type(screen.getByLabelText("Plan item 2 amount"), "800");
    type(screen.getByLabelText("Plan item 2 tooth"), "36, 77");
    fireEvent.click(screen.getByText("Save plan"));
    expect(await screen.findByText(/valid FDI numbers/i)).toBeTruthy();
    type(screen.getByLabelText("Plan item 2 tooth"), "36, 37");
    fireEvent.click(screen.getByText("Save plan"));
    await waitFor(() => expect(stored("patients")[0].plans?.length).toBe(1));
    fireEvent.click(screen.getByText("32-Tooth Odontogram"));
    expect(await screen.findByLabelText(/^Tooth 16,.*treatment planned/)).toBeTruthy();
    expect(screen.getByLabelText(/^Tooth 37,.*treatment planned/)).toBeTruthy();
    expect(screen.getByLabelText(/^Tooth 11, /).getAttribute("aria-label")).not.toMatch(/planned/);
  });

  it("invoice screen shows unpaid money by age and filters to unpaid, oldest first", async () => {
    const ago = (d) => new Date(Date.now() - d * 86400000).toLocaleDateString("en-IN");
    const mk = (id, d, totalP, paidP = 0) => ({
      id, patientId: "", patient: `Pt ${id}`, paymentMode: "Cash", provider: "Self Pay", claimId: "", status: "Self-Pay",
      treatment: "Scaling", subtotalP: totalP, discountP: 0, taxableP: totalP, gstRate: 0, cgstP: 0, sgstP: 0, taxP: 0, totalP,
      payments: paidP ? [{ date: ago(d), mode: "Cash", amountP: paidP }] : [], date: ago(d),
    });
    localStorage.setItem(KEY("invoices"), JSON.stringify([
      mk("INV/FRESH", 2, 100000), mk("INV/PAID", 3, 50000, 50000), mk("INV/OLD", 90, 250000),
    ]));
    await openApp();
    nav("Dental Insurance & Invoices");
    const panel = await screen.findByTestId("receivables");
    expect(within(panel).getByText("₹2,500.00").closest("button").textContent).toMatch(/Over 60 days/);
    expect(within(panel).getByText("₹1,000.00").closest("button").textContent).toMatch(/Up to 7 days/);
    expect(screen.getByText("INV/PAID")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Unpaid \(2\)/ }));
    expect(screen.queryByText("INV/PAID")).toBeNull();
    const rows = screen.getAllByRole("row").slice(1).map((r) => r.textContent);
    expect(rows[0]).toMatch(/INV\/OLD/);
    expect(rows[0]).toMatch(/90 days old/);
    expect(rows[1]).toMatch(/INV\/FRESH/);
    fireEvent.click(within(panel).getByText("₹2,500.00").closest("button"));
    expect(screen.queryByText("INV/FRESH")).toBeNull();
    expect(screen.getByText("INV/OLD")).toBeTruthy();
  });
});
