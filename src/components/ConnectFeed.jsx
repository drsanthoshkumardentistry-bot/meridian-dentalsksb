import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, ThumbsUp, UserPlus, UserCheck, Flag, Trash2, CalendarDays, MapPin, BadgeCheck } from "lucide-react";
import { SPECIALTIES, specialtyLabel } from "../connect/rules.js";
import { POST_TYPES, typeLabel, REPORT_REASONS, LIMITS, FEED_FILTERS, validatePost, buildPost, validateComment, timeAgo, filterPosts, initials } from "../connect/feed.js";
import { toMillis } from "../connect/api.js";
import { dateKey } from "../reminders.js";

const field = "w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-aqua-400";
const TYPE_TONE = {
  case: "bg-brand-50 text-brand-700 border-brand-100",
  question: "bg-aqua-50 text-aqua-700 border-aqua-100",
  update: "bg-slate-100 text-ink border-slate-200",
  event: "bg-gold-50 text-gold-700 border-gold-500/40",
};

function Composer({ me, api, onPosted, showToast }) {
  const empty = { type: "case", title: "", body: "", tag: "", eventDate: "", venue: "", deidentified: false };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const needsConfirm = form.type === "case" || form.type === "question";

  const submit = async (e) => {
    e.preventDefault();
    const v = validatePost(form);
    if (!v.ok) { setError(v.error); return; }
    if (v.warnings.length && !window.confirm(`Your post has ${v.warnings[0]}. Check that no patient can be identified. Post anyway?`)) return;
    setBusy(true); setError("");
    try {
      await api.createPost(buildPost(v.post, api.uid, me));
      setForm(empty); setOpen(false);
      showToast("Posted to the network");
      onPosted();
    } catch {
      setError("Could not post. Check your connection and try again.");
    } finally { setBusy(false); }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left bg-white border border-rule rounded-2xl px-4 py-3.5 text-sm text-slate-500 hover:border-aqua-400 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs">{initials(me.fullName)}</span>
        Start a discussion, ask peers or share a tip
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="bg-white border border-rule rounded-2xl p-4 space-y-3" noValidate aria-label="New post">
      <div role="radiogroup" aria-label="Post type" className="flex flex-wrap gap-2">
        {POST_TYPES.map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={form.type === id} onClick={() => setForm({ ...form, type: id })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${form.type === id ? "bg-ink text-white border-ink" : "bg-white text-slate-700 border-slate-200 hover:bg-sky-50"}`}>{label}</button>
        ))}
      </div>
      <div>
        <label htmlFor="post-title" className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
        <input id="post-title" className={field} maxLength={LIMITS.title} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={form.type === "event" ? "e.g. Hands-on CBCT reading workshop" : "e.g. Recurrent abscess after RCT in 46"} />
      </div>
      <div>
        <label htmlFor="post-body" className="block text-xs font-semibold text-slate-600 mb-1">Details</label>
        <textarea id="post-body" rows={4} className={field} maxLength={LIMITS.body} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder={form.type === "case" ? "Age and sex, history, findings, what you tried, and what you want to know." : ""} />
        <div className="text-[11px] text-slate-400 text-right">{form.body.length}/{LIMITS.body}</div>
      </div>
      {form.type === "event" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label htmlFor="post-date" className="block text-xs font-semibold text-slate-600 mb-1">Event date</label>
            <input id="post-date" type="date" min={dateKey()} className={field} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></div>
          <div><label htmlFor="post-venue" className="block text-xs font-semibold text-slate-600 mb-1">Place or platform</label>
            <input id="post-venue" className={field} maxLength={LIMITS.venue} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Coimbatore, or Zoom" /></div>
        </div>
      )}
      <div>
        <label htmlFor="post-tag" className="block text-xs font-semibold text-slate-600 mb-1">Topic (optional)</label>
        <select id="post-tag" className={field} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
          <option value="">No topic</option>
          {SPECIALTIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>
      {needsConfirm && (
        <label className="flex items-start gap-2 text-xs text-slate-700 bg-gold-50 border border-gold-500/40 rounded-lg p-3">
          <input type="checkbox" className="mt-0.5" checked={form.deidentified} onChange={(e) => setForm({ ...form, deidentified: e.target.checked })} />
          <span>I have removed the patient's name, phone number and anything else that could identify them. Any image I describe shows no face or name.</span>
        </label>
      )}
      {error && <p role="alert" className="text-xs text-rose-600 font-medium">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => { setOpen(false); setError(""); }} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold disabled:opacity-60">{busy ? "Posting…" : "Post"}</button>
      </div>
    </form>
  );
}

function Thread({ post, api, me, admin, showToast, onCount }) {
  const [comments, setComments] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setComments(await api.listComments(post.id)); } catch { setError("Could not load comments."); setComments([]); }
  }, [api, post.id]);
  useEffect(() => { load(); }, [load]);

  const send = async (e) => {
    e.preventDefault();
    const v = validateComment(text);
    if (!v.ok) { setError(v.error); return; }
    setError("");
    try { await api.addComment(post.id, me, v.text); setText(""); onCount(1); load(); }
    catch { setError("Could not post your comment. Try again."); }
  };
  const remove = async (c) => {
    if (!window.confirm("Delete this comment?")) return;
    try { await api.deleteComment(post.id, c.id); onCount(-1); load(); } catch { showToast("Could not delete the comment."); }
  };
  const report = async (c) => {
    const reason = REPORT_REASONS[0];
    try { await api.report({ postId: post.id, commentId: c.id, reason }); showToast("Reported to MeriDent. Thank you."); } catch { showToast("Could not send the report."); }
  };

  return (
    <div className="border-t border-slate-100 pt-3 space-y-3" data-testid={`thread-${post.id}`}>
      {comments === null ? <p className="text-xs text-slate-500" role="status">Loading comments…</p> : comments.length === 0 ? <p className="text-xs text-slate-500">No comments yet. Share your view.</p> : (
        <ul className="space-y-2.5">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <span className="w-7 h-7 shrink-0 rounded-full bg-sky-100 text-brand-700 text-[10px] font-bold flex items-center justify-center">{initials(c.authorName)}</span>
              <div className="flex-1 bg-sky-50 rounded-xl px-3 py-2">
                <div className="text-xs"><span className="font-bold text-ink">{c.authorName}</span> <span className="text-slate-500">{specialtyLabel(c.authorSpecialty)} · {timeAgo(toMillis(c.createdAt))}</span></div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{c.text}</p>
                <div className="mt-1 flex gap-3 text-[11px]">
                  {(c.authorId === api.uid || admin) ? <button type="button" onClick={() => remove(c)} className="text-slate-400 hover:text-rose-600 font-semibold">Delete</button>
                    : <button type="button" onClick={() => report(c)} className="text-slate-400 hover:text-rose-600 font-semibold">Report</button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={send} className="flex gap-2" noValidate>
        <input aria-label={`Comment on ${post.title}`} className={field} maxLength={LIMITS.comment} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment" />
        <button type="submit" className="px-4 py-2 rounded-lg bg-ink text-white text-xs font-bold">Comment</button>
      </form>
      {error && <p role="alert" className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

function PostCard({ post, api, me, admin, liked, followed, onLike, onFollow, onDelete, showToast }) {
  const [open, setOpen] = useState(false);
  const [extra, setExtra] = useState(0);
  const [reporting, setReporting] = useState(false);
  const mine = post.authorId === api.uid;
  const likes = (post.likeCount || 0);
  const comments = Math.max(0, (post.commentCount || 0) + extra);

  const report = async (reason) => {
    setReporting(false);
    try { await api.report({ postId: post.id, reason }); showToast("Reported to MeriDent. Thank you."); } catch { showToast("Could not send the report."); }
  };

  return (
    <article className="bg-white border border-rule rounded-2xl p-4 space-y-3" aria-label={post.title}>
      <header className="flex items-start gap-3">
        <span className="w-10 h-10 shrink-0 rounded-full bg-brand-600 text-white font-display font-extrabold text-sm flex items-center justify-center">{initials(post.authorName)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className="font-bold text-ink">{post.authorName}</span>
            <BadgeCheck className="w-4 h-4 text-aqua-500" aria-label="Verified dentist" />
            {post.authorQualification && <span className="text-slate-500 text-xs">{post.authorQualification}</span>}
          </div>
          <div className="text-xs text-slate-500">{specialtyLabel(post.authorSpecialty)} · {timeAgo(toMillis(post.createdAt))}</div>
        </div>
        {!mine && (
          <button type="button" onClick={() => onFollow(post.authorId, !followed)} aria-pressed={followed}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${followed ? "bg-aqua-50 text-aqua-700 border-aqua-100" : "bg-white text-brand-700 border-brand-100 hover:bg-brand-50"}`}>
            {followed ? <><UserCheck className="w-3.5 h-3.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
          </button>
        )}
      </header>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${TYPE_TONE[post.type] || TYPE_TONE.update}`}>{typeLabel(post.type)}</span>
        {post.tag && <span className="text-[11px] font-semibold text-slate-500">#{specialtyLabel(post.tag)}</span>}
      </div>
      <div>
        <h3 className="font-display font-bold text-lg text-ink leading-snug">{post.title}</h3>
        <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">{post.body}</p>
      </div>
      {post.type === "event" && (
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-gold-700 bg-gold-50 rounded-lg px-3 py-2">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{new Date(`${post.eventDate}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{post.venue}</span>
        </div>
      )}
      <footer className="flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-2">
        <button type="button" onClick={() => onLike(post, !liked)} aria-pressed={liked} aria-label={`Helpful, ${likes}`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-sky-50 ${liked ? "text-brand-700" : ""}`}>
          <ThumbsUp className={`w-4 h-4 ${liked ? "fill-brand-100" : ""}`} /> Helpful · {likes}
        </button>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-sky-50">
          <MessageSquare className="w-4 h-4" /> Discuss · {comments}
        </button>
        <span className="flex-1" />
        {(mine || admin) ? (
          <button type="button" onClick={() => onDelete(post)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /> Delete</button>
        ) : (
          <div className="relative">
            <button type="button" onClick={() => setReporting(!reporting)} aria-expanded={reporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"><Flag className="w-4 h-4" /> Report</button>
            {reporting && (
              <ul role="menu" className="absolute right-0 bottom-full mb-1 w-60 bg-white border border-rule rounded-xl shadow-lg p-1 z-10">
                {REPORT_REASONS.map((r) => <li key={r} role="none"><button role="menuitem" type="button" onClick={() => report(r)} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-sky-50">{r}</button></li>)}
              </ul>
            )}
          </div>
        )}
      </footer>
      {open && <Thread post={post} api={api} me={me} admin={admin} showToast={showToast} onCount={(d) => setExtra((x) => x + d)} />}
    </article>
  );
}

/** Docplexus-style network for verified dentists: case discussions, questions, tips and events. */
export default function ConnectFeed({ api, me, admin, showToast }) {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | error
  const [liked, setLiked] = useState(new Set());
  const [following, setFollowing] = useState(new Set());
  const [filter, setFilter] = useState("all");
  const [tag, setTag] = useState("");

  const load = useCallback(async (more = false, from = null) => {
    try {
      const page = await api.listPosts(more ? from : null);
      const ids = page.posts.map((p) => p.id);
      const [mine, follows] = await Promise.all([api.likedSet(ids), more ? Promise.resolve(null) : api.followingSet()]);
      setPosts((prev) => (more ? [...prev, ...page.posts] : page.posts));
      setCursor(page.cursor);
      setLiked((prev) => new Set([...(more ? prev : []), ...mine]));
      if (follows) setFollowing(follows);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => filterPosts(posts, { filter, following, uid: api.uid, tag }), [posts, filter, following, api.uid, tag]);

  const like = async (post, on) => {
    setLiked((s) => { const n = new Set(s); on ? n.add(post.id) : n.delete(post.id); return n; });
    setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, likeCount: Math.max(0, (p.likeCount || 0) + (on ? 1 : -1)) } : p)));
    try { await api.setLike(post.id, on); } catch { showToast("Could not save. Check your connection."); load(); }
  };
  const follow = async (id, on) => {
    setFollowing((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });
    try { await api.setFollow(id, on); } catch { showToast("Could not save. Check your connection."); load(); }
  };
  const remove = async (post) => {
    if (!window.confirm("Delete this post and its comments?")) return;
    try { await api.deletePost(post.id); setPosts((ps) => ps.filter((p) => p.id !== post.id)); showToast("Post deleted"); } catch { showToast("Could not delete the post."); }
  };

  return (
    <div className="max-w-3xl space-y-4" data-testid="connect-feed">
      <p className="text-xs text-slate-600 bg-sky-50 border border-sky-100 rounded-xl px-4 py-2.5">
        Only dentists verified by MeriDent can read or post here. Never share patient names, phone numbers or faces. Posts and comments can be reported.
      </p>
      <Composer me={me} api={api} onPosted={() => load()} showToast={showToast} />
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter posts">
        {FEED_FILTERS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${filter === id ? "bg-ink text-white border-ink" : "bg-white text-slate-700 border-slate-200 hover:bg-sky-50"}`}>{label}</button>
        ))}
        <select aria-label="Filter by topic" value={tag} onChange={(e) => setTag(e.target.value)} className="ml-auto px-3 py-1.5 border border-slate-200 rounded-full bg-white text-xs font-semibold text-slate-700">
          <option value="">All topics</option>
          {SPECIALTIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>
      {state === "loading" && <p role="status" className="text-sm text-slate-500">Loading the network…</p>}
      {state === "error" && <p role="alert" className="rounded-xl border border-gold-500/40 bg-gold-50 p-4 text-sm text-gold-700">Could not load the network. Check your connection and <button type="button" onClick={() => load()} className="font-bold underline">try again</button>.</p>}
      {state === "ready" && shown.length === 0 && (
        <div className="bg-white border border-rule rounded-2xl p-8 text-center text-sm text-slate-600">
          {posts.length === 0 ? "No posts yet. Start the first discussion for your colleagues." : filter === "following" ? "Follow a dentist to see their posts here." : "Nothing matches this filter."}
        </div>
      )}
      {shown.map((p) => (
        <PostCard key={p.id} post={p} api={api} me={me} admin={admin} liked={liked.has(p.id)} followed={following.has(p.authorId)}
          onLike={like} onFollow={follow} onDelete={remove} showToast={showToast} />
      ))}
      {state === "ready" && cursor && <button type="button" onClick={() => load(true, cursor)} className="w-full py-2.5 rounded-xl border border-rule bg-white text-xs font-bold text-brand-700 hover:bg-sky-50">Load older posts</button>}
    </div>
  );
}

/** Staff view: reported posts and comments, with a one-click removal. */
export function ReportsQueue({ api, showToast }) {
  const [rows, setRows] = useState(null);
  const load = useCallback(async () => {
    try {
      const reports = await api.listReports();
      const withPosts = await Promise.all(reports.map(async (r) => ({ ...r, post: await api.getPost(r.postId).catch(() => null) })));
      setRows(withPosts);
    } catch { showToast("Could not load reports."); setRows([]); }
  }, [api, showToast]);
  useEffect(() => { load(); }, [load]);

  if (rows === null) return <p role="status" className="text-sm text-slate-500">Loading reports…</p>;
  if (!rows.length) return <p className="text-sm text-slate-600">No reports. The network is quiet.</p>;
  return (
    <ul className="space-y-3 max-w-3xl" aria-label="Reports">
      {rows.map((r) => (
        <li key={r.id} className="bg-white border border-rule rounded-2xl p-4 text-sm space-y-2">
          <div className="font-bold text-ink">{r.reason}{r.commentId ? " (comment)" : ""}</div>
          {r.post ? <div className="text-slate-700"><span className="font-semibold">{r.post.title}</span> by {r.post.authorName}<p className="text-xs text-slate-500 line-clamp-3">{r.post.body}</p></div> : <div className="text-slate-500">The post is already gone.</div>}
          <div className="flex gap-2">
            {r.post && <button type="button" onClick={async () => { if (!window.confirm("Remove this post for everyone?")) return; try { await api.deletePost(r.postId); await api.dismissReport(r.id); load(); } catch { showToast("Could not remove the post."); } }} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold">Remove post</button>}
            <button type="button" onClick={async () => { try { await api.dismissReport(r.id); load(); } catch { showToast("Could not clear the report."); } }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">Dismiss</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
