// Pure rules for the MeriDent Connect network feed: posts, comments, privacy checks, filtering. No Firebase here.
import { SPECIALTIES } from "./rules.js";
import { dateKey } from "../reminders.js";

export const POST_TYPES = [
  ["case", "Case discussion"],
  ["question", "Ask peers"],
  ["update", "Clinical tip"],
  ["event", "CME and events"],
];
export const typeLabel = (id) => (POST_TYPES.find(([k]) => k === id) || [id, id])[1];
export const LIMITS = { title: 120, body: 2000, comment: 800, venue: 80 };
export const REPORT_REASONS = ["Patient can be identified", "Spam or advertising", "Rude or abusive", "Medical misinformation", "Other"];

/**
 * Block anything that identifies a patient or leaves the network (phone numbers, emails, links).
 * Warn about patterns that often hide a name.
 */
export const findPrivacyIssues = (text = "") => {
  const t = String(text);
  const block = [];
  if (/(?:\d[\s-]?){10,}/.test(t)) block.push("a phone, Aadhaar or ID number");
  if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(t)) block.push("an email address");
  if (/https?:\/\/|www\./i.test(t)) block.push("a link");
  const warn = [];
  if (/\b(?:Mr|Mrs|Ms|Miss|Master|Shri|Smt|Thiru)\.?\s+[A-Z][a-z]+/.test(t)) warn.push("a title followed by a name");
  return { block, warn };
};

export const validatePost = (form = {}, now = new Date()) => {
  const type = form.type;
  if (!POST_TYPES.some(([k]) => k === type)) return { ok: false, error: "Choose what you are posting" };
  const title = String(form.title || "").trim();
  const body = String(form.body || "").trim();
  if (title.length < 3) return { ok: false, error: "Add a short title (at least 3 characters)" };
  if (title.length > LIMITS.title) return { ok: false, error: `Keep the title under ${LIMITS.title} characters` };
  if (body.length < 10) return { ok: false, error: "Write a little more (at least 10 characters)" };
  if (body.length > LIMITS.body) return { ok: false, error: `Keep the post under ${LIMITS.body} characters` };
  const issues = findPrivacyIssues(`${title}\n${body}\n${form.venue || ""}`);
  if (issues.block.length) return { ok: false, error: `Remove ${issues.block[0]} before posting` };
  if ((type === "case" || type === "question") && form.deidentified !== true) return { ok: false, error: "Confirm that the patient cannot be identified from this post" };
  const post = { type, title, body };
  if (form.tag) {
    if (!SPECIALTIES.some(([k]) => k === form.tag)) return { ok: false, error: "Choose a topic from the list" };
    post.tag = form.tag;
  }
  if (type === "event") {
    const venue = String(form.venue || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.eventDate || "") || form.eventDate < dateKey(now)) return { ok: false, error: "Choose the event date (today or later)" };
    if (!venue) return { ok: false, error: "Add the place or platform" };
    if (venue.length > LIMITS.venue) return { ok: false, error: `Keep the place under ${LIMITS.venue} characters` };
    post.eventDate = form.eventDate;
    post.venue = venue;
  }
  return { ok: true, post, warnings: issues.warn };
};

/** The stored post. Name, qualification and specialty always come from the verified profile, never the form. */
export const buildPost = (post, authorId, profile) => ({
  ...post,
  authorId,
  authorName: profile.fullName,
  authorQualification: profile.qualification || "",
  authorSpecialty: profile.specialty,
  likeCount: 0,
  commentCount: 0,
});

export const validateComment = (text) => {
  const t = String(text || "").trim();
  if (!t) return { ok: false, error: "Write a comment first" };
  if (t.length > LIMITS.comment) return { ok: false, error: `Keep comments under ${LIMITS.comment} characters` };
  const { block } = findPrivacyIssues(t);
  if (block.length) return { ok: false, error: `Remove ${block[0]} before posting` };
  return { ok: true, text: t };
};

export const timeAgo = (ms, now = Date.now()) => {
  if (!ms) return "just now";
  const m = Math.floor((now - ms) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ${d === 1 ? "day" : "days"} ago`;
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export const FEED_FILTERS = [["all", "All"], ["case", "Cases"], ["question", "Questions"], ["update", "Tips"], ["event", "Events"], ["following", "Following"], ["mine", "My posts"]];

export const filterPosts = (posts = [], { filter = "all", following = new Set(), uid = "", tag = "" } = {}) =>
  posts.filter((p) => {
    if (tag && p.tag !== tag) return false;
    if (filter === "all") return true;
    if (filter === "following") return following.has(p.authorId);
    if (filter === "mine") return p.authorId === uid;
    return p.type === filter;
  });

export const initials = (name = "") => name.replace(/^dr\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "D";
