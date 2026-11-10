import { describe, it, expect } from "vitest";
import { findPrivacyIssues, validatePost, buildPost, validateComment, timeAgo, filterPosts, initials, typeLabel } from "../src/connect/feed.js";

const now = new Date(2026, 10, 11, 12);
const ok = { type: "case", title: "Recurrent abscess in 46", body: "Treated with RCT twice, still draining. Considering apicoectomy. Thoughts?", deidentified: true };

describe("privacy checks", () => {
  it("blocks phone numbers, emails and links", () => {
    expect(findPrivacyIssues("call 98765 43210").block).toHaveLength(1);
    expect(findPrivacyIssues("9876543210").block).toHaveLength(1);
    expect(findPrivacyIssues("+91-98765-43210").block).toHaveLength(1);
    expect(findPrivacyIssues("a@b.com").block).toEqual(["an email address"]);
    expect(findPrivacyIssues("see https://x.com").block).toEqual(["a link"]);
    expect(findPrivacyIssues("www.x.com").block).toEqual(["a link"]);
  });
  it("lets clinical numbers through and warns on titles with names", () => {
    expect(findPrivacyIssues("Tooth 46, 3 mm pocket, 12 weeks, 45 yr old").block).toEqual([]);
    expect(findPrivacyIssues("Mr Ramesh came in").warn).toHaveLength(1);
    expect(findPrivacyIssues("A male patient came in").warn).toEqual([]);
  });
});

describe("validatePost", () => {
  it("accepts a good case post", () => {
    const r = validatePost(ok, now);
    expect(r.ok).toBe(true);
    expect(r.post).toEqual({ type: "case", title: "Recurrent abscess in 46", body: ok.body });
  });
  it("needs a type, title and body", () => {
    expect(validatePost({ ...ok, type: "x" }, now).ok).toBe(false);
    expect(validatePost({ ...ok, title: "ab" }, now).error).toMatch(/title/);
    expect(validatePost({ ...ok, body: "short" }, now).error).toMatch(/little more/);
    expect(validatePost({ ...ok, body: "x".repeat(2001) }, now).error).toMatch(/2000/);
    expect(validatePost({ ...ok, title: "x".repeat(121) }, now).error).toMatch(/120/);
  });
  it("needs the de-identification confirmation for cases and questions only", () => {
    expect(validatePost({ ...ok, deidentified: false }, now).error).toMatch(/cannot be identified/);
    expect(validatePost({ ...ok, type: "question", deidentified: undefined }, now).ok).toBe(false);
    expect(validatePost({ ...ok, type: "update", deidentified: undefined }, now).ok).toBe(true);
  });
  it("blocks identifying details even in the title", () => {
    expect(validatePost({ ...ok, title: "Patient 9876543210 needs help" }, now).error).toMatch(/phone/);
    expect(validatePost({ ...ok, body: ok.body + " mail a@b.com" }, now).error).toMatch(/email/);
  });
  it("returns warnings for names behind titles", () => {
    const r = validatePost({ ...ok, body: "Mrs Lakshmi had a swelling for two weeks after extraction." }, now);
    expect(r.ok).toBe(true);
    expect(r.warnings).toHaveLength(1);
  });
  it("validates topics and events", () => {
    expect(validatePost({ ...ok, tag: "astrology" }, now).error).toMatch(/topic/);
    expect(validatePost({ ...ok, tag: "endodontics" }, now).post.tag).toBe("endodontics");
    const ev = { type: "event", title: "CBCT workshop", body: "Hands-on CBCT reading workshop for general dentists.", eventDate: "2026-12-01", venue: "Coimbatore" };
    expect(validatePost(ev, now).post).toMatchObject({ eventDate: "2026-12-01", venue: "Coimbatore" });
    expect(validatePost({ ...ev, eventDate: "2026-11-10" }, now).ok).toBe(false);
    expect(validatePost({ ...ev, venue: " " }, now).error).toMatch(/place/);
    expect(validatePost({ ...ev, eventDate: "2026-11-11" }, now).ok).toBe(true);
  });
});

describe("posts and comments", () => {
  it("takes identity from the verified profile", () => {
    const p = buildPost({ type: "update", title: "t", body: "b" }, "u1", { fullName: "Dr Priya", qualification: "MDS", specialty: "endodontics", extra: "x" });
    expect(p).toEqual({ type: "update", title: "t", body: "b", authorId: "u1", authorName: "Dr Priya", authorQualification: "MDS", authorSpecialty: "endodontics", likeCount: 0, commentCount: 0 });
  });
  it("validates comments", () => {
    expect(validateComment("  ").ok).toBe(false);
    expect(validateComment("x".repeat(801)).ok).toBe(false);
    expect(validateComment("call 9876543210").ok).toBe(false);
    expect(validateComment("  Try a CBCT first  ")).toEqual({ ok: true, text: "Try a CBCT first" });
  });
  it("describes time and initials", () => {
    const t = Date.UTC(2026, 10, 11, 6);
    expect(timeAgo(t, t + 30000)).toBe("just now");
    expect(timeAgo(t, t + 5 * 60000)).toBe("5 min ago");
    expect(timeAgo(t, t + 3600000)).toBe("1 hour ago");
    expect(timeAgo(t, t + 3 * 86400000)).toBe("3 days ago");
    expect(timeAgo(0)).toBe("just now");
    expect(initials("Dr. Priya Raman")).toBe("PR");
    expect(initials("")).toBe("D");
    expect(typeLabel("case")).toBe("Case discussion");
  });
  it("filters the feed", () => {
    const posts = [
      { id: 1, type: "case", authorId: "a", tag: "endodontics" },
      { id: 2, type: "question", authorId: "b" },
      { id: 3, type: "event", authorId: "me" },
    ];
    const ids = (o) => filterPosts(posts, o).map((p) => p.id);
    expect(ids({})).toEqual([1, 2, 3]);
    expect(ids({ filter: "case" })).toEqual([1]);
    expect(ids({ filter: "following", following: new Set(["b"]) })).toEqual([2]);
    expect(ids({ filter: "mine", uid: "me" })).toEqual([3]);
    expect(ids({ tag: "endodontics" })).toEqual([1]);
  });
});
