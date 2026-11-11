import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Clock, Gauge, GraduationCap, Mic, MicOff, RotateCcw, Send, ShieldAlert, Sparkles, UserRound } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { createSession, liveMetrics, respond, summarize } from '../lib/examiner.js'
import { askAiExaminer } from '../lib/api.js'
import { Badge, Button, Card, Empty, Icon, Meter, PageHeader, PriorityBadge, Ring, Segmented, cx } from '../components/ui.jsx'
import { navigate } from '../state/router.js'

/* ---------------- Picker ---------------- */
export function VivaHome() {
  const { content, progress } = useApp()
  const [mode, setMode] = useState('topic')
  const subjectOf = Object.fromEntries(content.subjects.map((s) => [s.id, s]))
  const last = Object.fromEntries([...progress.vivas].reverse().map((v) => [`${v.mode}-${v.topic_id ?? v.spotter_id}`, v]))
  const topics = [...content.topics].sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'must_know' ? -1 : 1))

  return (
    <div className="animate-fade-in">
      <PageHeader title="AI Viva Voce Simulator" subtitle="A strict external examiner: case first, then probing follow-ups. Scored on accuracy, terminology and confidence." />
      <Card className="mb-5 grid gap-3 p-4 sm:grid-cols-3">
        {[['ClipboardList', 'Case vignette', 'Every viva opens with a clinical case or spotter.'], ['MessageSquareWarning', 'Probing follow-ups', 'Weak answers get challenged – just like the real thing.'], ['Gauge', 'Live evaluation', 'Terminology, accuracy and confidence tracked per answer.']].map(([i, t, d]) => (
          <div key={t} className="flex gap-3"><Icon name={i} className="mt-0.5 h-5 w-5 shrink-0 text-clinic-600" /><div><p className="text-sm font-bold">{t}</p><p className="text-xs text-slate-500">{d}</p></div></div>
        ))}
      </Card>
      <Segmented className="mb-4" value={mode} onChange={setMode} options={[['topic', 'Topic viva'], ['spotter', 'Spotter viva']]} />
      <div className="grid gap-3 sm:grid-cols-2">
        {mode === 'topic' ? topics.map((t) => {
          const l = last[`topic-${t.id}`]
          return (
            <button key={t.id} onClick={() => navigate(`viva-session/topic/${t.id}`)} className="text-left">
              <Card className="h-full p-4 transition hover:border-clinic-300 dark:hover:border-clinic-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Icon name={subjectOf[t.subject_id]?.icon} className="h-3.5 w-3.5" />{subjectOf[t.subject_id]?.name}</div>
                <div className="mt-1.5 font-bold">{t.title}</div>
                <div className="mt-3 flex items-center justify-between"><PriorityBadge priority={t.priority} />{l ? <Badge tone={l.overall >= 5 ? 'green' : 'red'}>Last: {Number(l.overall).toFixed(1)}/10</Badge> : <span className="text-xs text-slate-400">{t.viva?.length || 0} questions</span>}</div>
              </Card>
            </button>
          )
        }) : content.spotters.map((s) => (
          <button key={s.id} onClick={() => navigate(`viva-session/spotter/${s.id}`)} className="text-left">
            <Card className="flex h-full gap-3 overflow-hidden p-3 transition hover:border-clinic-300 dark:hover:border-clinic-700">
              <img src={s.image_url} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0"><Badge tone="violet">{s.category}</Badge><div className="mt-1.5 text-sm font-semibold text-slate-500">Spotter #{s.id}</div>{last[`spotter-${s.id}`] && <div className="mt-1 text-xs text-slate-400">Last: {Number(last[`spotter-${s.id}`].overall).toFixed(1)}/10</div>}</div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Session ---------------- */
const MAX_AI_TURNS = 10

export function VivaSession({ kind, id }) {
  const app = useApp()
  const { content, user, saveViva, toast } = app
  const topic = kind === 'topic' ? content.topics.find((t) => t.id === Number(id)) : null
  const spotter = kind === 'spotter' ? content.spotters.find((s) => s.id === Number(id)) : null
  const subject = content.subjects.find((s) => s.id === (topic || spotter)?.subject_id)

  const [engine, setEngine] = useState('local')        // 'local' | 'ai'
  const [state, setState] = useState(() => createSession({ topic, spotter }))
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [startedAt] = useState(() => new Date().toISOString())
  const [elapsed, setElapsed] = useState(0)
  const [saved, setSaved] = useState(false)
  const [revealSpotter, setRevealSpotter] = useState(false)
  const chatEnd = useRef(null)

  useEffect(() => { const t = setInterval(() => !state.done && setElapsed((e) => e + 1), 1000); return () => clearInterval(t) }, [state.done])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [state.messages.length, busy])

  const metrics = useMemo(() => liveMetrics(state.messages), [state.messages])
  const summary = useMemo(() => (state.done ? summarize(state) : null), [state])

  // Save once when finished.
  useEffect(() => {
    if (!state.done || saved || !state.results.length) return
    setSaved(true)
    const s = summarize(state)
    saveViva({
      id: crypto.randomUUID(), mode: kind, topic_id: topic?.id ?? null, spotter_id: spotter?.id ?? null, engine,
      overall: s.overall, scores: { terminology: s.terminology, accuracy: s.accuracy, confidence: s.confidence, gaps: s.gaps },
      feedback: s.verdict, started_at: startedAt, ended_at: new Date().toISOString(), messages: state.messages,
    })
  }, [state, saved]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!topic && !spotter) return <Empty icon="FileQuestion" title="Viva not found"><a className="text-clinic-600" href="#/viva">Choose a topic</a></Empty>

  async function send(e) {
    e?.preventDefault()
    const answer = input.trim()
    if (!answer || busy || state.done) return
    setInput('')
    if (engine === 'ai') {
      setBusy(true)
      const optimistic = { ...state, messages: [...state.messages, { role: 'student', content: answer }] }
      setState(optimistic)
      try {
        const studentTurns = optimistic.messages.filter((m) => m.role === 'student').length
        const data = await askAiExaminer({
          topic: topic && { title: topic.title, vignette: topic.vignette, content: topic.content, viva: topic.viva },
          spotter: spotter && { title: spotter.title, category: spotter.category, key_findings: spotter.key_findings, differentials: spotter.differentials, diagnostic_pearl: spotter.diagnostic_pearl, uses: spotter.uses },
          history: state.messages.map(({ role, content }) => ({ role, content })),
          answer,
          finalTurn: studentTurns >= MAX_AI_TURNS,
        })
        const ev = normaliseAiEval(data.evaluation)
        setState((s) => {
          const msgs = [...s.messages.slice(0, -1), { role: 'student', content: answer, evaluation: ev }, { role: 'examiner', content: data.reply }]
          const results = [...s.results, { q: s.messages.filter((m) => m.role === 'examiner').at(-1)?.content || '', ...ev }]
          return { ...s, messages: msgs, results, done: Boolean(data.done) || studentTurns >= MAX_AI_TURNS }
        })
      } catch (err) {
        toast('AI examiner unavailable – switching to the built-in examiner', 'error')
        setEngine('local')
        // Re-run this answer through the built-in engine from the pre-answer state.
        const r = respond(state, answer)
        setState(r.state)
      } finally {
        setBusy(false)
      }
      return
    }
    setBusy(true)
    const r = respond(state, answer)
    setState((s) => ({ ...s, messages: [...s.messages, { role: 'student', content: answer, evaluation: r.evaluation }] }))
    setTimeout(() => { setState(r.state); setBusy(false) }, 650) // brief "examiner is thinking" pause
  }

  function restart(nextEngine = engine) {
    setEngine(nextEngine); setState(createSession({ topic, spotter })); setSaved(false); setElapsed(0); setRevealSpotter(false)
  }

  const studentCount = state.messages.filter((m) => m.role === 'student').length
  const canUseAi = Boolean(user)

  return (
    <div className="animate-fade-in">
      <PageHeader back="#/viva" title={topic ? `Viva: ${topic.title}` : `Spotter viva #${spotter.id}`}
        subtitle={<span className="flex flex-wrap items-center gap-2">{subject?.name}<Badge tone={engine === 'ai' ? 'violet' : 'blue'}>{engine === 'ai' ? <><Sparkles className="h-3 w-3" />AI examiner</> : <><GraduationCap className="h-3 w-3" />Built-in examiner</>}</Badge><Badge><Clock className="h-3 w-3" />{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</Badge></span>}
        actions={studentCount === 0 && !state.done && (
          <Segmented value={engine} onChange={(v) => {
            if (v === 'ai' && !canUseAi) { toast('Sign in to use the AI examiner'); return }
            restart(v)
          }} options={[['local', 'Built-in'], ['ai', 'AI (beta)']]} />
        )} />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          {/* Vignette / spotter card */}
          <Card className="overflow-hidden">
            {spotter ? (
              <div>
                <div className="relative bg-slate-950"><img src={spotter.image_url} alt="Spotter" className="mx-auto max-h-72 w-full object-contain" /></div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="flex gap-2"><Badge tone="violet">{spotter.category}</Badge>{spotter.stain && <Badge>{spotter.stain}</Badge>}</div>
                  {state.done && <button className="text-sm font-semibold text-clinic-600" onClick={() => setRevealSpotter((v) => !v)}>{revealSpotter ? 'Hide' : 'Reveal'} answer</button>}
                </div>
                {revealSpotter && <div className="border-t border-slate-100 p-3 text-sm dark:border-slate-800"><b>{spotter.title}.</b> {spotter.diagnostic_pearl}</div>}
              </div>
            ) : (
              <div className="flex gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50"><Icon name="ClipboardList" className="h-5 w-5" /></span>
                <div><p className="text-xs font-bold uppercase tracking-wider text-amber-600">Clinical vignette</p><p className="mt-1 text-[15px] leading-relaxed">{topic.vignette}</p></div>
              </div>
            )}
          </Card>

          {/* Chat */}
          <Card className="flex flex-col">
            <div className="max-h-[52vh] min-h-[280px] space-y-4 overflow-y-auto p-4">
              {state.messages.map((m, i) => <Bubble key={i} m={m} />)}
              {busy && <div className="flex items-center gap-2 text-sm text-slate-400"><Bot className="h-4 w-4" /><span className="animate-pulse">Examiner is listening…</span></div>}
              <div ref={chatEnd} />
            </div>
            {!state.done ? (
              <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e) }}
                  rows={2} placeholder="Answer like you would in front of the examiner…" className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] outline-none focus:border-clinic-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900" />
                <SpeechButton onText={(t) => setInput((v) => (v ? `${v} ${t}` : t))} />
                <Button type="submit" disabled={!input.trim() || busy} className="h-12 w-12 !px-0" aria-label="Send"><Send className="h-5 w-5" /></Button>
              </form>
            ) : (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
                <Button variant="secondary" onClick={() => restart()}><RotateCcw className="h-4 w-4" />Retake viva</Button>
                {topic && <Button variant="ghost" onClick={() => navigate(`topic/${topic.slug}`)}>Revise topic</Button>}
              </div>
            )}
          </Card>
        </div>

        {/* Evaluation panel */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {summary ? <Summary summary={summary} /> : (
            <Card className="p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Gauge className="h-4 w-4 text-clinic-600" />Live evaluation</h3>
              {metrics ? (
                <div className="space-y-3">
                  <Meter label="Content accuracy" value={metrics.accuracy} />
                  <Meter label="Clinical terminology" value={metrics.terminology} />
                  <Meter label="Confidence" value={metrics.confidence} tone="amber" />
                  {metrics.terms.length > 0 && <div><p className="mb-1.5 text-xs font-semibold text-slate-500">Key terms you used</p><div className="flex flex-wrap gap-1">{metrics.terms.map((t) => <Badge key={t} tone="green">{t}</Badge>)}</div></div>}
                  {metrics.hedges.length > 0 && <div className="flex gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"><ShieldAlert className="h-4 w-4 shrink-0" />Hedging detected: “{metrics.hedges.join('”, “')}”. Examiners mark this down.</div>}
                </div>
              ) : <p className="text-sm text-slate-500">Scores appear after your first answer.</p>}
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">Question {Math.min(state.idx + 1, state.steps.length || 1)} of {engine === 'ai' ? '~' : ''}{state.steps.length || MAX_AI_TURNS}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Bubble({ m }) {
  const me = m.role === 'student'
  return (
    <div className={cx('flex gap-2.5', me && 'flex-row-reverse')}>
      <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full', me ? 'bg-clinic-600 text-white' : 'bg-slate-800 text-white dark:bg-slate-700')}>{me ? <UserRound className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}</span>
      <div className={cx('max-w-[85%]', me && 'text-right')}>
        <div className={cx('inline-block whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-left text-[15px] leading-relaxed', me ? 'rounded-tr-sm bg-clinic-600 text-white' : 'rounded-tl-sm bg-slate-100 dark:bg-slate-800')}>{m.content}</div>
        {me && m.evaluation && (
          <div className="mt-1 flex flex-wrap justify-end gap-1 text-[11px]">
            <Badge tone={m.evaluation.score >= 7 ? 'green' : m.evaluation.score >= 4.5 ? 'amber' : 'red'}>{m.evaluation.score}/10</Badge>
            {m.evaluation.missedLabels?.slice(0, 3).map((x) => <Badge key={x} tone="red">missed: {x}</Badge>)}
          </div>
        )}
      </div>
    </div>
  )
}

function Summary({ summary }) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-bold">Examiner's verdict</h3>
      <div className="flex justify-center"><Ring value={summary.overall} max={10} label={summary.overall} sub="out of 10" /></div>
      <p className={cx('mt-3 text-center text-sm font-bold', summary.overall >= 5 ? 'text-emerald-600' : 'text-rose-600')}>{summary.verdict}</p>
      <div className="mt-4 space-y-3">
        <Meter label="Content accuracy" value={summary.accuracy} />
        <Meter label="Clinical terminology" value={summary.terminology} />
        <Meter label="Confidence" value={summary.confidence} tone="amber" />
      </div>
      {summary.gaps.length > 0 && <div className="mt-4"><p className="mb-1.5 text-xs font-semibold text-slate-500">Revise these points</p><div className="flex flex-wrap gap-1">{summary.gaps.map((g) => <Badge key={g} tone="red">{g}</Badge>)}</div></div>}
    </Card>
  )
}

/** Voice answers via the Web Speech API, where the browser supports it. */
function SpeechButton({ onText }) {
  const [on, setOn] = useState(false)
  const rec = useRef(null)
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  if (!SR) return null
  const toggle = () => {
    if (on) { rec.current?.stop(); return }
    const r = new SR(); r.lang = 'en-IN'; r.interimResults = false; r.continuous = true
    r.onresult = (e) => onText(Array.from(e.results).slice(e.resultIndex).map((x) => x[0].transcript).join(' '))
    r.onend = () => setOn(false)
    r.onerror = () => setOn(false)
    rec.current = r; r.start(); setOn(true)
  }
  return <Button type="button" variant={on ? 'danger' : 'secondary'} onClick={toggle} className="h-12 w-12 !px-0" aria-label={on ? 'Stop dictation' : 'Answer by voice'}>{on ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</Button>
}

function normaliseAiEval(e = {}) {
  const n = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)))
  return {
    score: Math.round(Math.max(0, Math.min(10, Number(e.score) || 0)) * 10) / 10,
    accuracy: n(e.accuracy), terminology: n(e.terminology), confidence: n(e.confidence),
    hitLabels: Array.isArray(e.hits) ? e.hits.slice(0, 8) : [],
    missedLabels: Array.isArray(e.missed) ? e.missed.slice(0, 8) : [],
    hedges: Array.isArray(e.hedges) ? e.hedges : [],
    coverage: n(e.accuracy) / 100,
  }
}
