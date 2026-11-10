// State and actions for the MeriDent Connect network screen. The component only renders.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dateKey } from "../reminders.js";
import { filterPosts, searchPosts, sortPosts, seenSnapshot, withBaseline, activitySince, upcomingEvents } from "./feed.js";
import { loadSeen, saveSeen } from "./seen.js";

const idsOf = (list) => list.map((p) => p.id);
const unique = (ids) => [...new Set(ids)];
const attempt = async (fn, fallback) => {
  try { return await fn(); } catch { return fallback; }
};
const flip = (set, id, on) => {
  const next = new Set(set);
  if (on) next.add(id); else next.delete(id);
  return next;
};

export default function useConnectFeed({ api, showToast }) {
  const apiRef = useRef(api);
  apiRef.current = api;
  const toastRef = useRef(showToast);
  toastRef.current = showToast;
  const uid = api.uid;

  const [store, setStore] = useState({});
  const [feedIds, setFeedIds] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [mineIds, setMineIds] = useState(null);
  const [savedOrder, setSavedOrder] = useState(null);
  const [savedLoading, setSavedLoading] = useState(false);
  const [eventIds, setEventIds] = useState([]);
  const [author, setAuthor] = useState(null); // { info, ids: null | [] }
  const [liked, setLiked] = useState(new Set());
  const [following, setFollowing] = useState(new Set());
  const [saved, setSaved] = useState(new Set());
  const [followers, setFollowers] = useState(null);
  const [votes, setVotes] = useState({});
  const asked = useRef(new Set());
  const [view, setViewState] = useState({ filter: "all", tag: "", query: "", sort: "latest" });
  const [seen, setSeen] = useState(() => loadSeen(uid));
  const [refreshing, setRefreshing] = useState(false);
  const loadedOnce = useRef(false);
  const lastLoad = useRef(0);

  const add = useCallback((list) => {
    setStore((prev) => {
      const next = { ...prev };
      for (const p of list) next[p.id] = p;
      return next;
    });
    const polls = list.filter((p) => p.type === "poll" && !asked.current.has(p.id)).map((p) => p.id);
    if (polls.length) {
      polls.forEach((id) => asked.current.add(id));
      attempt(() => apiRef.current.myVotes(polls), {}).then((found) => setVotes((v) => ({ ...v, ...found })));
    }
  }, []);
  const patch = useCallback((id, changes) => setStore((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...changes } } : prev)), []);
  const bump = useCallback((id, field, delta) => setStore((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], [field]: Math.max(0, (prev[id][field] || 0) + delta) } } : prev)), []);

  const loadFeed = useCallback(async (more = false, from = null) => {
    try {
      const page = await apiRef.current.listPosts(more ? from : null);
      add(page.posts);
      const ids = idsOf(page.posts);
      setFeedIds((prev) => (more ? unique([...prev, ...ids]) : ids));
      setCursor(page.cursor);
      const mine = await attempt(() => apiRef.current.likedSet(ids), new Set());
      setLiked((prev) => new Set([...(more ? prev : []), ...mine]));
      loadedOnce.current = true;
      setStatus("ready");
    } catch {
      if (more || loadedOnce.current) toastRef.current("Could not load posts. Check your connection.");
      else setStatus("error");
    }
  }, [add]);

  const loadMine = useCallback(async () => {
    const list = await attempt(() => apiRef.current.listPostsBy(apiRef.current.uid), null);
    if (!list) return;
    add(list);
    setMineIds(idsOf(list));
    setSeen((s) => {
      const next = withBaseline(s, list);
      saveSeen(apiRef.current.uid, next);
      return next;
    });
  }, [add]);

  const loadEvents = useCallback(async () => {
    const list = await attempt(() => apiRef.current.listUpcomingEvents(dateKey(), 6), null);
    if (!list) return;
    add(list);
    setEventIds(idsOf(list));
  }, [add]);

  const loadSide = useCallback(async () => {
    const [follows, savedSet, count] = await Promise.all([
      attempt(() => apiRef.current.followingSet(), null),
      attempt(() => apiRef.current.savedIds(), null),
      attempt(() => apiRef.current.countFollowers(), null),
    ]);
    if (follows) setFollowing(follows);
    if (savedSet) setSaved(savedSet);
    if (typeof count === "number") setFollowers(count);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadFeed(false), loadMine(), loadEvents(), loadSide()]);
    lastLoad.current = Date.now();
    setRefreshing(false);
  }, [loadFeed, loadMine, loadEvents, loadSide]);

  useEffect(() => { refresh(); }, [refresh, uid]);

  // Coming back to the tab after a while shows what is new, without polling in the background.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastLoad.current > 120000) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const loadSaved = useCallback(async () => {
    setSavedLoading(true);
    const list = await attempt(() => apiRef.current.listSaved(), []);
    add(list);
    setSavedOrder(idsOf(list));
    setSavedLoading(false);
  }, [add]);

  const setFilter = (filter) => {
    setAuthor(null);
    setViewState((v) => ({ ...v, filter }));
    if (filter === "saved") loadSaved();
  };
  const setView = (changes) => setViewState((v) => ({ ...v, ...changes }));

  const openAuthor = async (info) => {
    if (info.id === uid) { setFilter("mine"); return; }
    setAuthor({ info, ids: null });
    const list = await attempt(() => apiRef.current.listPostsBy(info.id), []);
    add(list);
    setAuthor((a) => (a && a.info.id === info.id ? { ...a, ids: idsOf(list) } : a));
  };
  const closeAuthor = () => setAuthor(null);

  const like = async (post, on) => {
    setLiked((s) => flip(s, post.id, on));
    bump(post.id, "likeCount", on ? 1 : -1);
    try { await apiRef.current.setLike(post.id, on); } catch {
      setLiked((s) => flip(s, post.id, !on));
      bump(post.id, "likeCount", on ? -1 : 1);
      toastRef.current("Could not save. Check your connection.");
    }
  };
  const follow = async (id, on) => {
    setFollowing((s) => flip(s, id, on));
    try { await apiRef.current.setFollow(id, on); } catch {
      setFollowing((s) => flip(s, id, !on));
      toastRef.current("Could not save. Check your connection.");
    }
  };
  const save = async (post, on) => {
    setSaved((s) => flip(s, post.id, on));
    try { await apiRef.current.setSaved(post.id, on); } catch {
      setSaved((s) => flip(s, post.id, !on));
      toastRef.current("Could not save. Check your connection.");
    }
  };

  const drop = (id) => {
    setStore((prev) => { const { [id]: _gone, ...rest } = prev; return rest; });
    setFeedIds((l) => l.filter((x) => x !== id));
    setMineIds((l) => (l ? l.filter((x) => x !== id) : l));
    setSavedOrder((l) => (l ? l.filter((x) => x !== id) : l));
    setEventIds((l) => l.filter((x) => x !== id));
    setAuthor((a) => (a && a.ids ? { ...a, ids: a.ids.filter((x) => x !== id) } : a));
  };
  const remove = async (post) => {
    try { await apiRef.current.deletePost(post.id); drop(post.id); toastRef.current("Post deleted"); } catch { toastRef.current("Could not delete the post."); }
  };

  const publish = async (post) => {
    const id = await apiRef.current.createPost(post);
    setSeen((s) => { const next = { ...s, [id]: [0, 0] }; saveSeen(apiRef.current.uid, next); return next; });
    await Promise.all([loadFeed(false), loadMine(), loadEvents()]);
    return id;
  };
  const edit = async (post, patchSpec) => {
    await apiRef.current.updatePost(post.id, patchSpec);
    patch(post.id, { ...patchSpec.set, ...(patchSpec.unset.includes("tag") ? { tag: undefined } : {}), editedAt: Date.now() });
  };
  const vote = async (post, option) => {
    setVotes((v) => ({ ...v, [post.id]: option }));
    bump(post.id, `v${option}`, 1);
    try { await apiRef.current.vote(post.id, option); } catch {
      setVotes((v) => { const { [post.id]: _undo, ...rest } = v; return rest; });
      bump(post.id, `v${option}`, -1);
      toastRef.current("Could not save your vote. Check your connection.");
    }
  };
  const accept = async (post, commentId) => {
    try { await apiRef.current.setAccepted(post.id, commentId); patch(post.id, { acceptedCommentId: commentId }); } catch { toastRef.current("Could not save. Check your connection."); }
  };

  const pick = (ids) => (ids || []).map((id) => store[id]).filter(Boolean);
  const feedPosts = useMemo(() => pick(feedIds), [feedIds, store]); // eslint-disable-line react-hooks/exhaustive-deps
  const minePosts = useMemo(() => pick(mineIds), [mineIds, store]); // eslint-disable-line react-hooks/exhaustive-deps

  const special = Boolean(author) || view.filter === "mine" || view.filter === "saved";
  const source = author ? pick(author.ids) : view.filter === "mine" ? minePosts : view.filter === "saved" ? pick(savedOrder).filter((p) => saved.has(p.id)) : feedPosts;
  const shown = useMemo(
    () => sortPosts(searchPosts(filterPosts(source, { filter: special ? "all" : view.filter, following, uid, tag: view.tag }), view.query), view.sort),
    [source, special, view, following, uid], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const sourceLoading = author ? author.ids === null : view.filter === "mine" ? mineIds === null : view.filter === "saved" ? savedLoading || savedOrder === null : false;

  const events = useMemo(() => {
    const merged = new Map();
    for (const p of [...pick(eventIds), ...feedPosts]) merged.set(p.id, p);
    return upcomingEvents([...merged.values()], dateKey(), 4);
  }, [eventIds, feedPosts, store]); // eslint-disable-line react-hooks/exhaustive-deps

  const activity = useMemo(() => activitySince(minePosts, seen), [minePosts, seen]);
  const markSeen = () => {
    const next = { ...seen, ...seenSnapshot(minePosts) };
    setSeen(next);
    saveSeen(uid, next);
  };

  return {
    uid, status, refreshing, view, setView, setFilter, shown, sourceLoading, feedPosts, minePosts, events, cursor,
    liked, saved, following, followers, votes, vote, author, openAuthor, closeAuthor, activity, markSeen,
    refresh, loadMore: () => loadFeed(true, cursor), like, follow, save, remove, publish, edit, accept, bump,
    postCount: mineIds ? mineIds.length : null,
  };
}
