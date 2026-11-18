import React, { useState } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import MoneyInput, { stepMoney } from "../src/components/MoneyInput.jsx";

afterEach(cleanup);
const Box = ({ start = "" }) => { const [v, setV] = useState(start); return <MoneyInput aria-label="Fee" value={v} onChange={(e) => setV(e.target.value)} />; };

describe("MoneyInput", () => {
  it("steps by ten rupees and never below zero", () => {
    expect(stepMoney("678.33", 1)).toBe("688.33");
    expect(stepMoney("", 1)).toBe("10");
    expect(stepMoney("5", -1)).toBe("0");
    expect(stepMoney("abc", 1)).toBe("10");
  });
  it("the arrows and keyboard add or take off ten, and typing still works", () => {
    render(<Box start="100" />);
    const input = screen.getByLabelText("Fee");
    fireEvent.click(screen.getByRole("button", { name: "Add 10 rupees" }));
    expect(input.value).toBe("110");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("120");
    fireEvent.click(screen.getByRole("button", { name: "Take off 10 rupees" }));
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.value).toBe("100");
    fireEvent.change(input, { target: { value: "678.33" } });
    expect(input.value).toBe("678.33");
  });
});
