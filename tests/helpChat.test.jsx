import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(cleanup);

vi.mock("../src/aiClient.js", () => ({
  askAi: vi.fn(async () => ({ text: "1. Open Patients & Odontogram\n2. Tap Add Patient" })),
}));
import { askAi } from "../src/aiClient.js";
import HelpChat from "../src/components/HelpChat.jsx";

describe("Help chat", () => {
  it("opens from the bottom right button and answers a starter question", async () => {
    render(<HelpChat />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByLabelText("Open MeriDent AI help"));
    fireEvent.click(screen.getByText("How do I add a patient?"));
    await waitFor(() => expect(screen.getByText(/Tap Add Patient/)).toBeTruthy());
    expect(askAi).toHaveBeenCalledWith({ task: "help", messages: [{ role: "user", content: "How do I add a patient?" }] });
  });
  it("shows the error text when the AI is off", async () => {
    askAi.mockRejectedValueOnce(new Error("MeriDent AI is not switched on for this site yet."));
    render(<HelpChat />);
    fireEvent.click(screen.getByLabelText("Open MeriDent AI help"));
    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "hello there" } });
    fireEvent.click(screen.getByLabelText("Send question"));
    await waitFor(() => expect(screen.getByText(/not switched on/)).toBeTruthy());
  });
});
