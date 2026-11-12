import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import Connect from "../src/components/Connect.jsx";

afterEach(() => cleanup());

const me = {
  id: "me", fullName: "Dr Me", qualification: "BDS", specialty: "general", councilState: "TN", registrationNo: "1",
  clinicName: "My Clinic", clinicAddress: "Somewhere 641001", phone: "9876543210", status: "verified", listed: true,
  acceptingReferrals: true, geo: { lat: 11.0168, lng: 76.9558 },
};
const spec = (over) => ({
  id: "s1", fullName: "Dr Root", qualification: "MDS", specialty: "endodontics", clinicName: "Root Clinic",
  clinicAddress: "Near Park", phone: "9123456780", whatsapp: "9123456780", distanceKm: 2.34, acceptingReferrals: true, geo: { lat: 11.03, lng: 76.97 }, ...over,
});

const makeApi = (over = {}) => ({
  enabled: true, uid: "me",
  getProfile: vi.fn(async () => me), isAdmin: vi.fn(async () => false),
  saveNewProfile: vi.fn(async () => {}), updateOwnSettings: vi.fn(async () => {}), setListed: vi.fn(async () => {}),
  search: vi.fn(async () => []), createConsult: vi.fn(async () => "c1"),
  listConsults: vi.fn(async () => []), respondConsult: vi.fn(async () => {}),
  listPending: vi.fn(async () => []), verify: vi.fn(async () => {}), suspend: vi.fn(async () => {}),
  ...over,
});
const mount = (api, extra = {}) => render(<Connect api={api} uid="me" showToast={vi.fn()} initialTab="find" geocode={async () => ({ lat: 11, lng: 76.9 })} defaults={{}} {...extra} />);
const type = (el, value) => fireEvent.change(el, { target: { value } });

describe("MeriDent Connect screens", () => {
  it("new dentists register; an address that can't be found is refused", async () => {
    const api = makeApi({ getProfile: vi.fn(async () => null) });
    const geocode = vi.fn(async () => null);
    mount(api, { geocode, defaults: { clinicName: "My Clinic", phone: "9876543210" } });
    await screen.findByText("Join MeriDent Connect");
    fireEvent.click(screen.getByText("Send for verification"));
    expect(await screen.findByText(/Enter your name/)).toBeTruthy();
    type(screen.getByLabelText("Full name"), "Dr New");
    type(screen.getByLabelText(/^Qualification/), "MDS");
    type(screen.getByLabelText("State Dental Council"), "Tamil Nadu");
    type(screen.getByLabelText("Council registration number"), "TN-77");
    type(screen.getByLabelText(/^Clinic address/), "5 Main Road, Coimbatore 641001");
    fireEvent.click(screen.getByText("Send for verification"));
    expect(await screen.findByText(/could not find that address/i)).toBeTruthy();
    expect(api.saveNewProfile).not.toHaveBeenCalled();
    geocode.mockResolvedValueOnce({ lat: 11.0, lng: 76.9 });
    fireEvent.click(screen.getByText("Send for verification"));
    await waitFor(() => expect(api.saveNewProfile).toHaveBeenCalledTimes(1));
    const saved = api.saveNewProfile.mock.calls[0][0];
    expect(saved.geo).toEqual({ lat: 11, lng: 76.9 });
    expect(saved.geohash).toMatch(/^[0-9a-z]{10}$/);
  });

  it("pending dentists wait and cannot reach the finder", async () => {
    mount(makeApi({ getProfile: vi.fn(async () => ({ ...me, status: "pending" })) }));
    expect(await screen.findByText("Waiting for verification")).toBeTruthy();
    expect(screen.queryByText("Find specialists")).toBeNull();
  });

  it("verified dentists see nearest specialists first, excluding themselves, with contact buttons", async () => {
    const search = vi.fn(async () => [
      spec({ id: "far", fullName: "Dr Far", distanceKm: 9 }),
      spec({ id: "near", fullName: "Dr Near", distanceKm: 1.2 }),
      spec({ id: "me", fullName: "Dr Me", distanceKm: 0 }),
      spec({ id: "off", fullName: "Dr Away", distanceKm: 3, acceptingReferrals: false }),
    ]);
    mount(makeApi({ search }));
    await screen.findByText("Dr Near");
    const names = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(names[0]).toMatch(/Dr Near/);
    expect(names[1]).toMatch(/Dr Far/);
    expect(screen.queryByText("Dr Me")).toBeNull();
    expect(screen.queryByText("Dr Away")).toBeNull();
    expect(screen.getByText("1.2 km")).toBeTruthy();
    expect(screen.getAllByText("Call")[0].closest("a").getAttribute("href")).toBe("tel:+919123456780");
    expect(screen.getAllByText("WhatsApp")[0].closest("a").getAttribute("href")).toMatch(/^https:\/\/wa\.me\/919123456780/);
    expect(search).toHaveBeenCalledWith(me.geo, 10);
  });

  it("invites a listed specialist to a video call through Messages", async () => {
    const sendMessage = vi.fn(async () => {});
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const api = makeApi({ search: vi.fn(async () => [spec({ id: "near", fullName: "Dr Near", distanceKm: 1 })]), sendMessage });
    mount(api);
    fireEvent.click(await screen.findByText("Invite to video call"));
    fireEvent.change(screen.getByPlaceholderText(/today 6 pm/), { target: { value: "now" } });
    fireEvent.click(screen.getByText("Send invite and open call"));
    await waitFor(() => expect(sendMessage).toHaveBeenCalled());
    const [, to, text] = sendMessage.mock.calls[0];
    expect(to).toBe("near");
    expect(text).toMatch(/https:\/\/meet\.jit\.si\/MeriDentConnect-[A-Za-z0-9]{20}/);
    expect(open).toHaveBeenCalledWith(expect.stringContaining("meet.jit.si/MeriDentConnect-"), "_blank", "noopener,noreferrer");
    open.mockRestore();
  });

  it("offers a wider search when nobody is nearby", async () => {
    const search = vi.fn(async () => []);
    mount(makeApi({ search }));
    fireEvent.click(await screen.findByText(/Search up to 25 km/));
    await waitFor(() => expect(search).toHaveBeenLastCalledWith(me.geo, 25));
  });

  it("sends a consult: case details need the consent box", async () => {
    const api = makeApi({ search: vi.fn(async () => [spec({})]) });
    mount(api);
    fireEvent.click(await screen.findByText("Ask for a consult"));
    const form = screen.getByLabelText(/Consult request to Dr Root/);
    expect(within(form).queryByText(/patient has been informed/)).toBeNull();
    type(within(form).getByLabelText(/Case summary/), "Pain in 46, allergic to penicillin");
    expect(within(form).getByText(/patient has been informed/)).toBeTruthy();
    fireEvent.click(within(form).getByText("Send consult request"));
    expect(await within(form).findByText(/Tick the box/)).toBeTruthy();
    expect(api.createConsult).not.toHaveBeenCalled();
    type(within(form).getByLabelText(/Patient initials/), "Asha Devi Kumar");
    fireEvent.click(within(form).getByRole("checkbox"));
    fireEvent.click(within(form).getByText("Send consult request"));
    expect(await within(form).findByText(/initials or an ID/)).toBeTruthy();
    type(within(form).getByLabelText(/Patient initials/), "A.D.");
    fireEvent.click(within(form).getByText("Send consult request"));
    await waitFor(() => expect(api.createConsult).toHaveBeenCalledTimes(1));
    const [, toId, sentForm] = api.createConsult.mock.calls[0];
    expect(toId).toBe("s1");
    expect(sentForm).toMatchObject({ urgency: "routine", patientRef: "A.D.", consent: true });
  });

  it("receiver can accept, then complete with a report back", async () => {
    const consult = { id: "c1", fromId: "x", fromName: "Dr Sender", fromClinic: "Send Clinic", fromPhone: "9000000001", urgency: "urgent", patientRef: "A.D.", caseSummary: "Pain", status: "sent", createdAt: new Date() };
    let list = [consult];
    const api = makeApi({
      listConsults: vi.fn(async (side) => (side === "received" ? list : [])),
      respondConsult: vi.fn(async (c, status) => { list = [{ ...c, status }]; }),
    });
    mount(api);
    fireEvent.click(await screen.findByRole("tab", { name: /Requests received \(1\)/ }));
    expect(await screen.findByText(/Dr Sender, Send Clinic/)).toBeTruthy();
    fireEvent.click(screen.getByText("Accept"));
    await waitFor(() => expect(api.respondConsult).toHaveBeenCalledWith(consult, "accepted", ""));
    type(await screen.findByLabelText(/Report back to Dr Sender/), "Root canal done");
    fireEvent.click(screen.getByText("Mark completed"));
    await waitFor(() => expect(api.respondConsult).toHaveBeenLastCalledWith(expect.objectContaining({ status: "accepted" }), "completed", "Root canal done"));
  });

  it("listing switches publish and unpublish", async () => {
    const api = makeApi();
    mount(api);
    fireEvent.click(await screen.findByRole("tab", { name: "My listing" }));
    fireEvent.click(screen.getByLabelText(/List me in the specialist finder/));
    await waitFor(() => expect(api.setListed).toHaveBeenCalledWith(me, false));
  });

  it("staff see the verification queue and can verify a dentist", async () => {
    const pending = { id: "p1", fullName: "Dr Pending", qualification: "BDS", specialty: "general", councilState: "Kerala", registrationNo: "K-9", clinicName: "PC", clinicAddress: "Addr", phone: "9000000002", geo: { lat: 10, lng: 76 } };
    let queue = [pending];
    const api = makeApi({ isAdmin: vi.fn(async () => true), listPending: vi.fn(async () => queue), verify: vi.fn(async () => { queue = []; }) });
    mount(api);
    fireEvent.click(await screen.findByRole("tab", { name: "Verify dentists" }));
    expect(await screen.findByText(/K-9/)).toBeTruthy();
    expect(screen.getByText("Check the pin on the map").getAttribute("href")).toMatch(/openstreetmap\.org/);
    fireEvent.click(screen.getByText("Verify Dr Pending"));
    await waitFor(() => expect(api.verify).toHaveBeenCalledWith("p1"));
    expect(await screen.findByText(/No dentists are waiting/)).toBeTruthy();
  });

  it("explains when signed out or offline", async () => {
    mount(makeApi({ enabled: false }));
    expect(await screen.findByText(/signed in and online/)).toBeTruthy();
  });
});
