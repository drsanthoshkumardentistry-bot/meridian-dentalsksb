import React, { useCallback, useEffect, useRef, useState } from "react";
import { validateComment, timeAgo, LIMITS } from "../connect/feed.js";
import { toMillis, chatIdFor } from "../connect/api.js";

const btn = "px-3 py-1.5 rounded-lg text-xs font-semibold";

/** One-to-one messages between verified dentists. `start` opens a conversation with a dentist. */
export default function ConnectMessages({ api, me, start, showToast }) {
  const [chats, setChats] = useState([]);
  const [blocked, setBlocked] = useState(new Set());
  const [active, setActive] = useState(start || null); // { id, name }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);

  const loadChats = useCallback(async () => {
    try {
      const [c, b] = await Promise.all([api.listChats(), api.blockedSet()]);
      setChats(c); setBlocked(b);
    } catch { showToast("Could not load messages."); }
  }, [api, showToast]);
  useEffect(() => { loadChats(); }, [loadChats]);
  useEffect(() => { if (start) setActive(start); }, [start]);

  const chatId = active ? chatIdFor(api.uid, active.id) : null;
  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    try { setMessages(await api.listMessages(chatId)); } catch { setMessages([]); }
  }, [api, chatId]);
  useEffect(() => {
    loadMessages();
    if (!chatId) return undefined;
    const t = setInterval(loadMessages, 15000);
    return () => clearInterval(t);
  }, [chatId, loadMessages]);
  useEffect(() => { end.current?.scrollIntoView?.({ block: "end" }); }, [messages.length]);

  const otherName = (c) => {
    const other = c.members.find((m) => m !== api.uid);
    return { id: other, name: (c.names && c.names[other]) || "Dentist" };
  };

  const send = async (e) => {
    e.preventDefault();
    const v = validateComment(text);
    if (!v.ok) return showToast(v.error);
    setBusy(true);
    try {
      await api.sendMessage(me, active.id, v.text);
      setText("");
      await Promise.all([loadMessages(), loadChats()]);
    } catch {
      showToast("Could not send. This dentist may have blocked messages, or you are offline.");
    } finally { setBusy(false); }
  };

  const toggleBlock = async () => {
    const on = !blocked.has(active.id);
    try {
      await api.setBlocked(active.id, on);
      setBlocked((prev) => { const n = new Set(prev); if (on) n.add(active.id); else n.delete(active.id); return n; });
      showToast(on ? `Blocked ${active.name}. They can no longer message you.` : `Unblocked ${active.name}.`);
    } catch { showToast("Could not change the block. Check your connection."); }
  };

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4" data-testid="connect-messages">
      <div className="bg-white border border-rule rounded-xl p-2 space-y-1 max-h-[60vh] overflow-auto">
        {chats.length === 0 && <p className="p-3 text-xs text-slate-500">No conversations yet. Use Message on a specialist in Find specialists.</p>}
        {chats.map((c) => {
          const o = otherName(c);
          return (
            <button key={c.id} type="button" onClick={() => setActive(o)} className={`w-full text-left p-2.5 rounded-lg ${active?.id === o.id ? "bg-brand-50" : "hover:bg-slate-50"}`}>
              <div className="text-sm font-semibold text-ink">{o.name}</div>
              <div className="text-xs text-slate-500 truncate">{c.lastSenderId === api.uid ? "You: " : ""}{c.lastText}</div>
              <div className="text-[10px] text-slate-400">{timeAgo(toMillis(c.updatedAt))}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-rule rounded-xl p-4 flex flex-col min-h-[320px]">
        {!active ? (
          <p className="text-sm text-slate-500 m-auto">Choose a conversation.</p>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="font-display font-bold text-ink">{active.name}</div>
              <button type="button" onClick={toggleBlock} className={`${btn} border border-rule text-slate-600`}>{blocked.has(active.id) ? "Unblock" : "Block"}</button>
            </div>
            <div className="flex-1 overflow-auto space-y-2 max-h-[45vh]" aria-live="polite">
              {messages.length === 0 && <p className="text-xs text-slate-500">Say hello. Never share a patient's name, phone number or anything that could identify them.</p>}
              {messages.map((m) => {
                const mine = m.senderId === api.uid;
                return (
                  <div key={m.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${mine ? "ml-auto bg-brand-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                    <div className={`text-[10px] mt-0.5 ${mine ? "text-blue-100" : "text-slate-400"}`}>{timeAgo(toMillis(m.createdAt))}</div>
                  </div>
                );
              })}
              <div ref={end} />
            </div>
            {blocked.has(active.id) ? (
              <p className="text-xs text-slate-500 mt-3">You blocked this dentist. Unblock to message them.</p>
            ) : (
              <form onSubmit={send} className="mt-3 flex gap-2">
                <input aria-label="Message" value={text} maxLength={LIMITS.comment} onChange={(e) => setText(e.target.value)} placeholder="Write a message" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                <button type="submit" disabled={busy || !text.trim()} className={`${btn} bg-brand-600 text-white disabled:opacity-50`}>Send</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
