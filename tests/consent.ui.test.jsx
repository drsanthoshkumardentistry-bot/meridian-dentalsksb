import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import ConsentForms from "../src/components/ConsentForms.jsx";
import { PNG_PREFIX } from "../src/consent.js";

const SIG = PNG_PREFIX + "A".repeat(400);
beforeEach(() => {
  const ctx = { clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(SIG);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const patient = (o = {}) => ({ id: "P1", name: "Asha Devi", consents: [], ...o });
const profile = { name: "Smile Care", drName: "Dr Rao" };
const mount = (props = {}) => {
  const onChange = vi.fn(); const onSigned = vi.fn(); const onPrint = vi.fn();
  render(<ConsentForms patient={patient()} profile={profile} newId={() => "C1"} onChange={onChange} onSigned={onSigned} onPrint={onPrint} {...props} />);
  return { onChange, onSigned, onPrint };
};
const sign = () => { const pad = screen.getByRole("img", { name: /Signature box/ }); fireEvent.pointerDown(pad); fireEvent.pointerMove(pad); fireEvent.pointerUp(pad); };

describe("ConsentForms", () => {
  it("starts with the patient's name and the doctor and clinic in the wording", () => {
    mount();
    expect(screen.getByLabelText("Patient's name").value).toBe("Asha Devi");
    expect(screen.getByLabelText(/Wording the patient will sign/).value).toContain("Dr Rao at Smile Care");
  });
  it("fills the teeth into the wording until the text is edited by hand", () => {
    mount();
    fireEvent.change(screen.getByLabelText("Consent for"), { target: { value: "extraction" } });
    fireEvent.change(screen.getByLabelText("Teeth (optional)"), { target: { value: "18" } });
    expect(screen.getByLabelText(/Wording the patient will sign/).value).toContain("have tooth 18 removed");
    fireEvent.change(screen.getByLabelText(/Wording the patient will sign/), { target: { value: "My own wording for this treatment, long enough to be saved as a consent." } });
    fireEvent.change(screen.getByLabelText("Teeth (optional)"), { target: { value: "28" } });
    expect(screen.getByLabelText(/Wording the patient will sign/).value).toContain("My own wording");
  });
  it("will not save without a signature or the confirmation", () => {
    const { onChange } = mount();
    fireEvent.click(screen.getByRole("button", { name: "Save signed consent" }));
    expect(screen.getByRole("alert").textContent).toMatch(/sign in the box/);
    sign();
    fireEvent.click(screen.getByRole("button", { name: "Save signed consent" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Confirm/);
    expect(onChange).not.toHaveBeenCalled();
  });
  it("saves a signed consent, tells the activity log, and clears the form", () => {
    const { onChange, onSigned } = mount();
    sign();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Save signed consent" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const saved = onChange.mock.calls[0][0][0];
    expect(saved).toMatchObject({ id: "C1", signerName: "Asha Devi", signerRole: "patient", doctor: "Dr Rao", clinic: "Smile Care", signature: SIG });
    expect(onSigned).toHaveBeenCalledWith(expect.objectContaining({ id: "C1" }));
    expect(screen.getByRole("checkbox").checked).toBe(false);
  });
  it("needs a guardian's name and relationship for a minor", () => {
    const { onChange } = mount();
    fireEvent.click(screen.getByRole("radio", { name: "A parent or guardian" }));
    expect(screen.getByLabelText("Guardian's name").value).toBe("");
    fireEvent.change(screen.getByLabelText("Guardian's name"), { target: { value: "Ramesh" } });
    sign();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Save signed consent" }));
    expect(screen.getByRole("alert").textContent).toMatch(/relationship/);
    fireEvent.change(screen.getByLabelText("Relationship to the patient"), { target: { value: "Father" } });
    fireEvent.click(screen.getByRole("button", { name: "Save signed consent" }));
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ signerRole: "guardian", signerName: "Ramesh", relation: "Father" });
  });
  it("clearing the pad removes the signature", () => {
    const { onChange } = mount();
    sign();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Save signed consent" }));
    expect(screen.getByRole("alert").textContent).toMatch(/sign in the box/);
    expect(onChange).not.toHaveBeenCalled();
  });
  it("lists signed consents, shows the wording and signature, and prints", () => {
    const c = { id: "C9", title: "Tooth extraction", teeth: "18", text: "I agree to the extraction of tooth 18.", signerRole: "guardian", signerName: "Ramesh", relation: "Father", signature: SIG, signedAt: "2026-11-11T08:00:00Z", doctor: "Dr Rao" };
    const { onPrint } = mount({ patient: patient({ consents: [c] }) });
    const list = within(screen.getByRole("region", { name: "Signed consents" }));
    expect(list.getByText(/Signed by Ramesh \(Father, guardian\)/)).toBeTruthy();
    fireEvent.click(list.getByRole("button", { name: "View" }));
    expect(list.getByText("I agree to the extraction of tooth 18.")).toBeTruthy();
    expect(list.getByAltText("Signature of Ramesh").getAttribute("src")).toBe(SIG);
    fireEvent.click(list.getByRole("button", { name: "Print" }));
    expect(onPrint).toHaveBeenCalledWith(c);
  });
  it("is view-only without write access", () => {
    mount({ canWrite: false, patient: patient() });
    expect(screen.queryByRole("button", { name: "Save signed consent" })).toBeNull();
    expect(screen.getByText(/No signed consent on file/)).toBeTruthy();
  });
});
