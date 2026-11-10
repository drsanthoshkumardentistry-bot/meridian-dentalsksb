import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import PlanApproval from "../src/components/PlanApproval.jsx";
import TreatmentPlans from "../src/components/TreatmentPlans.jsx";
import { createPlan, buildShareDoc } from "../src/plans.js";

afterEach(() => cleanup());

const plan = createPlan({
  id: "PL-1", title: "Smile makeover",
  items: [{ id: "a", description: "Root canal", tooth: "46", amount: "5000", taxCategory: "therapeutic" }],
});
const patient = { id: "P-1", name: "Asha Devi", phone: "9876543210" };
const shareDoc = (over = {}) => ({ ...buildShareDoc({ plan, patient, profile: { name: "Smile Clinic" }, clinicId: "u1" }), ...over });

describe("patient approval page", () => {
  it("shows the estimate, requires a name to approve, then confirms", async () => {
    const submit = vi.fn(async () => {});
    render(<PlanApproval token="t" loadShare={async () => shareDoc()} submitDecision={submit} />);
    expect(await screen.findByText(/Asha, your treatment estimate/)).toBeTruthy();
    expect(screen.getByText("Smile Clinic")).toBeTruthy();
    expect(screen.getByText("₹5,000.00", { selector: "span" })).toBeTruthy();
    fireEvent.click(screen.getByText("I approve this plan"));
    expect(await screen.findByText(/Type your full name/)).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Your full name/), { target: { value: "Asha Devi" } });
    fireEvent.click(screen.getByText("I approve this plan"));
    await waitFor(() => expect(submit).toHaveBeenCalledWith("t", "approved", "Asha Devi"));
    expect(await screen.findByText(/You approved this plan/)).toBeTruthy();
    expect(screen.queryByText("I decline")).toBeNull();
  });

  it("declining needs no name", async () => {
    const submit = vi.fn(async () => {});
    render(<PlanApproval token="t" loadShare={async () => shareDoc()} submitDecision={submit} />);
    fireEvent.click(await screen.findByText("I decline"));
    await waitFor(() => expect(submit).toHaveBeenCalledWith("t", "declined", ""));
    expect(await screen.findByText(/You declined this plan/)).toBeTruthy();
  });

  it("handles missing, expired, already answered and failing links", async () => {
    const { unmount } = render(<PlanApproval token="t" loadShare={async () => null} submitDecision={vi.fn()} />);
    expect(await screen.findByText(/not valid/)).toBeTruthy();
    unmount();
    const r2 = render(<PlanApproval token="t" loadShare={async () => shareDoc({ expiresAt: new Date("2020-01-01") })} submitDecision={vi.fn()} />);
    expect(await screen.findByText(/has expired/)).toBeTruthy();
    expect(screen.queryByText("I approve this plan")).toBeNull();
    r2.unmount();
    const r3 = render(<PlanApproval token="t" loadShare={async () => shareDoc({ decision: "approved" })} submitDecision={vi.fn()} />);
    expect(await screen.findByText(/You approved this plan/)).toBeTruthy();
    r3.unmount();
    render(<PlanApproval token="t" loadShare={async () => { throw new Error("x"); }} submitDecision={vi.fn()} />);
    expect(await screen.findByText(/could not open/)).toBeTruthy();
  });

  it("keeps the buttons and shows a message when saving fails", async () => {
    render(<PlanApproval token="t" loadShare={async () => shareDoc()} submitDecision={async () => { throw new Error("net"); }} />);
    fireEvent.click(await screen.findByText("I decline"));
    expect(await screen.findByText(/could not save your answer/i)).toBeTruthy();
    expect(screen.getByText("I decline")).toBeTruthy();
  });
});

describe("clinic side of the approval link", () => {
  const setup = (patientPlans, api) => {
    const onChange = vi.fn();
    const toast = vi.fn();
    render(
      <TreatmentPlans
        patient={{ ...patient, plans: patientPlans }}
        practiceProfile={{ name: "Smile Clinic" }}
        onChange={onChange}
        onBill={() => {}}
        showToast={toast}
        clinicId="u1"
        shareApi={api}
      />
    );
    return { onChange, toast };
  };

  it("creates a share document with a token and stores the token on the plan", async () => {
    const create = vi.fn(async () => {});
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { onChange } = setup([plan], { enabled: true, create, fetch: vi.fn(), remove: vi.fn() });
    fireEvent.click(screen.getByText("Send approval link"));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    const [token, doc] = create.mock.calls[0];
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(doc.clinicId).toBe("u1");
    expect(doc.patientFirstName).toBe("Asha");
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0][0][0].shareToken).toBe(token);
    await waitFor(() => expect(open).toHaveBeenCalled());
    expect(decodeURIComponent(open.mock.calls[0][0])).toContain(`?plan=${token}`);
    open.mockRestore();
  });

  it("applies the patient's answer when the tab opens", async () => {
    const waiting = { ...plan, shareToken: "tok" };
    const fetch = vi.fn(async () => ({ decision: "approved", decidedName: "Asha Devi" }));
    const { onChange } = setup([waiting], { enabled: true, create: vi.fn(), fetch, remove: vi.fn() });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const updated = onChange.mock.calls[0][0][0];
    expect(updated.status).toBe("Approved");
    expect(updated.decidedBy).toBe("Asha Devi (online)");
  });

  it("explains when links are unavailable offline", async () => {
    const { toast } = setup([plan], { enabled: false });
    fireEvent.click(screen.getByText("Send approval link"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringMatching(/signed in and online/)));
  });
});
