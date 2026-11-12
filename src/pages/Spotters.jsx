import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Lightbulb, Mic, Timer, Trophy, XCircle } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { Badge, Button, Card, Empty, PageHeader, Ring, Segmented, cx, shuffle } from '../components/ui.jsx'
import { navigate } from '../state/router.js'

const CATS = [['all', 'All'], ['radiograph', 'Radiographs'], ['histology', 'H&E slides'], ['instrument', 'Instruments'], ['specimen', 'Specimens']]

export default function Spotters() {
  const { content, progress } = useApp()
  const [cat, setCat] = useState('all')
  const [view, setView] = useState('bank') // bank | setup | quiz | result
  const [cfg, setCfg] = useState({ n: 10, secs: 60 })
  const [quiz, setQuiz] = useState(null)
  const pool = content.spotters.filter((s) => cat === 'all' || s.category === cat)
  const stats = useMemo(() => {
    const m = {}
    for (const a of progress.spotterAttempts) { m[a.spotter_id] ??= { n: 0, c: 0 }; m[a.spotter_id].n++; if (a.correct) m[a.spotter_id].c++ }
    return m
  }, [progress.spotterAttempts])

  const start = () => {
    const items = shuffle(pool).slice(0, Math.min(cfg.n, pool.length)).map((s) => ({ s, options: shuffle([s.title, ...s.distractors.slice(0, 3)]) }))
    setQuiz({ items, i: 0, picks: [], secs: cfg.secs })
    setView('quiz')
  }

  if (view === 'quiz' && quiz) return <Quiz quiz={quiz} onDone={(picks) => { setQuiz((q) => ({ ...q, picks })); setView('result') }} onQuit={() => setView('bank')} />
  if (view === 'result' && quiz) return <Result quiz={quiz} onAgain={() => setView('setup')} onBank={() => setView('bank')} />

  return (
    <div className="animate-fade-in">
      <PageHeader title="Spotter & Clinical Image Bank" subtitle="Radiographs, H&E histology, instruments and gross specimens – with diagnostic pearls"
        actions={<Button icon="Timer" onClick={() => setView(view === 'setup' ? 'bank' : 'setup')}>{view === 'setup' ? 'Back to bank' : 'Timed quiz'}</Button>} />
      <Segmented className="mb-4" value={cat} onChange={setCat} options={CATS} />

      {view === 'setup' && (
        <Card className="mb-5 space-y-4 p-5">
          <div><p className="mb-2 text-sm font-bold">Number of spotters</p><Segmented value={cfg.n} onChange={(n) => setCfg((c) => ({ ...c, n }))} options={[[5, '5'], [10, '10'], [20, '20']]} /></div>
          <div><p className="mb-2 text-sm font-bold">Time per spotter</p><Segmented value={cfg.secs} onChange={(secs) => setCfg((c) => ({ ...c, secs }))} options={[[30, '30 s'], [60, '1 min (university)'], [90, '90 s']]} /></div>
          <p className="text-sm text-slate-500">{Math.min(cfg.n, pool.length)} spotters from {CATS.find(([k]) => k === cat)[1].toLowerCase()} · the bell rings automatically when time is up.</p>
          <Button size="lg" icon="Play" disabled={!pool.length} onClick={start}>Start spotters</Button>
        </Card>
      )}

      {!pool.length ? <Empty icon="ImageOff" title="No spotters in this category yet" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pool.map((s) => <BankCard key={s.id} s={s} stat={stats[s.id]} />)}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-400">Images marked "Schematic" are teaching illustrations. Admins can upload real images to the <code>spotters</code> storage bucket.</p>
    </div>
  )
}

function BankCard({ s, stat }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="overflow-hidden">
      <div className="bg-slate-950"><img src={s.image_url} alt={open ? s.title : 'Spotter'} className="h-44 w-full object-contain" loading="lazy" /></div>
      <div className="p-3.5">
        <div className="flex flex-wrap items-center gap-1.5"><Badge tone="violet">{s.category}</Badge>{s.stain && <Badge>{s.stain}</Badge>}{stat && <Badge tone={stat.c / stat.n >= 0.7 ? 'green' : 'amber'}>{stat.c}/{stat.n}</Badge>}</div>
        {open ? (
          <div className="mt-2 animate-fade-in text-sm">
            <p className="font-bold">{s.title}</p>
            <ul className="mt-1.5 space-y-1 text-slate-600 dark:text-slate-300">{s.key_findings.map((k) => <li key={k} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />{k}</li>)}</ul>
            {s.diagnostic_pearl && <p className="mt-2 flex gap-1.5 rounded-lg bg-amber-50 p-2 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><Lightbulb className="h-4 w-4 shrink-0" />{s.diagnostic_pearl}</p>}
          </div>
        ) : <p className="mt-2 text-sm text-slate-500">Identify it, then reveal.</p>}
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>{open ? 'Hide' : 'Reveal'}</Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`viva-session/spotter/${s.id}`)}><Mic className="h-4 w-4" />Viva</Button>
        </div>
      </div>
    </Card>
  )
}

function Quiz({ quiz, onDone, onQuit }) {
  const { recordSpotter } = useApp()
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(quiz.secs)
  const [pick, setPick] = useState(null) // index chosen, or -1 for timeout
  const picks = useRef([])
  const t0 = useRef(Date.now())
  const item = quiz.items[i]

  useEffect(() => {
    if (pick !== null) return
    if (left <= 0) { choose(-1); return }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left, pick]) // eslint-disable-line react-hooks/exhaustive-deps

  function choose(k) {
    if (pick !== null) return
    const correct = k >= 0 && item.options[k] === item.s.title
    const time_ms = Date.now() - t0.current
    picks.current.push({ id: item.s.id, k, correct, time_ms })
    recordSpotter({ spotter_id: item.s.id, correct, time_ms })
    setPick(k)
  }
  function next() {
    if (i + 1 >= quiz.items.length) { onDone(picks.current); return }
    setI(i + 1); setPick(null); setLeft(quiz.secs); t0.current = Date.now()
  }

  const pct = (left / quiz.secs) * 100
  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-3 flex items-center justify-between text-sm font-semibold">
        <button onClick={onQuit} className="text-slate-500 hover:text-clinic-600">‹ Quit</button>
        <span className="text-slate-500">Spotter {i + 1} / {quiz.items.length}</span>
        <span className={cx('flex items-center gap-1 tabular-nums', left <= 10 ? 'text-rose-600' : 'text-clinic-600')}><Timer className="h-4 w-4" />{left}s</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className={cx('h-full transition-all duration-1000 ease-linear', left <= 10 ? 'bg-rose-500' : 'bg-sky-500')} style={{ width: `${pick !== null ? 0 : pct}%` }} /></div>
      <Card className="overflow-hidden">
        <div className="bg-slate-950"><img src={item.s.image_url} alt="Spotter" className="mx-auto max-h-80 w-full object-contain" /></div>
        <div className="p-4">
          <div className="mb-3 flex gap-1.5"><Badge tone="violet">{item.s.category}</Badge>{item.s.stain && <Badge>{item.s.stain}</Badge>}</div>
          <p className="mb-3 font-bold">Identify this {item.s.category === 'histology' ? 'slide' : item.s.category}.</p>
          <div className="grid gap-2">
            {item.options.map((o, k) => {
              const right = o === item.s.title
              const state = pick === null ? '' : right ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : k === pick ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'opacity-60'
              return (
                <button key={o} disabled={pick !== null} onClick={() => choose(k)} className={cx('flex items-center gap-3 rounded-xl border-2 border-slate-200 px-3.5 py-3 text-left text-[15px] font-medium transition dark:border-slate-700', pick === null && 'hover:border-clinic-300', state)}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold dark:bg-slate-800">{'ABCD'[k]}</span>{o}
                  {pick !== null && right && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />}
                  {pick === k && !right && <XCircle className="ml-auto h-5 w-5 text-rose-600" />}
                </button>
              )
            })}
          </div>
          {pick !== null && (
            <div className="mt-4 animate-fade-in rounded-xl bg-slate-50 p-3.5 text-sm dark:bg-slate-800/60">
              <p className="font-bold">{pick === -1 ? '⏰ Time up! ' : ''}{item.s.title}</p>
              <ul className="mt-1.5 space-y-1">{item.s.key_findings.map((k) => <li key={k}>• {k}</li>)}</ul>
              {item.s.diagnostic_pearl && <p className="mt-2 flex gap-1.5 text-amber-800 dark:text-amber-200"><Lightbulb className="h-4 w-4 shrink-0" /><span><b>Pearl:</b> {item.s.diagnostic_pearl}</span></p>}
              <Button className="mt-3 w-full" onClick={next}>{i + 1 >= quiz.items.length ? 'See results' : 'Next spotter ›'}</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function Result({ quiz, onAgain, onBank }) {
  const c = quiz.picks.filter((p) => p.correct).length, n = quiz.items.length
  const avg = Math.round(quiz.picks.reduce((s, p) => s + p.time_ms, 0) / Math.max(1, n) / 1000)
  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-4">
      <Card className="grid place-items-center p-6 text-center">
        <Trophy className="mb-2 h-8 w-8 text-amber-500" />
        <Ring value={c} max={n} label={`${c}/${n}`} sub="correct" />
        <p className="mt-3 font-bold">{c / n >= 0.8 ? 'Excellent spotting!' : c / n >= 0.5 ? 'Good – revise the misses below.' : 'Keep practising – spotters reward repetition.'}</p>
        <p className="text-sm text-slate-500">Average {avg}s per spotter</p>
        <div className="mt-4 flex gap-2"><Button variant="secondary" onClick={onBank}>Image bank</Button><Button onClick={onAgain}>New quiz</Button></div>
      </Card>
      {quiz.items.map(({ s }, k) => {
        const p = quiz.picks[k]
        return (
          <Card key={s.id} className="flex gap-3 p-3">
            <img src={s.image_url} alt="" className="h-16 w-24 shrink-0 rounded-lg bg-slate-950 object-contain" />
            <div className="min-w-0 text-sm"><p className="font-bold">{p?.correct ? '✅' : '❌'} {s.title}</p><p className="text-slate-500">{s.diagnostic_pearl}</p></div>
          </Card>
        )
      })}
    </div>
  )
}
