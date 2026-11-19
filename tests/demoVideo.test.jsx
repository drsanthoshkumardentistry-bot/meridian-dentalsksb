import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import LandingPage from "../src/components/landingpage.jsx";

describe("landing demo video", () => {
  it("shows the demo video with a Tamil link, and the files exist", () => {
    render(<LandingPage onGetStarted={() => {}} onSignIn={() => {}} />);
    const v = screen.getByTestId("demo-video");
    expect(v.getAttribute("preload")).toBe("none");
    expect(screen.getByRole("link", { name: /Tamil captions/ }).getAttribute("href")).toBe("/demo/merident-demo-ta.mp4");
    for (const f of ["merident-demo-en.mp4", "merident-demo-ta.mp4", "merident-demo-poster.jpg"]) expect(fs.existsSync("public/demo/" + f)).toBe(true);
  });
});
