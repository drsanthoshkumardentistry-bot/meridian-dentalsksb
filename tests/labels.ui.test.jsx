import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import PatientLabels, { LabelChips } from "../src/components/PatientLabels.jsx";
import AftercareSender from "../src/components/AftercareSender.jsx";

afterEach(cleanup);

describe("label editor", () => {
  it("shows chosen labels pressed and reports taps", () => {
    const onToggle = vi.fn();
    render(<PatientLabels patient={{ labels: ["vip"] }} onToggle={onToggle} />);
    expect(screen.getByText(/VIP/).closest("button").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByText(/Child/));
    expect(onToggle).toHaveBeenCalledWith("child");
    expect(screen.getByText("1 of 5")).toBeTruthy();
  });
  it("shows coloured chips", () => {
    render(<LabelChips patient={{ labels: ["diabetic"] }} />);
    expect(screen.getByTestId("label-chips").textContent).toBe("Diabetic");
  });
});

describe("aftercare sender", () => {
  const base = { clinicName: "Smile", showToast: vi.fn() };
  it("pre-selects from the latest visit and previews in the patient's language", () => {
    render(<AftercareSender {...base} patient={{ id: "P1", name: "Asha", phone: "9876543210", language: "Tamil" }} latestVisitText="Extraction of 38" />);
    expect(screen.getByLabelText("Aftercare for").value).toBe("extraction");
    expect(screen.getByLabelText("Aftercare message preview").textContent).toMatch(/வணக்கம் Asha/);
  });
  it("will not open WhatsApp for a patient who has not agreed", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const toast = vi.fn();
    render(<AftercareSender clinicName="S" showToast={toast} patient={{ id: "P2", name: "B", phone: "9876543210", consent: { whatsapp: false } }} latestVisitText="Scaling" />);
    fireEvent.click(screen.getByText("Send on WhatsApp"));
    expect(open).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/not agreed/));
    open.mockRestore();
  });
  it("opens WhatsApp when the patient has agreed", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<AftercareSender {...base} patient={{ id: "P3", name: "C", phone: "9876543210", consent: { whatsapp: true } }} latestVisitText="Scaling" />);
    fireEvent.click(screen.getByText("Send on WhatsApp"));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/wa\.me\/919876543210\?text=/), "_blank", "noopener,noreferrer");
    open.mockRestore();
  });
});
