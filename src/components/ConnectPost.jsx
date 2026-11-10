import React, { useCallback, useEffect, useState } from "react";
import {
  MessageSquare, ThumbsUp, UserPlus, UserCheck, Flag, Trash2, CalendarDays, CalendarPlus, MapPin, BadgeCheck,
  Bookmark, BookmarkCheck, Pencil, CheckCircle2,
} from "lucide-react";
import { specialtyLabel } from "../connect/rules.js";
import {
  typeLabel, pollResults, REPORT_REASONS, LIMITS, validateComment, timeAgo, initials, eventIcs, eventIcsName, eventWhen, canAccept, isAnswered, postPatch,
} from "../connect/feed.js";
import { toMillis } from "../connect/api.js";
import Composer from "./ConnectComposer.jsx";

const field = "w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-aqua-400";
const TYPE_TONE = {
  case: "bg-brand-50 text-brand-700 border-brand-100",
  question: "bg-aqua-50 text-aqua-700 border-aqua-100",
  poll: "bg-sky-100 text-brand-700 border-sky-200",
  update: "bg-slate-100 text-ink border-rule",
  event: "bg-gold-50 text-gold-700 border-gold-500/40",
};
const ghost = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-sky-50";

export const Avatar = ({ name, size = "md" }) => (
  <span aria-hidden="true" className={`shrink-0 rounded-full bg-brand-600 text-white font-display font-extrabold flex items-center justify-center ${size === "lg" ? "w-14 h-14 text-lg ring-4 ring-white" : size === "sm" ? "w-7 h-7 text-[10px]" : "w-10 h-10 text-sm"}`}>{initials(name)}</span>
);

/** Save an event to the dentist's calendar app as an .ics file. */
export const downloadIcs = (post) => {
  const text = eventIcs(post);
  if (!text) return;
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = eventIcsName(post);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

function ReportMenu({ label, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={label} className={`${ghost} text-slate-500 hover:text-rose-600 hover:bg-rose-50`}><Flag className="w-4 h-4" /> Report</button>
      {open && (
        <ul role="menu" className="absolute right-0 bottom-full mb-1 w-60 bg-white border border-rule rounded-xl shadow-lg p-1 z-10">
          {REPORT_REASONS.map((r) => <li key={r} role="none"><button role="menuitem" type="button" onClick={() => { setOpen(false); onPick(r); }} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-sky-50">{r}</button></li>)}
        </ul>
      )}
    </span>
  );
}

function Thread({ post, api, me, admin, showToast, onCount, onAccept }) {
  const [comments, setComments] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const asker = canAccept(post, api.uid);
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
    try {
      await api.deleteComment(post.id, c.id);
      onCount(-1);
      load();
    } catch { showToast("Could not delete the comment."); }
  };
  const report = async (c, reason) => {
    try { await api.report({ postId: post.id, commentId: c.id, reason }); showToast("Reported to MeriDent. Thank you."); } catch { showToast("Could not send the report."); }
  };

  const ordered = comments && post.acceptedCommentId ? [...comments].sort((a, b) => (b.id === post.acceptedCommentId) - (a.id === post.acceptedCommentId)) : comments;
  return (
    <div className="border-t border-slate-100 pt-3 space-y-3" data-testid={`thread-${post.id}`}>
      {ordered === null ? <p className="text-xs text-slate-500" role="status">Loading comments…</p> : ordered.length === 0 ? <p className="text-xs text-slate-500">No comments yet. Share your view.</p> : (
        <ul className="space-y-2.5">
          {ordered.map((c) => {
            const isAnswer = post.acceptedCommentId === c.id;
            return (
              <li key={c.id} className="flex gap-2.5">
                <Avatar name={c.authorName} size="sm" />
                <div className={`flex-1 rounded-xl px-3 py-2 ${isAnswer ? "bg-aqua-50 border border-aqua-100" : "bg-sky-50"}`}>
                  <div className="text-xs flex flex-wrap items-center gap-x-2">
                    <span className="font-bold text-ink">{c.authorName}</span>
                    <span className="text-slate-500">{specialtyLabel(c.authorSpecialty)} · {timeAgo(toMillis(c.createdAt))}</span>
                    {isAnswer && <span className="inline-flex items-center gap-1 font-bold text-aqua-700"><CheckCircle2 className="w-3.5 h-3.5" /> Accepted answer</span>}
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{c.text}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] items-center">
                    {asker && c.authorId !== api.uid && (
                      <button type="button" onClick={() => onAccept(post, isAnswer ? "" : c.id)} className="text-aqua-700 hover:underline font-semibold">{isAnswer ? "Remove answer mark" : "Mark as answer"}</button>
                    )}
                    {(c.authorId === api.uid || admin)
                      ? <button type="button" onClick={() => remove(c)} className="text-slate-500 hover:text-rose-600 font-semibold">Delete</button>
                      : <ReportMenu label={`Report comment by ${c.authorName}`} onPick={(r) => report(c, r)} />}
                  </div>
                </div>
              </li>
            );
          })}
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

function CaseImages({ post, api }) {
  const [imgs, setImgs] = useState(null);
  const [big, setBig] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    api.getPostImages(post.id, post.imageCount).then((r) => live && setImgs(r)).catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [api, post.id, post.imageCount]);
  if (failed) return <p className="text-xs text-slate-500">Could not load the images.</p>;
  if (!imgs) return <p className="text-xs text-slate-500" role="status">Loading images…</p>;
  return (
    <>
      <ul className="flex flex-wrap gap-2">
        {imgs.map((src, i) => (
          <li key={i}>
            <button type="button" onClick={() => setBig(src)} aria-label={`View image ${i + 1} of ${imgs.length} full size`}>
              <img src={src} alt={`Case image ${i + 1}`} className="h-28 w-28 object-cover rounded-lg border border-rule" />
            </button>
          </li>
        ))}
      </ul>
      {big && (
        <div role="dialog" aria-label="Case image" className="fixed inset-0 z-[60] bg-ink/80 flex items-center justify-center p-4" onClick={() => setBig(null)}>
          <img src={big} alt="Case image, full size" className="max-h-full max-w-full rounded-lg bg-white" />
          <button type="button" aria-label="Close image" className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white text-ink font-bold" onClick={() => setBig(null)}>×</button>
        </div>
      )}
    </>
  );
}

function Poll({ post, vote, canSee, onVote }) {
  const { total, rows } = pollResults(post);
  const showResults = vote !== undefined || canSee;
  return (
    <div role="group" aria-label="Poll" className="space-y-2">
      {rows.map((r) => showResults ? (
        <div key={r.index} className={`relative overflow-hidden rounded-lg border px-3 py-2 text-sm ${vote === r.index ? "border-brand-500" : "border-rule"}`}>
          <div className="absolute inset-y-0 left-0 bg-sky-100" style={{ width: `${r.pct}%` }} aria-hidden="true" />
          <div className="relative flex justify-between gap-3"><span className={vote === r.index ? "font-bold text-ink" : "text-slate-800"}>{r.label}{vote === r.index ? " (your vote)" : ""}</span><span className="font-semibold text-slate-600 tabular">{r.pct}% · {r.votes}</span></div>
        </div>
      ) : (
        <button key={r.index} type="button" onClick={() => onVote(post, r.index)} className="w-full text-left rounded-lg border border-rule px-3 py-2 text-sm hover:bg-sky-50 hover:border-brand-500">{r.label}</button>
      ))}
      <p className="text-xs text-slate-500">{total} {total === 1 ? "vote" : "votes"}{showResults ? "" : ". Vote to see the results."}</p>
    </div>
  );
}

/** One post in the feed. All changes go through the callbacks, so every list stays in step. */
export default function PostCard({ post, api, me, admin, liked, saved, followed, vote, onVote, onLike, onSave, onFollow, onDelete, onEdit, onAccept, onCount, onAuthor, showToast }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const mine = post.authorId === api.uid;
  const likes = post.likeCount || 0;
  const comments = post.commentCount || 0;
  const author = { id: post.authorId, name: post.authorName, qualification: post.authorQualification, specialty: post.authorSpecialty };

  const report = async (reason) => {
    try { await api.report({ postId: post.id, reason }); showToast("Reported to MeriDent. Thank you."); } catch { showToast("Could not send the report."); }
  };

  if (editing) {
    return <Composer me={me} existing={post} onCancel={() => setEditing(false)} onSubmit={async (v) => { await onEdit(post, postPatch(post, v)); setEditing(false); showToast("Post updated"); }} />;
  }

  return (
    <article className="bg-white border border-rule rounded-xl p-4 space-y-3" aria-label={post.title}>
      <header className="flex items-start gap-3">
        <Avatar name={post.authorName} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <button type="button" onClick={() => onAuthor(author)} className="font-bold text-ink hover:text-brand-700 hover:underline text-left">{post.authorName}</button>
            <BadgeCheck className="w-4 h-4 text-aqua-700" aria-label="Verified dentist" />
            {post.authorQualification && <span className="text-slate-500 text-xs">{post.authorQualification}</span>}
          </div>
          <div className="text-xs text-slate-500">{specialtyLabel(post.authorSpecialty)} · {timeAgo(toMillis(post.createdAt))}{post.editedAt ? " · edited" : ""}</div>
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
        {isAnswered(post) && <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-aqua-50 text-aqua-700 border-aqua-100"><CheckCircle2 className="w-3 h-3" /> Answered</span>}
        {post.tag && <span className="text-[11px] font-semibold text-slate-500">#{specialtyLabel(post.tag)}</span>}
      </div>
      <div>
        <h3 className="font-display font-bold text-lg text-ink leading-snug">{post.title}</h3>
        <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">{post.body}</p>
      </div>
      {post.imageCount > 0 && <CaseImages post={post} api={api} />}
      {post.type === "poll" && <Poll post={post} vote={vote} canSee={mine} onVote={onVote} />}
      {post.type === "event" && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-gold-700 bg-gold-50 rounded-lg px-3 py-2">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{new Date(`${post.eventDate}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}{eventWhen(post.eventDate) ? ` · ${eventWhen(post.eventDate)}` : ""}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{post.venue}</span>
          {eventWhen(post.eventDate) !== "Ended" && (
            <button type="button" onClick={() => downloadIcs(post)} className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gold-500/40 hover:bg-gold-50"><CalendarPlus className="w-4 h-4" /> Add to calendar</button>
          )}
        </div>
      )}
      <footer className="flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-2">
        <button type="button" onClick={() => onLike(post, !liked)} aria-pressed={liked} aria-label={`Helpful, ${likes}`} className={`${ghost} ${liked ? "text-brand-700" : ""}`}>
          <ThumbsUp className={`w-4 h-4 ${liked ? "fill-brand-100" : ""}`} /> Helpful · {likes}
        </button>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className={ghost}>
          <MessageSquare className="w-4 h-4" /> Discuss · {comments}
        </button>
        <button type="button" onClick={() => onSave(post, !saved)} aria-pressed={saved} aria-label={saved ? "Saved. Remove from saved posts" : "Save this post"} className={`${ghost} ${saved ? "text-aqua-700" : ""}`}>
          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />} {saved ? "Saved" : "Save"}
        </button>
        <span className="flex-1" />
        {mine && <button type="button" onClick={() => setEditing(true)} className={`${ghost} text-slate-500`}><Pencil className="w-4 h-4" /> Edit</button>}
        {(mine || admin) ? (
          <button type="button" onClick={() => onDelete(post)} className={`${ghost} text-slate-500 hover:text-rose-600 hover:bg-rose-50`}><Trash2 className="w-4 h-4" /> Delete</button>
        ) : (
          <ReportMenu label={`Report ${post.title}`} onPick={report} />
        )}
      </footer>
      {open && <Thread post={post} api={api} me={me} admin={admin} showToast={showToast} onCount={(d) => onCount(post.id, d)} onAccept={onAccept} />}
    </article>
  );
}
