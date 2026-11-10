import React from "react";
import { Search, RefreshCw } from "lucide-react";
import { SPECIALTIES } from "../connect/rules.js";
import { FEED_FILTERS, SORTS, buildPost } from "../connect/feed.js";
import useConnectFeed from "../connect/useFeed.js";
import Composer from "./ConnectComposer.jsx";
import PostCard from "./ConnectPost.jsx";
import { ProfileCard, ActivityBanner, Guidelines, EventsCard, TopicsCard, PeopleCard, InviteCard, AuthorHeader } from "./ConnectSidebar.jsx";
import ReportsQueue from "./ConnectReports.jsx";

export { ReportsQueue };

const chip = (on) => `px-3 py-1.5 rounded-full border text-xs font-semibold ${on ? "bg-ink text-white border-ink" : "bg-white text-slate-700 border-rule hover:bg-sky-50"}`;
const select = "px-3 py-1.5 border border-rule rounded-full bg-white text-xs font-semibold text-slate-700";

function emptyText(f, hasMore) {
  const more = hasMore ? " Load older posts to search further back." : "";
  if (f.view.query.trim()) return `No posts match "${f.view.query.trim()}".${more}`;
  if (f.author) return "This dentist has not posted yet.";
  if (f.view.filter === "mine") return "You have not posted yet. Start a discussion above.";
  if (f.view.filter === "saved") return "Nothing saved yet. Tap Save on a post to keep it here.";
  if (f.view.filter === "following") return `Follow a dentist to see their posts here.${more}`;
  if (f.feedPosts.length === 0) return "No posts yet. Start the first discussion for your colleagues.";
  return `Nothing matches this filter.${more}`;
}

/** The professional network for verified dentists: case discussions, questions, tips and events. */
export default function ConnectFeed({ api, me, admin, showToast }) {
  const f = useConnectFeed({ api, showToast });
  const { view } = f;

  const card = (p) => (
    <PostCard key={p.id} post={p} api={api} me={me} admin={admin}
      vote={f.votes[p.id]} onVote={f.vote} liked={f.liked.has(p.id)} saved={f.saved.has(p.id)} followed={f.following.has(p.authorId)}
      onLike={f.like} onSave={f.save} onFollow={f.follow} onDelete={(post) => { if (window.confirm("Delete this post and its comments?")) f.remove(post); }}
      onEdit={f.edit} onAccept={f.accept} onCount={(id, d) => f.bump(id, "commentCount", d)} onAuthor={f.openAuthor} showToast={showToast} />
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)_17rem] xl:grid-cols-[16rem_minmax(0,1fr)_18rem] items-start" data-testid="connect-feed">
      <div className="lg:sticky lg:top-4">
        <ProfileCard me={me} postCount={f.postCount} followers={f.followers} followingCount={f.following.size}
          onMine={() => f.setFilter("mine")} onFollowing={() => f.setFilter("following")} />
      </div>

      <div className="space-y-4 min-w-0">
        <ActivityBanner activity={f.activity} onDismiss={f.markSeen} onView={() => { f.markSeen(); f.setFilter("mine"); }} />
        <Guidelines />
        <Composer me={me} onSubmit={async (post, images) => { await f.publish(buildPost(post, api.uid, me), images); showToast("Posted to the network"); }} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input type="search" aria-label="Search posts" placeholder="Search posts, topics and colleagues" value={view.query} onChange={(e) => f.setView({ query: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-rule rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-aqua-400" />
          </div>
          <select aria-label="Filter by topic" value={view.tag} onChange={(e) => f.setView({ tag: e.target.value })} className={select}>
            <option value="">All topics</option>
            {SPECIALTIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <select aria-label="Sort posts" value={view.sort} onChange={(e) => f.setView({ sort: e.target.value })} className={select}>
            {SORTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <button type="button" onClick={f.refresh} disabled={f.refreshing} aria-label="Refresh the feed" className="p-2 rounded-full border border-rule bg-white text-slate-600 hover:bg-sky-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${f.refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter posts">
          {FEED_FILTERS.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={!f.author && view.filter === id} onClick={() => f.setFilter(id)} className={chip(!f.author && view.filter === id)}>{label}</button>
          ))}
        </div>

        {f.author && <AuthorHeader info={f.author.info} count={f.author.ids ? f.author.ids.length : null} followed={f.following.has(f.author.info.id)} onFollow={f.follow} onBack={f.closeAuthor} />}

        {f.status === "loading" && <p role="status" className="text-sm text-slate-500">Loading the network…</p>}
        {f.status === "error" && <p role="alert" className="rounded-xl border border-gold-500/40 bg-gold-50 p-4 text-sm text-gold-700">Could not load the network. Check your connection and <button type="button" onClick={f.refresh} className="font-bold underline">try again</button>.</p>}
        {f.status === "ready" && f.sourceLoading && <p role="status" className="text-sm text-slate-500">Loading posts…</p>}
        {f.status === "ready" && !f.sourceLoading && f.shown.length === 0 && (
          <div className="bg-white border border-rule rounded-xl p-8 text-center text-sm text-slate-600">{emptyText(f, Boolean(f.cursor))}</div>
        )}
        {f.status === "ready" && f.shown.map(card)}
        {f.status === "ready" && f.cursor && !f.author && view.filter !== "mine" && view.filter !== "saved" && (
          <button type="button" onClick={f.loadMore} className="w-full py-2.5 rounded-xl border border-rule bg-white text-xs font-bold text-brand-700 hover:bg-sky-50">Load older posts</button>
        )}
      </div>

      <div className="space-y-4">
        <EventsCard events={f.events} onSeeAll={() => f.setFilter("event")} />
        <TopicsCard posts={f.feedPosts} active={view.tag} onPick={(tag) => f.setView({ tag })} />
        <PeopleCard posts={f.feedPosts} uid={f.uid} following={f.following} onFollow={f.follow} onOpen={f.openAuthor} />
        <InviteCard name={me.fullName} />
      </div>
    </div>
  );
}
