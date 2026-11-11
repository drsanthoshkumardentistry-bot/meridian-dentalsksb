import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import PatientSummary from "../src/components/PatientSummary.jsx";
import PhysicianConsult from "../src/components/PhysicianConsult.jsx";

afterEach(cleanup);

describe("Patient summary", () => {
  it("shows the last physician consult and last visit", () => {
    const patient = { id: "P1", name: "Asha", conditions: "Diabetes", allergies: "", visits: [{ id: "v", date: "2026-10-15", complaint: "Pain", treatment: "RCT" }], physician: { name: "Ramesh", lastConsultDate: "2026-10-01", reason: "Sugar review", clearance: "Fit for dental treatment" } };
    render(<PatientSummary patient={patient} appointments={[]} invoices={[]} now={new Date(2026, 10, 11, 12)} />);
    const box = screen.getByTestId("patient-history");
    expect(box.textContent).toMatch(/15\/10\/2026/);
    expect(box.textContent).toMatch(/Last physician consult/);
    expect(box.textContent).toMatch(/Dr Ramesh/);
    expect(box.textContent).toMatch(/Sugar review/);
    expect(box.textContent).toMatch(/Not asked yet/);
  });
});

describe("Physician form", () => {
  it("saves what is typed on the patient", () => {
    const onChange = vi.fn();
    render(<PhysicianConsult patient={{ id: "P1", conditions: "Diabetes" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Physician name"), { target: { value: "Dr Ramesh" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: "Dr Ramesh" }));
    fireEvent.change(screen.getByLabelText("Last physician consultation date (dd/mm/yyyy)"), { target: { value: "01102026" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ lastConsultDate: "2026-10-01" }));
    fireEvent.change(screen.getByLabelText("Physician clearance"), { target: { value: "Needs physician advice first" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ clearance: "Needs physician advice first" }));
  });
  it("warns when a patient with a condition has no consult on record", () => {
    render(<PhysicianConsult patient={{ id: "P1", conditions: "Diabetes" }} onChange={() => {}} />);
    expect(screen.getByTestId("physician-consult").textContent).toMatch(/Ask, as this patient has a medical condition/);
  });
});
