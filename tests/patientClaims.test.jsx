import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PatientClaims, ClaimsOverview } from "../src/components/PatientClaims.jsx";
import { recordSheetHtml } from "../src/recordSheet.js";

afterEach(cleanup);
const claim = { id: "C1", kind: "TPA", insurer: "Star <b>Health</b>", status: "Approved", date: "2026-11-20", claimedP: 500000, approvedP: 400000, settledP: 100000 };
describe("PatientClaims", () => {
  it("adds a claim from the form and shows validation errors", () => {
    const onSave = vi.fn();
    render(<PatientClaims patient={{ id: "P1" }} canWrite onSave={onSave} onRemove={() => {}} makeId={() => "C9"} />);
    fireEvent.click(screen.getByText("Add claim"));
    expect(screen.getByRole("alert").textContent).toMatch(/insurer/i);
    fireEvent.change(screen.getByLabelText("Insurer or TPA"), { target: { value: "Niva" } });
    fireEvent.change(screen.getByLabelText("Amount claimed (₹)"), { target: { value: "2500" } });
    fireEvent.click(screen.getByText("Add claim"));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({ id: "C9", insurer: "Niva", claimedP: 250000, status: "Pre-auth requested" });
  });
  it("lists claims with what is owed, and edits or removes them", () => {
    const onSave = vi.fn(); const onRemove = vi.fn();
    render(<PatientClaims patient={{ id: "P1", claims: [claim] }} canWrite onSave={onSave} onRemove={onRemove} makeId={() => "x"} />);
    expect(screen.getByText(/owed ₹3,000/)).toBeTruthy();
    fireEvent.click(screen.getByText("Update"));
    fireEvent.change(screen.getByLabelText("Amount settled (₹)"), { target: { value: "4000" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "Settled" } });
    fireEvent.click(screen.getByText("Save changes"));
    expect(onSave.mock.calls[0][0]).toMatchObject({ id: "C1", status: "Settled", settledP: 400000 });
    fireEvent.click(screen.getByText("Remove"));
    expect(onRemove).toHaveBeenCalledWith("C1");
  });
  it("is read-only without billing access", () => {
    render(<PatientClaims patient={{ id: "P1", claims: [claim] }} canWrite={false} onSave={() => {}} onRemove={() => {}} makeId={() => "x"} />);
    expect(screen.queryByText("Add a claim")).toBeNull();
    expect(screen.queryByText("Update")).toBeNull();
  });
});
describe("ClaimsOverview and record", () => {
  it("shows what insurers owe and opens the patient", () => {
    const onOpen = vi.fn();
    render(<ClaimsOverview patients={[{ id: "P1", name: "Asha", claims: [claim] }]} onOpen={onOpen} />);
    expect(screen.getByText(/Owed to the clinic ₹3,000/)).toBeTruthy();
    fireEvent.click(screen.getByText("Asha"));
    expect(onOpen).toHaveBeenCalledWith("P1");
  });
  it("renders nothing without claims", () => {
    const { container } = render(<ClaimsOverview patients={[{ id: "P1", name: "A" }]} onOpen={() => {}} />);
    expect(container.innerHTML).toBe("");
  });
  it("prints claims in the readable record with all text escaped", () => {
    const html = recordSheetHtml({ name: "Asha", claims: [claim] }, {}, {});
    expect(html).toContain("Insurance and TPA claims");
    expect(html).toContain("Star &lt;b&gt;Health&lt;/b&gt;");
    expect(html).not.toContain("<b>Health");
  });
});
