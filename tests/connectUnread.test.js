import { describe, it, expect, beforeEach } from "vitest";
import { countUnread, lastSeen, markSeen } from "../src/connect/unread.js";

beforeEach(() => localStorage.clear());

describe("unread messages", () => {
  const chats = [
    { lastSenderId: "zed", updatedAt: 2000 },
    { lastSenderId: "me", updatedAt: 3000 },
    { lastSenderId: "amy", updatedAt: 500 },
  ];
  it("counts only other people's newer messages", () => {
    expect(countUnread(chats, "me", 1000)).toBe(1);
    expect(countUnread(chats, "me", 0)).toBe(2);
    expect(countUnread(chats, "me", 5000)).toBe(0);
    expect(countUnread([], "me", 0)).toBe(0);
  });
  it("remembers the last visit per dentist", () => {
    expect(lastSeen("me")).toBe(0);
    markSeen("me", 1234);
    expect(lastSeen("me")).toBe(1234);
    expect(lastSeen("other")).toBe(0);
  });
});
