import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import DocLog from "../src/components/DocLog.jsx";
import { dateKey } from "../src/reminders.js";

afterEach(() => cleanup());

const today = dateKey();
const makeApi = (seed = {}) => {
  const db = { clinics: [...(seed.clinics || [])], visits: [...(seed.visits || [])], profile: seed.profile || null };
  const dl = {
    listClinics: vi.fn(async () => [...db.clinics]),
    listVisits: vi.fn(async () => [...db.visits]),
    saveClinic: vi.fn(async (c) => { db.clinics = [...db.clinics.filter((x) => x.id !== c.id), c]; }),
    deleteClinic: vi.fn(async (id) => { db.clinics = db.clinics.filter((x) => x.id !== id); }),
    saveVisit: vi.fn(async (v) => { db.visits = [...db.visits.filter((x) => x.id !== v.id), v]; }),
    saveVisits: vi.fn(async (vs) => { vs.forEach((v) => { db.visits = [...db.visits.filter((x) => x.id !== v.id), v]; }); }),
    deleteVisit: vi.fn(async (id) => { db.visits = db.visits.filter((x) => x.id !== id); }),
    getProfile: vi.fn(async () => db.profile),
    saveProfile: vi.fn(async (p) => { db.profile = p; }),
  };
  return { api: { docLog: dl }, dl, db };
};
const clinic = { id: "C1", name: "Sri Sai Dental", place: "Pollachi", defaultFeeP: 350000, sharePct: 0 };
const visit = (over = {}) => ({
  id: "V1", clinicId: "C1", clinicName: "Sri Sai Dental", clinicPlace: "Pollachi", date: today, patient: "Ramesh K", age: 45, phone: "", treatment: "RCT",
  tooth: "36", done: "Obturation", status: "inprogress", nextVisit: "", feeP: 350000, receivedP: 0, payMode: "", note: "", createdAt: "2026-11-12T10:00:00.000Z", updatedAt: "2026-11-12T10:00:00.000Z", ...over,
});
const type = (el, value) => fireEvent.change(el, { target: { value } });
const mount = (seed) => { const m = makeApi(seed); render(<DocLog api={m.api} showToast={vi.fn()} />); return m; };

describe("MeriDent DocLog screen", () => {
  it("starts empty and asks for a clinic first", async () => {
    mount();
    expect(await screen.findByTestId("doclog-empty")).toBeTruthy();
    fireEvent.click(screen.getByText("Add your first clinic"));
    expect(await screen.findByRole("dialog", { name: "My clinics" })).toBeTruthy();
  });

  it("adds a clinic, then logs a visit with the usual fee filled in and shows it with its payment state", async () => {
    const { dl } = mount();
    fireEvent.click(await screen.findByText("Add your first clinic"));
    fireEvent.click(screen.getByText("Add clinic"));
    expect(await screen.findByText("Enter the clinic name.")).toBeTruthy();
    type(screen.getByLabelText("Clinic name"), "Sri Sai Dental");
    type(screen.getByLabelText("Place"), "Pollachi");
    type(screen.getByLabelText(/Usual fee per visit/), "3500");
    fireEvent.click(screen.getByText("Add clinic"));
    await waitFor(() => expect(dl.saveClinic).toHaveBeenCalledTimes(1));
    expect(dl.saveClinic.mock.calls[0][0]).toMatchObject({ name: "Sri Sai Dental", defaultFeeP: 350000 });
    fireEvent.click(screen.getByLabelText("Close"));

    fireEvent.click(screen.getByText("Add visit"));
    const dlg = await screen.findByRole("dialog", { name: "Add visit" });
    expect(within(dlg).getByLabelText(/Fee for this visit/).value).toBe("3500");
    fireEvent.click(within(dlg).getByText("Save visit"));
    expect(await within(dlg).findByText("Choose the treatment.")).toBeTruthy();
    fireEvent.click(within(dlg).getByText("RCT"));
    type(within(dlg).getByLabelText("Patient (name or initials)"), "Ramesh K");
    type(within(dlg).getByLabelText("Tooth (optional)"), "36");
    expect(within(dlg).getByTestId("pay-preview").textContent).toMatch(/Payment pending · ₹3,500 to receive/);
    fireEvent.click(within(dlg).getByText("Half"));
    expect(within(dlg).getByTestId("pay-preview").textContent).toMatch(/Part paid · ₹1,750 to receive/);
    fireEvent.click(within(dlg).getByText("Save visit"));
    await waitFor(() => expect(dl.saveVisit).toHaveBeenCalledTimes(1));
    expect(dl.saveVisit.mock.calls[0][0]).toMatchObject({ clinicId: dl.saveClinic.mock.calls[0][0].id, treatment: "RCT", patient: "Ramesh K", feeP: 350000, receivedP: 175000, payMode: "cash" });
    const list = await screen.findByTestId("doclog-list");
    expect(list.textContent).toMatch(/Ramesh K/);
    expect(list.textContent).toMatch(/Part paid · ₹1,750 left/);
    expect(screen.getByTestId("summary-pending").textContent).toBe("₹1,750");
  });

  it("shows money owed by clinic and spreads a recorded payment over the oldest visits", async () => {
    const { dl } = mount({
      clinics: [clinic],
      visits: [visit({ id: "A", date: "2026-10-01", feeP: 300000 }), visit({ id: "B", date: today, feeP: 200000 })],
    });
    const dues = await screen.findByTestId("dues");
    expect(dues.textContent).toMatch(/Sri Sai Dental · ₹5,000/);
    fireEvent.click(within(dues).getByText("Record payment"));
    const dlg = await screen.findByRole("dialog", { name: /Received from Sri Sai Dental/ });
    type(within(dlg).getByLabelText(/Amount received/), "9000");
    fireEvent.click(within(dlg).getByText("Save payment"));
    expect(await within(dlg).findByText(/owes ₹5,000/)).toBeTruthy();
    type(within(dlg).getByLabelText(/Amount received/), "3500");
    fireEvent.click(within(dlg).getByText("Save payment"));
    await waitFor(() => expect(dl.saveVisits).toHaveBeenCalledTimes(1));
    const changed = dl.saveVisits.mock.calls[0][0];
    expect(changed.map((v) => [v.id, v.receivedP])).toEqual([["A", 300000], ["B", 50000]]);
    await waitFor(() => expect(screen.getByTestId("dues").textContent).toMatch(/₹1,500/));
  });

  it("lists the next visit under Coming up and pre-fills the form from it", async () => {
    const next = dateKey(new Date(Date.now() + 86400000));
    mount({ clinics: [clinic], visits: [visit({ nextVisit: next })] });
    const up = await screen.findByTestId("coming-up");
    expect(up.textContent).toMatch(/Tomorrow/);
    expect(up.textContent).toMatch(/visit 2/);
    fireEvent.click(within(up).getByText("Log this visit"));
    const dlg = await screen.findByRole("dialog", { name: "Add visit" });
    expect(within(dlg).getByLabelText("Patient (name or initials)").value).toBe("Ramesh K");
    expect(within(dlg).getByLabelText("Tooth (optional)").value).toBe("36");
    expect(within(dlg).getByText("RCT").getAttribute("aria-pressed")).toBe("true");
  });

  it("filters the list and deletes a visit only after a second tap", async () => {
    const { dl } = mount({ clinics: [clinic], visits: [visit(), visit({ id: "V2", patient: "Anitha M", treatment: "Implant", status: "completed", feeP: 100000, receivedP: 100000 })] });
    const list = await screen.findByTestId("doclog-list");
    expect(list.textContent).toMatch(/Ramesh K/);
    fireEvent.click(screen.getByRole("button", { name: "Completed" }));
    expect(screen.getByTestId("doclog-list").textContent).not.toMatch(/Ramesh K/);
    expect(screen.getByTestId("doclog-list").textContent).toMatch(/Anitha M/);
    type(screen.getByLabelText("Search"), "zzz");
    expect(screen.getByTestId("doclog-none")).toBeTruthy();
    type(screen.getByLabelText("Search"), "");
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.click(screen.getAllByLabelText(/Delete visit/)[0]);
    expect(dl.deleteVisit).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByText("Delete"));
    await waitFor(() => expect(dl.deleteVisit).toHaveBeenCalledTimes(1));
  });

  it("asks for a speciality, saves the profile and shows that speciality's treatments", async () => {
    const { dl } = mount({ clinics: [clinic] });
    fireEvent.click(await screen.findByTestId("doclog-set-profile"));
    const dlg = await screen.findByRole("dialog", { name: "My profile" });
    fireEvent.click(within(dlg).getByText("Save profile"));
    expect(within(dlg).getByRole("alert").textContent).toMatch(/Choose your speciality/);
    type(within(dlg).getByLabelText("Speciality"), "orthodontics");
    fireEvent.click(within(dlg).getByText("Save profile"));
    await waitFor(() => expect(dl.saveProfile).toHaveBeenCalledWith({ name: "", qualification: "", specialty: "orthodontics" }));
    expect((await screen.findByTestId("doclog-profile")).textContent).toMatch(/Orthodontics/);
    fireEvent.click(screen.getByText("Add visit"));
    const form = await screen.findByRole("dialog", { name: "Add visit" });
    expect(within(form).getByRole("button", { name: "Braces fixing" })).toBeTruthy();
    expect(within(form).queryByRole("button", { name: "RCT" })).toBeNull();
  });

  it("shows a retry when the cloud cannot be reached, and a sign-in notice without an api", async () => {
    const dl = { listClinics: vi.fn(async () => { throw new Error("offline"); }), listVisits: vi.fn(async () => []) };
    render(<DocLog api={{ docLog: dl }} showToast={vi.fn()} />);
    expect(await screen.findByText(/Could not open MeriDent DocLog/)).toBeTruthy();
    cleanup();
    render(<DocLog api={{}} showToast={vi.fn()} />);
    expect(screen.getByText(/needs you to be signed in/)).toBeTruthy();
  });
});
