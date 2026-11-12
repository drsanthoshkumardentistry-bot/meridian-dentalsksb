import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ReferralPanel from "../src/components/ReferralPanel.jsx";

afterEach(cleanup);
describe("ReferralPanel", () => {
  it("adds a referral and shows an error when the treatment is missing", () => {
    const onAdd = vi.fn();
    render(<ReferralPanel referrals={[]} onAdd={onAdd} onStatus={() => {}} onRemove={() => {}} onPrint={() => {}} newId={() => "R9"} today={() => "12/11/2026"} />);
    fireEvent.click(screen.getByRole("button", { name: "Add referral" }));
    expect(screen.getByRole("alert").textContent).toMatch(/treatment/i);
    fireEvent.change(screen.getByLabelText("Treatment needed"), { target: { value: "Extraction" } });
    fireEvent.click(screen.getByRole("button", { name: "Add referral" }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: "R9", treatment: "Extraction", status: "Pending" }));
  });
  it("changes status and prints", () => {
    const onStatus = vi.fn(), onPrint = vi.fn();
    const r = { id: "R1", treatment: "Scaling", toothRegion: "U/L", department: "Periodontics", roomNo: "Room 3", status: "Pending", date: "12/11/2026" };
    render(<ReferralPanel referrals={[r]} onAdd={() => {}} onStatus={onStatus} onRemove={() => {}} onPrint={onPrint} newId={() => "x"} today={() => ""} />);
    fireEvent.change(screen.getByLabelText("Status of referral for Scaling"), { target: { value: "Seen" } });
    expect(onStatus).toHaveBeenCalledWith("R1", "Seen");
    fireEvent.click(screen.getByLabelText("Print referral slip for Scaling"));
    expect(onPrint).toHaveBeenCalledWith(r);
  });
});
