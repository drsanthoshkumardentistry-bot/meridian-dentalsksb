import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { askAi } from "../aiClient.js";
import { FairySvg } from "./ToothFairy.jsx";

const STARTERS = ["How do I add a patient?", "How do I send a WhatsApp reminder?", "How do I turn on online booking?"];

/** Floating help chat, bottom right. Answers "how do I...?" questions about MeriDent. */
export default function HelpChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (open && endRef.current && endRef.current.scrollIntoView) endRef.current.scrollIntoView({ block: "end" });
  }, [messages, open, busy]);

  const ask = async (question) => {
    const q = String(question || "").trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setText("");
    setBusy(true);
    try {
      const { text: reply } = await askAi({ task: "help", messages: next });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (error) {
      setMessages([...next, { role: "assistant", content: error.message || "Meridee is not available right now.", error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden" data-testid="help-chat">
      {open && (
        <div role="dialog" aria-label="Meridee help" className="mb-3 w-[min(22rem,calc(100vw-2.5rem))] h-[28rem] max-h-[70vh] rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1d4ed8] text-white">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-white/95 flex items-center justify-center overflow-hidden shrink-0"><FairySvg still className="w-8 h-8" /></span>
              <div>
                <div className="font-bold text-sm">Meridee help</div>
                <div className="text-[11px] text-blue-100">Meridee the tooth fairy. Ask how to use MeriDent</div>
              </div>
            </div>
            <button type="button" aria-label="Close help" onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-blue-700"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-slate-50">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">Hi. Ask me anything about using MeriDent, in English, Tamil or Hindi. Please do not type patient names or phone numbers.</p>
                {STARTERS.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)} className="block w-full text-left px-3 py-2 rounded-lg border border-blue-200 bg-white text-xs text-blue-800 hover:bg-blue-50">{s}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed ${m.role === "user" ? "bg-[#1d4ed8] text-white" : m.error ? "bg-red-50 text-red-700 border border-red-200" : "bg-white text-slate-800 border border-slate-200"}`}>{m.content}</div>
              </div>
            ))}
            {busy && <div className="text-xs text-slate-500 px-1">Meridee is writing...</div>}
            <div ref={endRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="flex gap-2 p-3 border-t border-slate-200 bg-white">
            <input aria-label="Your question" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Type your question" className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" />
            <button type="submit" disabled={busy || !text.trim()} aria-label="Send question" className="px-3 rounded-lg bg-[#1d4ed8] text-white disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </form>
          <p className="px-3 pb-2 text-[10px] text-slate-400 bg-white">AI can make mistakes. For medical decisions, the dentist decides.</p>
        </div>
      )}
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close Meridee help" : "Open Meridee help"} className="ml-auto flex items-center gap-2 px-4 py-3 rounded-full bg-[#1d4ed8] hover:bg-blue-700 text-white shadow-xl font-semibold text-sm">
        <MessageCircle className="w-5 h-5" /> {!open && <span>Help</span>}
      </button>
    </div>
  );
}
