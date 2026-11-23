import { describe, it, expect, vi, afterEach } from "vitest";
import React, { useState } from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { isLogoDataUrl, logoFormat, fitInside, logoFromFile, MAX_LOGO_CHARS } from "../src/clinicLogo.js";
import ClinicLogoField from "../src/components/ClinicLogoField.jsx";
import { buildPrescriptionPdf } from "../src/prescriptionPdf.js";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("clinic logo rules", () => {
  it("accepts only small PNG or JPEG data URLs", () => {
    expect(isLogoDataUrl(PNG)).toBe(true);
    expect(isLogoDataUrl("data:image/jpeg;base64,/9j/4AAQ")).toBe(true);
    for (const bad of ["", null, undefined, 5, "data:image/svg+xml;base64,PHN2Zz4=", "data:text/html;base64,PGI+", "https://x.in/a.png",
      'data:image/png;base64,AA"onerror="x', "data:image/png;base64," + "A".repeat(MAX_LOGO_CHARS)]) expect(isLogoDataUrl(bad)).toBe(false);
  });
  it("tells jsPDF the format, or nothing", () => {
    expect(logoFormat(PNG)).toBe("PNG");
    expect(logoFormat("data:image/jpeg;base64,/9j/4AAQ")).toBe("JPEG");
    expect(logoFormat("data:image/svg+xml;base64,AA==")).toBe("");
  });
  it("fits a logo inside a box without stretching it", () => {
    expect(fitInside(200, 100, 26, 26)).toEqual({ w: 26, h: 13 });
    expect(fitInside(50, 100, 26, 26)).toEqual({ w: 13, h: 26 });
    expect(fitInside(0, 10, 26, 26)).toEqual({ w: 0, h: 0 });
  });
  const fakeDoc = (url) => ({ createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: vi.fn() }), toDataURL: vi.fn(() => url) }) });
  const bitmap = (w, h) => vi.fn(async () => ({ width: w, height: h, close: vi.fn() }));
  it("shrinks a big picture and returns a valid data URL", async () => {
    const doc = fakeDoc(PNG);
    const r = await logoFromFile({ type: "image/png", size: 1000 }, { doc, makeBitmap: bitmap(2000, 1000) });
    expect(r.dataUrl).toBe(PNG);
  });
  it("refuses other file types, huge files and unreadable pictures with a plain message", async () => {
    expect((await logoFromFile({ type: "image/svg+xml", size: 10 })).error).toMatch(/PNG or JPEG/);
    expect((await logoFromFile(null)).error).toMatch(/PNG or JPEG/);
    expect((await logoFromFile({ type: "image/png", size: 9 * 1024 * 1024 }, { doc: fakeDoc(PNG), makeBitmap: bitmap(1, 1) })).error).toMatch(/too big/);
    expect((await logoFromFile({ type: "image/png", size: 10 }, { doc: fakeDoc(PNG), makeBitmap: vi.fn(async () => { throw new Error("x"); }) })).error).toMatch(/Could not read/);
    expect((await logoFromFile({ type: "image/png", size: 10 }, { doc: fakeDoc("data:text/html,x"), makeBitmap: bitmap(10, 10) })).error).toMatch(/too big/);
  });
});

describe("logo picker", () => {
  afterEach(cleanup);
  const Host = () => { const [v, setV] = useState(""); return <><ClinicLogoField value={v} onChange={setV} /><output data-testid="val">{v}</output></>; };
  it("shows an error for a wrong file type and can remove a saved logo", async () => {
    const { container } = render(<Host />);
    const input = screen.getByTestId("clinic-logo-input");
    fireEvent.change(input, { target: { files: [new File(["x"], "a.svg", { type: "image/svg+xml" })] } });
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/PNG or JPEG/));
    expect(screen.getByTestId("val").textContent).toBe("");
    expect(container.querySelector("img")).toBeNull();
  });
  it("shows a saved logo with Change and Remove", () => {
    const Saved = () => { const [v, setV] = useState(PNG); return <><ClinicLogoField value={v} onChange={setV} /><output data-testid="val">{v}</output></>; };
    const { container } = render(<Saved />);
    expect(container.querySelector("img").getAttribute("src")).toBe(PNG);
    expect(screen.getByText("Change logo")).toBeTruthy();
    fireEvent.click(screen.getByText("Remove"));
    expect(screen.getByTestId("val").textContent).toBe("");
    expect(screen.getByText("Add clinic logo")).toBeTruthy();
  });
});

describe("prescription with the clinic logo and profile details", () => {
  const patient = { name: "Asha K", prescriptions: [{ id: "1", drug: "Zerodol-SP", frequency: "1-0-1", duration: "3 Days" }] };
  const profile = { name: "Smile Clinic", tagline: "Gentle care for every smile", drName: "Dr A", qualification: "BDS", dentalCouncil: "Tamil Nadu Dental Council",
    councilRegNumber: "TN-123", regNumber: "CL-77", address: "12 Main Road", city: "Coimbatore", pincode: "641001", state: "Tamil Nadu", phone: "9000000000", email: "a@b.in" };
  const text = async (p) => { const d = await buildPrescriptionPdf(patient, p, { date: "23/11/2026" }); return String.fromCharCode(...new Uint8Array(d.output("arraybuffer"))); };
  it("prints the logo image and the fuller clinic details", async () => {
    const withLogo = await text({ ...profile, logo: PNG });
    const without = await text(profile);
    expect(withLogo.length).toBeGreaterThan(without.length);
    expect(withLogo).toContain("/Subtype /Image");
    expect(without).not.toContain("/Subtype /Image");
    for (const bit of ["Gentle care for every smile", "Tamil Nadu Dental Council Reg. No: TN-123", "Clinic Reg. No: CL-77", "12 Main Road, Coimbatore 641001, Tamil Nadu"]) expect(without).toContain(bit);
  });
  it("ignores a logo that is not a safe PNG/JPEG and still prints", async () => {
    const out = await text({ ...profile, logo: "data:image/svg+xml;base64,PHN2Zz4=" });
    expect(out.startsWith("%PDF-")).toBe(true);
    expect(out).not.toContain("/Subtype /Image");
  });
});
