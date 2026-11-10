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

import { searchPosts, sortPosts, trendingTopics, suggestAuthors, upcomingEvents, eventDay, eventWhen, eventIcs, eventIcsName, seenSnapshot, withBaseline, activitySince, activityText, postPatch, canAccept, isAnswered, inviteLink, warningAdvice, GUIDELINES, FEED_FILTERS } from "../src/connect/feed.js";

describe("search and ordering", () => {
  const posts = [
    { id: 1, title: "Recurrent abscess in 46", body: "RCT done twice", authorName: "Dr Root", type: "case", tag: "endodontics", likeCount: 1, commentCount: 0, createdAt: 3000 },
    { id: 2, title: "Which bur for zirconia?", body: "Crown prep", authorName: "Dr Pros", type: "question", tag: "prosthodontics", likeCount: 0, commentCount: 5, createdAt: 2000 },
    { id: 3, title: "CBCT workshop", body: "Hands-on", authorName: "Dr Root", type: "event", venue: "Coimbatore", eventDate: "2026-12-01", createdAt: 1000 },
  ];
  it("needs every word to match somewhere", () => {
    const ids = (q) => searchPosts(posts, q).map((p) => p.id);
    expect(ids("")).toEqual([1, 2, 3]);
    expect(ids("abscess")).toEqual([1]);
    expect(ids("ZIRCONIA bur")).toEqual([2]);
    expect(ids("root")).toEqual([1, 3]);
    expect(ids("endodontics")).toEqual([1]);
    expect(ids("coimbatore")).toEqual([3]);
    expect(ids("question")).toEqual([2]);
    expect(ids("abscess zirconia")).toEqual([]);
  });
  it("sorts by newest or most discussed without changing the list", () => {
    const shuffled = [posts[2], posts[0], posts[1]];
    expect(sortPosts(shuffled).map((p) => p.id)).toEqual([1, 2, 3]);
    expect(sortPosts(shuffled, "top").map((p) => p.id)).toEqual([2, 1, 3]);
    expect(shuffled.map((p) => p.id)).toEqual([3, 1, 2]);
  });
  it("finds trending topics, suggested colleagues and upcoming events", () => {
    const more = [...posts, { id: 4, tag: "endodontics", authorId: "a", authorName: "Dr Root" }, { id: 5, authorId: "me", authorName: "Dr Me" }, { id: 6, authorId: "f", authorName: "Dr Followed" }];
    expect(trendingTopics(more)).toEqual([{ tag: "endodontics", count: 2 }, { tag: "prosthodontics", count: 1 }]);
    const sug = suggestAuthors(more.map((p, i) => ({ ...p, authorId: p.authorId || `x${i}` })), { uid: "me", following: new Set(["f"]) });
    expect(sug.map((s) => s.id)).not.toContain("me");
    expect(sug.map((s) => s.id)).not.toContain("f");
    expect(upcomingEvents(posts, "2026-11-11").map((p) => p.id)).toEqual([3]);
    expect(upcomingEvents(posts, "2026-12-02")).toEqual([]);
  });
  it("describes event dates", () => {
    expect(eventDay("2026-12-01")).toEqual({ day: 1, month: "Dec", year: 2026 });
    expect(eventWhen("2026-11-11", "2026-11-11")).toBe("Today");
    expect(eventWhen("2026-11-12", "2026-11-11")).toBe("Tomorrow");
    expect(eventWhen("2026-11-20", "2026-11-11")).toBe("In 9 days");
    expect(eventWhen("2026-11-10", "2026-11-11")).toBe("Ended");
    expect(eventWhen("nope")).toBe("");
  });
  it("has a Saved filter that passes the list through", () => {
    expect(FEED_FILTERS.map(([id]) => id)).toContain("saved");
    expect(filterPosts([{ id: 1, type: "case" }], { filter: "saved" })).toHaveLength(1);
  });
});

describe("calendar file", () => {
  const ev = { id: "p1", title: "CBCT, hands-on; day", body: "Line1\nLine2", eventDate: "2026-12-31", venue: "Coimbatore", authorName: "Dr Root" };
  it("builds an all-day event that ends the next day, with escaped text", () => {
    const ics = eventIcs(ev, new Date(Date.UTC(2026, 10, 11, 1, 2, 3)));
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261231");
    expect(ics).toContain("DTEND;VALUE=DATE:20270101");
    expect(ics).toContain("DTSTAMP:20261111T010203Z");
    expect(ics).toContain("SUMMARY:CBCT\\, hands-on\\; day");
    expect(ics).toContain("LOCATION:Coimbatore");
    expect(ics).toContain("UID:p1@meridentconnect");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.split("\r\n").every((l) => l.length <= 74)).toBe(true);
    expect(/[^\r]\n/.test(ics)).toBe(false);
  });
  it("returns nothing for a post without a valid date, and names the file safely", () => {
    expect(eventIcs({ title: "x" })).toBe("");
    expect(eventIcsName(ev)).toBe("cbct-hands-on-day.ics");
    expect(eventIcsName({})).toBe("event.ics");
  });
});

describe("activity on my posts", () => {
  const mine = [{ id: "a", title: "A", likeCount: 3, commentCount: 2 }, { id: "b", title: "B", likeCount: 0, commentCount: 0 }, { id: "c", title: "C", likeCount: 4, commentCount: 1 }];
  it("only counts what is new since the last visit", () => {
    const seen = { a: [1, 2], b: [0, 0] };
    const act = activitySince(mine, seen);
    expect(act).toMatchObject({ likes: 2, comments: 0 });
    expect(act.items).toEqual([{ id: "a", title: "A", likes: 2, comments: 0 }]);
    expect(activityText(act)).toBe("2 new Helpful marks");
    expect(activityText({ likes: 1, comments: 3 })).toBe("3 new comments and 1 new Helpful mark");
    expect(activityText({})).toBe("");
  });
  it("starts unseen posts at their current counts, and never goes negative", () => {
    const seen = withBaseline({ a: [1, 2] }, mine);
    expect(seen.c).toEqual([4, 1]);
    expect(seen.a).toEqual([1, 2]);
    expect(activitySince(mine, seen).items).toHaveLength(1);
    expect(activitySince([{ id: "a", likeCount: 0, commentCount: 0 }], { a: [5, 5] })).toMatchObject({ likes: 0, comments: 0 });
    expect(seenSnapshot(mine).a).toEqual([3, 2]);
  });
});

describe("editing, answers and invites", () => {
  it("builds the edit: sets fields, removes a cleared topic, keeps event fields only for events", () => {
    expect(postPatch({ type: "case", tag: "endodontics" }, { title: "T", body: "B" })).toEqual({ set: { title: "T", body: "B" }, unset: ["tag"] });
    expect(postPatch({ type: "case" }, { title: "T", body: "B", tag: "implantology" })).toEqual({ set: { title: "T", body: "B", tag: "implantology" }, unset: [] });
    expect(postPatch({ type: "event" }, { title: "T", body: "B", eventDate: "2026-12-01", venue: "V" }).set).toMatchObject({ eventDate: "2026-12-01", venue: "V" });
  });
  it("lets an old event keep its date when edited, but not move to the past", () => {
    const ev = { type: "event", title: "Workshop", body: "Hands-on workshop for dentists.", eventDate: "2026-10-01", venue: "Chennai" };
    const now = new Date(2026, 10, 11, 12);
    expect(validatePost(ev, now).ok).toBe(false);
    expect(validatePost(ev, now, { eventDate: "2026-10-01" }).ok).toBe(true);
    expect(validatePost({ ...ev, eventDate: "2026-10-02" }, now, { eventDate: "2026-10-01" }).ok).toBe(false);
  });
  it("only the asker can accept an answer, and only on questions", () => {
    expect(canAccept({ type: "question", authorId: "me" }, "me")).toBe(true);
    expect(canAccept({ type: "question", authorId: "x" }, "me")).toBe(false);
    expect(canAccept({ type: "case", authorId: "me" }, "me")).toBe(false);
    expect(isAnswered({ type: "question", acceptedCommentId: "c1" })).toBe(true);
    expect(isAnswered({ type: "question", acceptedCommentId: "" })).toBe(false);
  });
  it("warns about advertising and explains why", () => {
    const w = findPrivacyIssues("Flat 20% off on scaling this week, book now").warn;
    expect(w).toContain("wording that sounds like advertising");
    expect(findPrivacyIssues("The patient offers no relevant history").warn).toEqual([]);
    expect(warningAdvice("wording that sounds like advertising")).toMatch(/ethics/);
    expect(warningAdvice("a title followed by a name")).toMatch(/patient/);
    expect(GUIDELINES.length).toBeGreaterThanOrEqual(4);
  });
  it("builds a WhatsApp invite", () => {
    const link = inviteLink("Dr Priya");
    expect(link.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(link)).toMatch(/Dr Priya invites you to MeriDent Connect/);
    expect(decodeURIComponent(link)).toContain("https://www.meridiandentalos.com");
  });
});

import { pollResults, POLL_MAX } from "../src/connect/feed.js";
describe("polls", () => {
  const base = { type: "poll", title: "Which file system do you use for retreatment?", body: "", options: ["Rotary", " Reciprocating ", "", "Hand files"] };
  const now = new Date(2026, 10, 11, 12);
  it("accepts 2 to 5 distinct options, trims and drops blanks, and the body is optional", () => {
    const r = validatePost(base, now);
    expect(r.ok).toBe(true);
    expect(r.post).toEqual({ type: "poll", title: base.title, body: "", pollOptions: ["Rotary", "Reciprocating", "Hand files"] });
  });
  it("rejects too few, too many, long, duplicate or identifying options", () => {
    expect(validatePost({ ...base, options: ["Only"] }, now).error).toMatch(/at least 2/);
    expect(validatePost({ ...base, options: Array.from({ length: POLL_MAX + 1 }, (_, i) => `o${i}`) }, now).error).toMatch(/at most 5/);
    expect(validatePost({ ...base, options: ["a", "x".repeat(61)] }, now).error).toMatch(/60/);
    expect(validatePost({ ...base, options: ["Same", "same"] }, now).error).toMatch(/different/);
    expect(validatePost({ ...base, options: ["Call 9876543210", "No"] }, now).error).toMatch(/phone/);
  });
  it("needs no patient confirmation, and builds zeroed vote counters", () => {
    const p = buildPost(validatePost(base, now).post, "u1", { fullName: "Dr A", qualification: "MDS", specialty: "endodontics" });
    expect(p).toMatchObject({ v0: 0, v1: 0, v2: 0, likeCount: 0 });
    expect(p.v3).toBeUndefined();
  });
  it("totals votes and rounds percentages", () => {
    const r = pollResults({ pollOptions: ["A", "B", "C"], v0: 2, v1: 1, v2: 0 });
    expect(r.total).toBe(3);
    expect(r.rows.map((x) => x.pct)).toEqual([67, 33, 0]);
    expect(pollResults({ pollOptions: ["A", "B"], v0: 0, v1: 0 }).rows.map((x) => x.pct)).toEqual([0, 0]);
    expect(pollResults({}).total).toBe(0);
  });
  it("is searchable by option and filterable", () => {
    expect(searchPosts([{ id: 1, title: "x", pollOptions: ["Reciprocating"], type: "poll" }], "reciprocating")).toHaveLength(1);
    expect(FEED_FILTERS.map(([id]) => id)).toContain("poll");
  });
});
