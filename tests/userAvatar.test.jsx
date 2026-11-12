import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import UserAvatar from "../src/components/UserAvatar.jsx";

afterEach(cleanup);

describe("UserAvatar", () => {
  it("shows the Google photo when there is one", () => {
    render(<UserAvatar user={{ photoURL: "https://lh3.googleusercontent.com/a/x", displayName: "Santhosh" }} />);
    expect(screen.getByTestId("user-photo").getAttribute("src")).toContain("googleusercontent");
    expect(screen.getByTestId("user-photo").getAttribute("referrerpolicy")).toBe("no-referrer");
  });
  it("falls back to the first letter without a photo or when it fails to load", () => {
    const { rerender } = render(<UserAvatar user={{ displayName: "santhosh" }} />);
    expect(screen.getByTestId("user-initial").textContent).toBe("S");
    rerender(<UserAvatar user={{ photoURL: "https://x/y.jpg", email: "a@b.c" }} />);
    fireEvent.error(screen.getByTestId("user-photo"));
    expect(screen.getByTestId("user-initial").textContent).toBe("A");
  });
});
