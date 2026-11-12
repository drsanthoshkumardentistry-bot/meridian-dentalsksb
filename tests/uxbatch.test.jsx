import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { buildNotifications } from "../src/notifications.js";
import { recordSheetHtml } from "../src/recordSheet.js";
import NotificationBell from "../src/components/NotificationBell.jsx";
import AccountMenu from "../src/components/AccountMenu.jsx";

const now = new Date(2026, 10, 12, 10, 0);
describe("notifications", () => {
  it("lists low stock first, then today's later visits and tomorrow", () => {
    const inventory = [{ id: "1", name: "Gloves", quantity: 0, minThreshold: 5 }, { id: "2", name: "Cement", quantity: 2, minThreshold: 5 }, { id: "3", name: "Floss", quantity: 50, minThreshold: 5 }];
    const appointments = [
      { id: "a", patientName: "Ravi", date: "2026-11-12", time: "11:00", procedure: "RCT", status: "Confirmed" },
      { id: "b", patientName: "Old", date: "2026-11-12", time: "09:00", status: "Confirmed" },
      { id: "c", patientName: "Tom", date: "2026-11-13", time: "09:00", status: "Confirmed" },
    ];
    const n = buildNotifications({ inventory, appointments, now });
    expect(n.map((x) => x.text)).toEqual(["Gloves is out of stock", "Cement is low (2 left)", "11:00: Ravi, RCT", "1 visit tomorrow"]);
  });
  it("respects role flags", () => {
    expect(buildNotifications({ inventory: [{ id: "1", name: "G", quantity: 0, minThreshold: 5 }], showStock: false, now })).toEqual([]);
  });
});
describe("record sheet", () => {
  it("escapes and includes details", () => {
    const html = recordSheetHtml({ id: "P1", name: "<b>Asha</b>", age: 30, gender: "Female", allergies: "Penicillin", visits: [{ date: "2026-01-02", treatment: "Filling" }] }, {}, { name: "Clinic" });
    expect(html).toContain("&lt;b&gt;Asha");
    expect(html).toContain("Penicillin");
    expect(html).toContain("02/01/2026");
  });
});
describe("menus", () => {
  afterEach(cleanup);
  it("bell opens and routes", () => {
    const onOpen = vi.fn();
    render(<NotificationBell items={[{ id: "1", kind: "stock", tone: "red", text: "Gloves is out of stock", to: "Stock Maintenance" }]} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1" }));
    fireEvent.click(screen.getByText("Gloves is out of stock"));
    expect(onOpen).toHaveBeenCalledWith("Stock Maintenance");
  });
  it("account menu has a red Log out", () => {
    const onLogout = vi.fn();
    render(<AccountMenu user={{ email: "a@b.c" }} onGo={() => {}} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    const b = screen.getByRole("menuitem", { name: /Log out/ });
    expect(b.className).toContain("text-red-600");
    fireEvent.click(b);
    expect(onLogout).toHaveBeenCalled();
  });
});
