// Pure rules for the MeriDent Connect network feed: posts, comments, privacy checks, filtering. No Firebase here.
import { SPECIALTIES, specialtyLabel } from "./rules.js";
import { validateImages } from "./images.js";
import { dateKey } from "../reminders.js";

export const POST_TYPES = [
  ["case", "Case discussion"],
  ["question", "Ask peers"],
  ["poll", "Poll"],
  ["update", "Clinical tip"],
  ["event", "CME and events"],
];
export const typeLabel = (id) => (POST_TYPES.find(([k]) => k === id) || [id, id])[1];
export const LIMITS = { title: 120, body: 2000, comment: 800, venue: 80, option: 60 };
export const POLL_MIN = 2;
export const POLL_MAX = 5;
export const REPORT_REASONS = ["Patient can be identified", "Spam or advertising", "Rude or abusive", "Medical misinformation", "Other"];

const AD_WORDS = /\b(?:discounts?|special offer|offer price|\d+\s?% ?off|free (?:consultation|check-?up|scaling)|book (?:now|today)|call (?:now|us today)|whats ?app (?:me|us)|dm me)\b/i;

/** What to tell the dentist about a warning before they confirm. */
export const warningAdvice = (w = "") =>
  /advertising/.test(w)
    ? `This post has ${w}. Dental council ethics rules limit advertising by dentists.`
    : `This post has ${w}. Check that no patient can be identified.`;

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
  if (AD_WORDS.test(t)) warn.push("wording that sounds like advertising");
  return { block, warn };
};

export const validatePost = (form = {}, now = new Date(), existing = null) => {
  const type = form.type;
  if (!POST_TYPES.some(([k]) => k === type)) return { ok: false, error: "Choose what you are posting" };
  const title = String(form.title || "").trim();
  const body = String(form.body || "").trim();
  const isPoll = type === "poll";
  const options = isPoll ? (Array.isArray(form.options) ? form.options : []).map((o) => String(o || "").trim()).filter(Boolean) : [];
  if (title.length < 3) return { ok: false, error: "Add a short title (at least 3 characters)" };
  if (title.length > LIMITS.title) return { ok: false, error: `Keep the title under ${LIMITS.title} characters` };
  if (body.length < 10 && !isPoll) return { ok: false, error: "Write a little more (at least 10 characters)" };
  if (body.length > LIMITS.body) return { ok: false, error: `Keep the post under ${LIMITS.body} characters` };
  if (isPoll) {
    if (options.length < POLL_MIN) return { ok: false, error: `Add at least ${POLL_MIN} options` };
    if (options.length > POLL_MAX) return { ok: false, error: `Use at most ${POLL_MAX} options` };
    if (options.some((o) => o.length > LIMITS.option)) return { ok: false, error: `Keep each option under ${LIMITS.option} characters` };
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) return { ok: false, error: "Each option must be different" };
  }
  const issues = findPrivacyIssues(`${title}\n${body}\n${form.venue || ""}\n${options.join("\n")}`);
  if (issues.block.length) return { ok: false, error: `Remove ${issues.block[0]} before posting` };
  if ((type === "case" || type === "question") && form.deidentified !== true) return { ok: false, error: "Confirm that the patient cannot be identified from this post" };
  const post = { type, title, body };
  let images = [];
  if (form.images && form.images.length) {
    if (type !== "case") return { ok: false, error: "Images can only be added to a case" };
    const iv = validateImages(form.images);
    if (!iv.ok) return iv;
    images = iv.images;
    post.imageCount = images.length;
  }
  if (isPoll) post.pollOptions = options;
  if (form.tag) {
    if (!SPECIALTIES.some(([k]) => k === form.tag)) return { ok: false, error: "Choose a topic from the list" };
    post.tag = form.tag;
  }
  if (type === "event") {
    const venue = String(form.venue || "").trim();
    const unchanged = existing && existing.eventDate === form.eventDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.eventDate || "") || (form.eventDate < dateKey(now) && !unchanged)) return { ok: false, error: "Choose the event date (today or later)" };
    if (!venue) return { ok: false, error: "Add the place or platform" };
    if (venue.length > LIMITS.venue) return { ok: false, error: `Keep the place under ${LIMITS.venue} characters` };
    post.eventDate = form.eventDate;
    post.venue = venue;
  }
  return { ok: true, post, images, warnings: issues.warn };
};

/** The stored post. Name, qualification and specialty always come from the verified profile, never the form. */
export const buildPost = (post, authorId, profile) => ({
  ...post,
  ...Object.fromEntries((post.pollOptions || []).map((_, i) => [`v${i}`, 0])),
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

export const FEED_FILTERS = [["all", "All"], ["case", "Cases"], ["question", "Questions"], ["poll", "Polls"], ["update", "Tips"], ["event", "Events"], ["following", "Following"], ["saved", "Saved"], ["mine", "My posts"]];

export const filterPosts = (posts = [], { filter = "all", following = new Set(), uid = "", tag = "" } = {}) =>
  posts.filter((p) => {
    if (tag && p.tag !== tag) return false;
    if (filter === "all" || filter === "saved") return true;
    if (filter === "following") return following.has(p.authorId);
    if (filter === "mine") return p.authorId === uid;
    return p.type === filter;
  });

export const initials = (name = "") => name.replace(/^dr\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "D";

// ---------------- Search, ordering and sidebar data ----------------

const ms = (v) => (v && typeof v.toMillis === "function" ? v.toMillis() : v ? new Date(v).getTime() || 0 : 0);
const norm = (v) => String(v || "").toLowerCase();

/** Every word typed must appear somewhere in the title, text, author, topic, type or venue. */
export const searchPosts = (posts = [], q = "") => {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return posts;
  return posts.filter((p) => {
    const hay = norm([p.title, p.body, p.authorName, p.venue, p.tag ? specialtyLabel(p.tag) : "", typeLabel(p.type), p.type, ...(p.pollOptions || [])].join(" "));
    return terms.every((t) => hay.includes(t));
  });
};

export const SORTS = [["latest", "Latest"], ["top", "Most discussed"]];
const score = (p) => (p.likeCount || 0) + 2 * (p.commentCount || 0);
export const sortPosts = (posts = [], mode = "latest") =>
  [...posts].sort((a, b) => (mode === "top" ? score(b) - score(a) : 0) || ms(b.createdAt) - ms(a.createdAt));

export const trendingTopics = (posts = [], n = 5) => {
  const counts = new Map();
  for (const p of posts) if (p.tag) counts.set(p.tag, (counts.get(p.tag) || 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || specialtyLabel(a.tag).localeCompare(specialtyLabel(b.tag)))
    .slice(0, n);
};

/** Colleagues who posted recently, that the dentist does not follow yet. */
export const suggestAuthors = (posts = [], { uid = "", following = new Set() } = {}, n = 4) => {
  const by = new Map();
  for (const p of posts) {
    if (!p.authorId || p.authorId === uid || following.has(p.authorId)) continue;
    const cur = by.get(p.authorId) || { id: p.authorId, name: p.authorName || "Dentist", qualification: p.authorQualification || "", specialty: p.authorSpecialty, posts: 0 };
    cur.posts += 1;
    by.set(p.authorId, cur);
  }
  return [...by.values()].sort((a, b) => b.posts - a.posts || a.name.localeCompare(b.name)).slice(0, n);
};

export const upcomingEvents = (posts = [], today = dateKey(), n = 5) =>
  posts
    .filter((p) => p.type === "event" && p.eventDate && p.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate) || ms(a.createdAt) - ms(b.createdAt))
    .slice(0, n);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const eventDay = (key = "") => {
  const [y, m, d] = String(key).split("-").map(Number);
  return { day: d || "", month: MONTHS[(m || 1) - 1] || "", year: y || "" };
};
const dayNumber = (key) => { const [y, m, d] = key.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
export const eventWhen = (key, today = dateKey()) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key || "")) return "";
  const n = dayNumber(key) - dayNumber(today);
  if (n < 0) return "Ended";
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  return `In ${n} days`;
};

// ---------------- Add an event to a calendar (.ics) ----------------

const icsText = (v) => String(v || "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
const fold = (line) => {
  if (line.length <= 73) return line;
  const parts = [];
  for (let i = 0; i < line.length; i += 73) parts.push(line.slice(i, i + 73));
  return parts.join("\r\n ");
};
const pad = (n) => String(n).padStart(2, "0");
const compactDate = (key) => key.replace(/-/g, "");
const dayAfter = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}`;
};
const stamp = (now) => `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

/** An all-day calendar entry for an event post. Returns "" when the post has no valid date. */
export const eventIcs = (post, now = new Date()) => {
  if (!post || !/^\d{4}-\d{2}-\d{2}$/.test(post.eventDate || "")) return "";
  const description = `${String(post.body || "").slice(0, 300)}\nShared on MeriDent Connect by ${post.authorName || "a dentist"}.`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MeriDent//Connect//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${post.id || compactDate(post.eventDate)}@meridentconnect`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART;VALUE=DATE:${compactDate(post.eventDate)}`,
    `DTEND;VALUE=DATE:${dayAfter(post.eventDate)}`,
    `SUMMARY:${icsText(post.title)}`,
    `LOCATION:${icsText(post.venue)}`,
    `DESCRIPTION:${icsText(description)}`,
    "END:VEVENT", "END:VCALENDAR",
  ].map(fold).join("\r\n") + "\r\n";
};
export const eventIcsName = (post) => `${String(post?.title || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "event"}.ics`;

// ---------------- Activity on my posts ----------------

/** Remember the counts a dentist has already seen, one [likes, comments] pair per post. */
export const seenSnapshot = (posts = []) => Object.fromEntries(posts.map((p) => [p.id, [p.likeCount || 0, p.commentCount || 0]]));
/** Posts never seen before start at their current counts, so old activity does not show up as new. */
export const withBaseline = (seen = {}, posts = []) => ({ ...seenSnapshot(posts.filter((p) => !seen[p.id])), ...seen });
export const activitySince = (posts = [], seen = {}) => {
  let likes = 0;
  let comments = 0;
  const items = [];
  for (const p of posts) {
    const s = seen[p.id];
    if (!s) continue;
    const l = Math.max(0, (p.likeCount || 0) - s[0]);
    const c = Math.max(0, (p.commentCount || 0) - s[1]);
    if (l || c) { likes += l; comments += c; items.push({ id: p.id, title: p.title, likes: l, comments: c }); }
  }
  return { likes, comments, items };
};
export const activityText = ({ likes = 0, comments = 0 } = {}) => {
  const bits = [];
  if (comments) bits.push(`${comments} new ${comments === 1 ? "comment" : "comments"}`);
  if (likes) bits.push(`${likes} new Helpful ${likes === 1 ? "mark" : "marks"}`);
  return bits.join(" and ");
};

// ---------------- Editing, answers, inviting ----------------

/** What to write to the database when a post is edited: fields to set, and fields to remove. */
export const postPatch = (original = {}, post = {}) => {
  const set = { title: post.title, body: post.body };
  const unset = [];
  if (post.tag) set.tag = post.tag; else if (original.tag) unset.push("tag");
  if (original.type === "event") { set.eventDate = post.eventDate; set.venue = post.venue; }
  return { set, unset };
};
export const canAccept = (post, uid) => Boolean(post && post.type === "question" && uid && post.authorId === uid);
export const isAnswered = (post) => Boolean(post && post.type === "question" && post.acceptedCommentId);

export const SITE_URL = "https://www.meridiandentalos.com";
export const inviteLink = (name = "A colleague") =>
  `https://wa.me/?text=${encodeURIComponent(`${name} invites you to MeriDent Connect, the network for verified dentists: discuss cases, ask peers and find specialists. Join at ${SITE_URL}`)}`;

export const GUIDELINES = [
  "Never share a patient's name, phone number, face or any detail that could identify them.",
  "Do not advertise your clinic, prices or offers. Dental council ethics rules limit advertising by dentists.",
  "Be courteous. Disagree with the idea, not the person.",
  "Say when you are unsure, and share the evidence you used.",
  "Report posts that break these rules. MeriDent staff review reports.",
];

// ---------------- Polls ----------------

/** Votes per option, with percentages. Votes live in fields v0..v4 on the post. */
export const pollResults = (post = {}) => {
  const options = post.pollOptions || [];
  const votes = options.map((_, i) => Math.max(0, post[`v${i}`] || 0));
  const total = votes.reduce((a, b) => a + b, 0);
  return { total, rows: options.map((label, index) => ({ index, label, votes: votes[index], pct: total ? Math.round((votes[index] / total) * 100) : 0 })) };
};
