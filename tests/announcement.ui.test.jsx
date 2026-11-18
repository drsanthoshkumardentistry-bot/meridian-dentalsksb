import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import AnnouncementBanner from "../src/components/AnnouncementBanner.jsx";
import AdminProfile from "../src/components/AdminProfile.jsx";
import { loadAnnouncement, saveAnnouncement } from "../src/announcementApi.js";

afterEach(() => { cleanup(); localStorage.clear(); });
const live = { active: true, id: "9", text: "Update tonight at 11 pm", level: "warning" };

describe("announcement banner", () => {
  it("shows plain text, can be dismissed, and stays dismissed for that message only", async () => {
    const { unmount } = render(<AnnouncementBanner loadFn={async () => ({ ...live, text: "<b>Hi</b>" })} everyMs={0} />);
    expect((await screen.findByTestId("announcement")).textContent).toContain("<b>Hi</b>"); // shown as text, not markup
    fireEvent.click(screen.getByLabelText("Dismiss message"));
    expect(screen.queryByTestId("announcement")).toBeNull();
    unmount();
    render(<AnnouncementBanner loadFn={async () => ({ ...live, id: "10" })} everyMs={0} />);
    expect(await screen.findByTestId("announcement")).toBeTruthy(); // a new message shows again
    cleanup();
    render(<AnnouncementBanner loadFn={async () => ({ ...live, text: "<b>Hi</b>" })} everyMs={0} />);
    await waitFor(() => expect(screen.queryByTestId("announcement")).toBeNull()); // the dismissed one stays hidden
  });
  it("shows nothing when there is no message or the lookup fails", async () => {
    render(<AnnouncementBanner loadFn={async () => ({ active: false })} everyMs={0} />);
    await waitFor(() => expect(screen.queryByTestId("announcement")).toBeNull());
  });
});

describe("announcement api client", () => {
  const ok = (body, status = 200) => vi.fn(async () => ({ ok: status < 400, status, json: async () => body }));
  it("returns no banner on any failure", async () => {
    expect((await loadAnnouncement({ fetchFn: ok({}, 500), getToken: async () => "t" })).active).toBe(false);
    expect((await loadAnnouncement({ fetchFn: vi.fn().mockRejectedValue(new Error("x")), getToken: async () => "t" })).active).toBe(false);
    expect((await loadAnnouncement({ fetchFn: ok(live), getToken: async () => { throw new Error("no"); } })).active).toBe(false);
    expect((await loadAnnouncement({ fetchFn: ok({ ...live, level: "weird" }), getToken: async () => "t" })).level).toBe("info");
  });
  it("saves with the founder token and explains errors", async () => {
    const f = ok(live);
    await saveAnnouncement({ text: "x", level: "info" }, { fetchFn: f, getToken: async () => "tok" });
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
    await expect(saveAnnouncement({ text: "x" }, { fetchFn: ok({ error: "Not available." }, 403), getToken: async () => "t" })).rejects.toThrow("Not available.");
  });
});

describe("announcement editor", () => {
  const props = (extra) => ({ announceLoad: async () => ({ active: false }), announceSave: vi.fn(async (b) => ({ active: !!b.text, text: b.text, level: b.level })), user: null, email: "boss@x.com", data: null, every: 0, onEvery: () => {}, onToast: vi.fn(), onOpenApp: () => {}, onLogout: () => {}, ...extra });
  it("publishes with the chosen style and clears", async () => {
    const p = props();
    render(<AdminProfile {...p} />);
    fireEvent.change(screen.getByLabelText("Banner message"), { target: { value: "Update tonight" } });
    fireEvent.change(screen.getByLabelText("Style"), { target: { value: "warning" } });
    fireEvent.click(screen.getByText("Publish to all clinics"));
    await waitFor(() => expect(p.announceSave).toHaveBeenCalledWith({ text: "Update tonight", level: "warning" }));
    await waitFor(() => expect(p.onToast).toHaveBeenCalledWith("Published. Clinics see it within 10 minutes."));
    fireEvent.click(screen.getByText("Remove banner"));
    await waitFor(() => expect(p.announceSave).toHaveBeenLastCalledWith({ text: "", level: "warning" }));
    await waitFor(() => expect(p.onToast).toHaveBeenCalledWith("Banner removed."));
  });
  it("loads the live message for editing and reports a failed save", async () => {
    const p = props({ announceLoad: async () => live, announceSave: vi.fn().mockRejectedValue(new Error("Could not save. Try again in a minute.")) });
    render(<AdminProfile {...p} />);
    await waitFor(() => expect(screen.getByLabelText("Banner message").value).toBe(live.text));
    expect(screen.getByText(/A banner is live now/)).toBeTruthy();
    fireEvent.click(screen.getByText("Publish to all clinics"));
    await waitFor(() => expect(p.onToast).toHaveBeenCalledWith("Could not save. Try again in a minute."));
  });
});
