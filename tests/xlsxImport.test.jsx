import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { xlsxToRows } from "../src/xlsxRows.js";
import { patientsFromRows, patientTemplateCsv, patientsFromCsv } from "../src/portability.js";
import DataPortability from "../src/components/DataPortability.jsx";
import ReportProblem from "../src/components/ReportProblem.jsx";
import { supportText, supportLinks, deviceInfo } from "../src/supportMessage.js";

afterEach(cleanup);
const B = JSON.parse(readFileSync("tests/fixtures/xlsxBooks.json", "utf8"));
const bytes = (k) => Uint8Array.from(Buffer.from(B[k], "base64"));
const book = ({ sheet, shared }) => bytes(sheet === "" ? "empty" : shared ? "good" : "odd"); // fixtures built by a node script (jsdom's Uint8Array breaks fflate's zipSync)
const SHEET = "x", SHARED = "y";

describe("xlsxToRows", () => {
  it("reads the first sheet by workbook order, shared text, inline text, gaps and exponent numbers", () => {
    const r = xlsxToRows(book({ sheet: SHEET, shared: SHARED }));
    expect(r.ok).toBe(true);
    expect(r.rows[0]).toEqual(["Patient Name", "Mobile", "", "Age"]);
    expect(r.rows[1][0]).toBe("Asha Devi");
    expect(r.rows[1][1]).toBe("9876543210");
    expect(r.rows).toHaveLength(3);
  });
  it("turns into patients through the normal rules", () => {
    const r = xlsxToRows(book({ sheet: SHEET, shared: SHARED }));
    const res = patientsFromRows(r.rows, [], () => "id" + Math.random());
    expect(res.ok).toBe(true);
    expect(res.patients.map((p) => [p.name, p.phone, p.age])).toEqual([["Asha Devi", "9876543210", "34"], ["Ravi", "9123456780", ""]]);
  });
  it("refuses non-xlsx, old .xls, empty and damaged files without throwing", () => {
    const old = Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 1, 2, 3]);
    expect(xlsxToRows(old).ok).toBe(false);
    expect(xlsxToRows(new Uint8Array()).ok).toBe(false);
    expect(xlsxToRows(null).ok).toBe(false);
    expect(xlsxToRows(Uint8Array.from([0x50, 0x4b, 9, 9, 9, 9])).ok).toBe(false);
    expect(xlsxToRows(book({ sheet: "" })).ok).toBe(false);
    const junk = new Uint8Array(500).map((_, i) => (i * 37) % 256); junk[0] = 0x50; junk[1] = 0x4b;
    expect(xlsxToRows(junk).ok).toBe(false);
    expect(xlsxToRows(book({ sheet: '<row r="1"><c r="A1" t="s"><v>99</v></c><c r="ZZ1"><v>1</v></c><c><v>2</v></c></row>' })).ok).toBe(true);
  });
  it("patientsFromRows survives junk input", () => {
    for (const j of [null, undefined, 5, "x", [null, 1, "a"], [[]], [["Name"]]]) expect(() => patientsFromRows(j, [], () => "i")).not.toThrow();
    expect(patientsFromRows([["Name"], ["A"]], [], () => "i").ok).toBe(true);
  });
  it("template has the headers the importer understands, and CSV import still works", () => {
    const t = patientTemplateCsv();
    expect(t.split("\r\n")[0]).toBe("Name,Phone,Age,Gender,Email,Address,Medical alert,Allergies");
    expect(patientsFromCsv(t + "Ravi,9123456780,40,Male,,,,\r\n", [], () => "i").patients).toHaveLength(1);
  });
});

describe("Excel file in the import screen", () => {
  const data = { patients: [], appointments: [], invoices: [], inventory: [], employees: [], profile: { branches: [{ id: "main", name: "Main" }] } };
  it("previews, then adds the patients", async () => {
    const onImported = vi.fn();
    render(<DataPortability data={data} newId={() => "P" + Math.random()} onDownloadFile={vi.fn()} onImported={onImported} onAudit={vi.fn()} />);
    const file = new File([book({ sheet: SHEET, shared: SHARED })], "patients.xlsx");
    fireEvent.change(screen.getByLabelText("Choose a file to import"), { target: { files: [file] } });
    expect(await screen.findByText(/2 patients ready to add/)).toBeTruthy();
    fireEvent.click(screen.getByText("Add 2 patients"));
    expect(onImported.mock.calls[0][0].patients).toHaveLength(2);
  });
  it("shows a plain message for an old .xls file", async () => {
    render(<DataPortability data={data} newId={() => "P1"} onDownloadFile={vi.fn()} onImported={vi.fn()} onAudit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Choose a file to import"), { target: { files: [new File([Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0])], "old.xls")] } });
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/\.xlsx or \.csv/);
  });
  it("offers a blank list to download", () => {
    const onDownloadFile = vi.fn();
    render(<DataPortability data={data} newId={() => "P1"} onDownloadFile={onDownloadFile} onImported={vi.fn()} onAudit={vi.fn()} />);
    fireEvent.click(screen.getByText("Download blank patient list"));
    expect(onDownloadFile.mock.calls[0][1]).toBe("patient-list-template.csv");
  });
});

describe("support message", () => {
  it("builds a message with no patient data and encodes it", () => {
    const m = supportText({ topic: "idea", text: "  Need X-ray printing  ", clinic: "Smile Dental", screen: "Billing", device: "Android, Chrome" });
    expect(m).toContain("I need a feature");
    expect(m).toContain("Need X-ray printing");
    expect(m).toContain("Clinic: Smile Dental");
    const l = supportLinks(m);
    expect(l.whatsapp.startsWith("https://wa.me/919043205927?text=")).toBe(true);
    expect(decodeURIComponent(l.whatsapp.split("text=")[1])).toBe(m);
    expect(l.email.startsWith("mailto:")).toBe(true);
  });
  it("copes with empty, huge and weird input", () => {
    expect(supportText({ text: "" })).toContain("(no details written)");
    expect(supportText({ text: "x".repeat(5000) }).length).toBeLessThan(1200);
    expect(() => supportText({ topic: "zzz", clinic: null, text: null })).not.toThrow();
    expect(deviceInfo(null, null)).toBeTruthy();
    expect(deviceInfo({ userAgent: "Mozilla/5.0 (Linux; Android 13) Chrome/120 Safari/537" }, { width: 360, height: 800 })).toBe("Android, Chrome, 360x800");
  });
  it("renders and updates the link as the person types", () => {
    render(<ReportProblem clinic="Smile Dental" screen="Billing" />);
    fireEvent.change(screen.getByLabelText("Tell us what happened"), { target: { value: "Invoice will not save" } });
    const href = screen.getByText("Send on WhatsApp").getAttribute("href");
    expect(decodeURIComponent(href)).toContain("Invoice will not save");
  });
});
