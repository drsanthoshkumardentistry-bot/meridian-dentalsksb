import React, { useCallback, useEffect, useState } from "react";

/** Staff view: reported posts and comments, with a one-click removal. */
export default function ReportsQueue({ api, showToast }) {
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
