import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { usePaged } from "../src/usePaged.js";
import ShowMore from "../src/components/ShowMore.jsx";

const list = Array.from({ length: 120 }, (_, i) => `row ${i}`);
function Demo({ reset = "a", items = list }) {
  const page = usePaged(items, reset);
  return (<div><ul>{page.shown.map((r) => <li key={r}>{r}</li>)}</ul><ShowMore paged={page} noun="rows" /></div>);
}

afterEach(cleanup);

describe("usePaged + ShowMore", () => {
  it("shows 50 first, then 50 more, then the rest", () => {
    render(<Demo />);
    expect(screen.getAllByRole("listitem")).toHaveLength(50);
    fireEvent.click(screen.getByText(/Show 50 more rows \(70 not shown yet\)/));
    expect(screen.getAllByRole("listitem")).toHaveLength(100);
    fireEvent.click(screen.getByText(/Show 20 more rows \(20 not shown yet\)/));
    expect(screen.getAllByRole("listitem")).toHaveLength(120);
    expect(screen.queryByText(/Show .* more rows/)).toBeNull();
  });
  it("starts again from 50 when the filter changes", () => {
    const { rerender } = render(<Demo reset="a" />);
    fireEvent.click(screen.getByText(/Show 50 more rows/));
    expect(screen.getAllByRole("listitem")).toHaveLength(100);
    rerender(<Demo reset="b" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(50);
  });
  it("shows a short list in full with no button", () => {
    render(<Demo items={list.slice(0, 10)} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
