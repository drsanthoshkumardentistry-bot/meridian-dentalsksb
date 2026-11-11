import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../src/aiClient.js", () => ({
  askAi: vi.fn(async () => ({ text: "நல்ல விளக்கம்" })),
  LANGUAGE_WORD: { en: "English", ta: "Tamil", hi: "Hindi" },
}));
import { askAi } from "../src/aiClient.js";
import TreatmentPlans from "../src/components/TreatmentPlans.jsx";

const patient = {
  id: "P1", name: "Test", phone: "9876543210", language: "Tamil",
  plans: [{ id: "PL1", title: "RCT", status: "Proposed", discount: 0, items: [{ id: "i1", description: "Root canal", tooth: "36", amount: 4500, taxCategory: "therapeutic" }] }],
};
const base = { patient, onChange: () => {}, onBill: () => {}, showToast: vi.fn(), clinicId: "c" };

describe("Explain plan with AI", () => {
  it("is hidden until the clinic switches AI on", () => {
    render(<TreatmentPlans {...base} practiceProfile={{}} />);
    expect(screen.queryByText(/Explain for patient/)).toBeNull();
  });
  it("asks in the patient's language and shows an editable draft", async () => {
    render(<TreatmentPlans {...base} practiceProfile={{ aiEnabled: true }} />);
    fireEvent.click(screen.getByText(/Explain for patient/));
    await waitFor(() => expect(screen.getByLabelText("AI explanation for the patient").value).toBe("நல்ல விளக்கம்"));
    expect(askAi).toHaveBeenCalledWith(expect.objectContaining({ task: "plan_explain", language: "Tamil" }));
    const sent = askAi.mock.calls[0][0];
    expect(JSON.stringify(sent)).not.toMatch(/9876543210|Test/);
  });
});
