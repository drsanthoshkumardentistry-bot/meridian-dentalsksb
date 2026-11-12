import { describe, it, expect } from "vitest";
import { newRoomName, callLink, inviteText, findCallLink } from "../src/connect/call.js";

describe("video call invites", () => {
  it("makes long random room names", () => {
    const a = newRoomName(); const b = newRoomName();
    expect(a).toMatch(/^MeriDentConnect-[A-Za-z0-9]{20}$/);
    expect(a).not.toBe(b);
  });
  it("writes an invite that fits the message limit and can be found again", () => {
    const room = newRoomName();
    const t = inviteText({ fromName: "Dr A", when: "today 6 pm", room });
    expect(t.length).toBeLessThan(800);
    expect(t).toContain("today 6 pm");
    expect(findCallLink(t)).toBe(callLink(room));
  });
  it("only treats MeriDent room links as invites", () => {
    expect(findCallLink("join https://meet.jit.si/SomethingElse now")).toBe("");
    expect(findCallLink("https://evil.example/https://meet.jit.si/MeriDentConnect-abcdefghijabcdefghij")).toContain("meet.jit.si/MeriDentConnect-");
    expect(findCallLink(null)).toBe("");
  });
  it("cuts a very long time note", () => {
    expect(inviteText({ fromName: "Dr A", when: "x".repeat(500), room: "r" }).length).toBeLessThan(400);
  });
});
