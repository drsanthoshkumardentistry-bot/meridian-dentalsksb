import React from "react";
import { BadgeCheck, CalendarDays, CalendarPlus, Hash, UserPlus, UserCheck, Send, Bell, X } from "lucide-react";
import { specialtyLabel } from "../connect/rules.js";
import { trendingTopics, suggestAuthors, eventDay, eventWhen, inviteLink, activityText, GUIDELINES } from "../connect/feed.js";
import { Avatar, downloadIcs } from "./ConnectPost.jsx";

const card = "bg-white border border-rule rounded-xl";
const heading = "font-display font-bold text-sm text-ink";

/** Who you are on the network, with your numbers. */
export function ProfileCard({ me, postCount, followers, followingCount, onMine, onFollowing }) {
  const stat = (label, value, onClick) => {
    const inner = (<><span className="block font-display font-extrabold text-lg text-ink tabular">{value ?? "–"}</span><span className="block text-[11px] text-slate-500">{label}</span></>);
    return onClick
      ? <button type="button" onClick={onClick} className="py-1 rounded-lg hover:bg-sky-50 text-center">{inner}</button>
      : <div className="py-1 text-center">{inner}</div>;
  };
  return (
    <aside className={`${card} overflow-hidden`} aria-label="Your profile">
      <div className="hidden lg:block h-14 bg-gradient-to-r from-brand-600 to-aqua-500" />
      <div className="p-3 lg:px-4 lg:pb-4 lg:pt-0 flex items-center gap-3 lg:block">
        <div className="lg:-mt-7"><Avatar name={me.fullName} size="lg" /></div>
        <div className="min-w-0 lg:mt-2">
          <div className="flex items-center gap-1.5 font-display font-bold text-ink"><span className="truncate">{me.fullName}</span><BadgeCheck className="w-4 h-4 shrink-0 text-aqua-500" aria-label="Verified dentist" /></div>
          <div className="text-xs text-slate-500">{[me.qualification, specialtyLabel(me.specialty)].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 px-3 pb-3 lg:px-4 border-t border-slate-100 pt-2">
        {stat("Posts", postCount, onMine)}
        {stat("Followers", followers)}
        {stat("Following", followingCount, onFollowing)}
      </div>
    </aside>
  );
}

export function ActivityBanner({ activity, onView, onDismiss }) {
  if (!activity.items.length) return null;
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-gold-500/40 bg-gold-50 px-4 py-3 text-sm text-ink">
      <Bell className="w-4 h-4 text-gold-700 shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-[12rem]">Your posts have {activityText(activity)}.</span>
      <button type="button" onClick={onView} className="px-3 py-1.5 rounded-lg bg-ink text-white text-xs font-bold">View my posts</button>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="p-1.5 rounded-lg text-slate-500 hover:bg-white"><X className="w-4 h-4" /></button>
    </div>
  );
}

export function Guidelines() {
  return (
    <details className={`${card} px-4 py-2.5 text-xs text-slate-600 group`}>
      <summary className="cursor-pointer font-semibold text-ink">Verified dentists only. Community guidelines</summary>
      <ul className="mt-2 mb-1 list-disc pl-5 space-y-1">{GUIDELINES.map((g) => <li key={g}>{g}</li>)}</ul>
    </details>
  );
}

export function EventsCard({ events, onSeeAll }) {
  return (
    <section className={`${card} p-4`} aria-label="Upcoming events">
      <h2 className={`${heading} flex items-center gap-2`}><CalendarDays className="w-4 h-4 text-gold-700" aria-hidden="true" /> Upcoming events</h2>
      {events.length === 0 ? <p className="mt-2 text-xs text-slate-500">No upcoming events. Post one for your colleagues.</p> : (
        <ul className="mt-3 space-y-3">
          {events.map((e) => {
            const d = eventDay(e.eventDate);
            return (
              <li key={e.id} className="flex gap-3">
                <div className="shrink-0 w-11 rounded-lg bg-gold-50 border border-gold-500/40 text-center py-1" aria-hidden="true">
                  <div className="font-display font-extrabold text-base text-gold-700 leading-none">{d.day}</div>
                  <div className="text-[10px] font-semibold text-gold-700">{d.month}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-ink leading-snug">{e.title}</div>
                  <div className="text-[11px] text-slate-500">{eventWhen(e.eventDate)} · {e.venue}</div>
                </div>
                <button type="button" onClick={() => downloadIcs(e)} aria-label={`Add ${e.title} to calendar`} className="self-start p-1.5 rounded-lg text-slate-500 hover:bg-sky-50"><CalendarPlus className="w-4 h-4" /></button>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" onClick={onSeeAll} className="mt-3 text-xs font-bold text-brand-700 hover:underline">See all events</button>
    </section>
  );
}

export function TopicsCard({ posts, active, onPick }) {
  const topics = trendingTopics(posts);
  if (!topics.length) return null;
  return (
    <section className={`${card} p-4`} aria-label="Trending topics">
      <h2 className={`${heading} flex items-center gap-2`}><Hash className="w-4 h-4 text-aqua-600" aria-hidden="true" /> Trending topics</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {topics.map(({ tag, count }) => (
          <button key={tag} type="button" aria-pressed={active === tag} onClick={() => onPick(active === tag ? "" : tag)}
            className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${active === tag ? "bg-ink text-white border-ink" : "bg-sky-50 text-brand-700 border-sky-200 hover:bg-sky-100"}`}>
            {specialtyLabel(tag)} <span className="opacity-70">{count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function PeopleCard({ posts, uid, following, onFollow, onOpen }) {
  const people = suggestAuthors(posts, { uid, following });
  if (!people.length) return null;
  return (
    <section className={`${card} p-4`} aria-label="Colleagues to follow">
      <h2 className={heading}>Colleagues to follow</h2>
      <ul className="mt-3 space-y-3">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-2.5">
            <Avatar name={p.name} size="sm" />
            <div className="min-w-0 flex-1">
              <button type="button" onClick={() => onOpen(p)} className="block text-xs font-bold text-ink hover:text-brand-700 hover:underline truncate max-w-full text-left">{p.name}</button>
              <div className="text-[11px] text-slate-500 truncate">{specialtyLabel(p.specialty)}</div>
            </div>
            <button type="button" onClick={() => onFollow(p.id, true)} aria-label={`Follow ${p.name}`} className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-brand-100 text-brand-700 text-[11px] font-semibold hover:bg-brand-50"><UserPlus className="w-3 h-3" /> Follow</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InviteCard({ name }) {
  return (
    <section className={`${card} p-4`} aria-label="Invite a colleague">
      <h2 className={heading}>Invite a colleague</h2>
      <p className="mt-1 text-xs text-slate-600">The network is as useful as the dentists on it. Colleagues are verified by MeriDent before they can read or post.</p>
      <a href={inviteLink(name)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"><Send className="w-4 h-4" /> Invite on WhatsApp</a>
    </section>
  );
}

/** Heading card when you are looking at one colleague's posts. */
export function AuthorHeader({ info, count, followed, onFollow, onBack }) {
  return (
    <section className={`${card} p-4 flex flex-wrap items-center gap-3`} aria-label={`Posts by ${info.name}`}>
      <Avatar name={info.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-display font-bold text-ink">{info.name}<BadgeCheck className="w-4 h-4 text-aqua-500" aria-label="Verified dentist" /></div>
        <div className="text-xs text-slate-500">{[info.qualification, specialtyLabel(info.specialty)].filter(Boolean).join(" · ")}{count !== null ? ` · ${count} ${count === 1 ? "post" : "posts"}` : ""}</div>
      </div>
      <button type="button" onClick={() => onFollow(info.id, !followed)} aria-pressed={followed}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${followed ? "bg-aqua-50 text-aqua-700 border-aqua-100" : "bg-white text-brand-700 border-brand-100 hover:bg-brand-50"}`}>
        {followed ? <><UserCheck className="w-3.5 h-3.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
      </button>
      <button type="button" onClick={onBack} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">Back to the feed</button>
    </section>
  );
}
