import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import DataPortability from "../src/components/DataPortability.jsx";
import { buildBackup } from "../src/portability.js";

const data = { patients: [{ id: "P-1", name: "Asha" }], appointments: [], invoices: [], inventory: [], employees: [], profile: { branches: [{ id: "main", name: "Main" }] } };
const setup = (over = {}) => {
  const props = { data, newId: (p) => `${p}-n1`, onDownloadFile: vi.fn(), onImported: vi.fn(), onAudit: vi.fn(), ...over };
  render(<DataPortability {...props} />);
  return props;
};
const pick = (name, text, type) => fireEvent.change(screen.getByLabelText("Choose a file to import"), { target: { files: [new File([text], name, { type })] } });

afterEach(cleanup);
describe("DataPortability", () => {
  it("downloads a plain backup and a spreadsheet, and records both", () => {
    const p = setup();
    fireEvent.click(screen.getByText("Download full backup"));
    return waitFor(() => expect(p.onDownloadFile).toHaveBeenCalled()).then(() => {
      expect(p.onDownloadFile.mock.calls[0][2]).toBe("application/json");
      fireEvent.click(screen.getByText("Patients"));
      expect(p.onDownloadFile.mock.calls[1][1]).toMatch(/^patients-.*\.csv$/);
      expect(p.onAudit).toHaveBeenCalledTimes(2);
    });
  });
  it("refuses a short password", async () => {
    const p = setup();
    fireEvent.change(screen.getByLabelText(/Password \(optional/), { target: { value: "abc" } });
    fireEvent.click(screen.getByText("Download full backup"));
    expect((await screen.findByRole("alert")).textContent).toMatch(/at least 8/);
    expect(p.onDownloadFile).not.toHaveBeenCalled();
  });
  it("previews a CSV patient list and imports it only after confirming", async () => {
    const p = setup();
    pick("list.csv", "Name,Phone\nRavi,9123456780\nBad,12", "text/csv");
    expect(await screen.findByText(/2 patients ready to add/)).toBeTruthy();
    expect(p.onImported).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Add 2 patients"));
    const arg = p.onImported.mock.calls[0][0];
    expect(arg.patients.map((x) => x.name)).toEqual(["Ravi", "Bad", "Asha"]);
  });
  it("previews a backup, adds only what is new, and says when nothing is", async () => {
    const other = buildBackup({ patients: [{ id: "P-9", name: "Meena" }, { id: "P-1", name: "Asha" }] });
    const p = setup();
    pick("b.json", JSON.stringify(other), "application/json");
    expect(await screen.findByText(/1 patients added, 1 already here/)).toBeTruthy();
    fireEvent.click(screen.getByText("Add to this clinic"));
    expect(p.onImported.mock.calls[0][0].patients.map((x) => x.id)).toEqual(["P-9", "P-1"]);
  });
  it("explains a file that is not a backup", async () => {
    setup();
    pick("x.json", "{\"hello\":1}", "application/json");
    expect((await screen.findByRole("alert")).textContent).toMatch(/not a MeriDent backup/);
  });
});
