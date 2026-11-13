import { useEffect, useState } from 'react'
import { Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, ScrollText, Star, Timer, XCircle } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { supportMailto } from '../lib/config.js'
import { Badge, Button, Card, Empty, Modal, PageHeader, Ring, Segmented, cx, fmtTime, shuffle } from '../components/ui.jsx'

export default function Mcq({ subject: deepSubject = null }) {
  const { content, progress, track } = useApp()
  const exam = track?.mcqExam || 'NEET MDS'
  const neg = track ? track.negativeMarking : true
  const qs = content.mcqs.filter((q) => (q.exam || 'NEET MDS') === exam)
  // Deep link from the Portions tracker: #/mcq?subject=Oral%20Pathology
  const [view, setView] = useState(() => {
    const list = deepSubject ? qs.filter((q) => q.subject === deepSubject) : []
    return list.length ? { name: 'practice', title: deepSubject, ids: list.map((q) => q.id) } : { name: 'home' }
  })
  const subjects = [...new Set(qs.map((q) => q.subject))]
  const acc = (list) => { const a = list.filter((q) => q.id in progress.answers); return { done: a.length, pct: a.length ? Math.round(a.filter((q) => progress.answers[q.id]).length / a.length * 100) : 0 } }

  const practice = (title, list) => setView({ name: 'practice', title, ids: list.map((q) => q.id) })
  if (view.name === 'practice') return <Practice {...view} onExit={() => setView({ name: 'home' })} />
  if (view.name === 'setup') return <TestSetup bank={qs} neg={neg} exam={exam} subjects={subjects} onStart={(t) => setView({ name: 'test', ...t })} onExit={() => setView({ name: 'home' })} />
  if (view.name === 'test') return <Test {...view} neg={neg} onDone={(r) => setView({ name: 'result', ...r })} />
  if (view.name === 'result') return <TestResult {...view} onHome={() => setView({ name: 'home' })} onAgain={() => setView({ name: 'setup' })} />

  const pyq = qs.filter((q) => q.is_pyq), imp = qs.filter((q) => q.is_important)
  const wrong = qs.filter((q) => progress.answers[q.id] === false)
  const bm = qs.filter((q) => progress.bookmarks.includes(q.id))
  const mocks = progress.mocks.filter((m) => (m.kind || '').startsWith(exam === 'ADC' ? 'ADC' : '') && (exam === 'ADC' || !(m.kind || '').startsWith('ADC')))
  const best = mocks.length ? Math.max(...mocks.map((m) => m.pct ?? 0)) : null

  return (
    <div className="animate-fade-in">
      <PageHeader title={track?.mcqLabel || 'NEET MDS MCQs'} subtitle={`${qs.length} questions · ${neg ? 'NEET MDS marking +4 / −1' : 'scored as % correct'} · best mock ${best != null ? best + '%' : '–'}`} />
      <div className="grid gap-3 sm:grid-cols-2">
        {exam === 'ADC'
          ? <Tile icon={ScrollText} tone="text-violet-600 bg-violet-50 dark:bg-violet-950/40" title="All scenarios" text="Clinical scenarios in the Australian context" meta={`${qs.length} questions · ${acc(qs).done} done · ${acc(qs).pct}%`} onClick={() => practice('ADC scenarios', qs)} />
          : <Tile icon={ScrollText} tone="text-violet-600 bg-violet-50 dark:bg-violet-950/40" title="PYQs" text="Repeated previous-year topics" meta={`${pyq.length} questions · ${acc(pyq).done} done · ${acc(pyq).pct}%`} onClick={() => practice('PYQs', pyq)} />}
        <Tile icon={Star} tone="text-amber-600 bg-amber-50 dark:bg-amber-950/40" title={exam === 'ADC' ? 'Must-know for ADC' : 'Most Important'} text={exam === 'ADC' ? 'Emergencies, law, infection control' : 'High-yield, must-know facts'} meta={`${imp.length} questions · ${acc(imp).done} done · ${acc(imp).pct}%`} onClick={() => practice(exam === 'ADC' ? 'Must-know for ADC' : 'Most Important', imp)} />
        <Tile icon={Timer} tone="text-clinic-600 bg-clinic-50 dark:bg-clinic-950" title="Mock test" text="Timed, with palette & mark-for-review" meta={`${mocks.length} taken`} onClick={() => setView({ name: 'setup' })} />
        <Tile icon={XCircle} tone="text-rose-600 bg-rose-50 dark:bg-rose-950/40" title="Revise mistakes" text="Questions you got wrong" meta={`${wrong.length} to revise`} onClick={() => wrong.length && practice('Revise mistakes', wrong)} />
        <Tile icon={BookmarkCheck} tone="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" title="Bookmarks" text="Saved for last-minute revision" meta={`${bm.length} saved`} onClick={() => bm.length && practice('Bookmarks', bm)} />
      </div>
      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wider text-slate-500">Subject-wise</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {subjects.map((s) => { const l = qs.filter((q) => q.subject === s), a = acc(l); return (
          <button key={s} onClick={() => practice(s, l)} className="text-left"><Card className="p-3.5 transition hover:border-clinic-300 dark:hover:border-clinic-700">
            <div className="flex justify-between text-sm"><b>{s}</b><span className="text-slate-500">{a.done}/{l.length}</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full bg-sky-500" style={{ width: `${(a.done / l.length) * 100}%` }} /></div>
          </Card></button>
        ) })}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">{exam === 'ADC' ? 'ADC-style practice written for MeriDent Prep – not official ADC questions. Confirm current Australian guidelines.' : 'PYQs are recall-based on frequently repeated topics, not reproduced official papers. Verify with standard textbooks.'}</p>
    </div>
  )
}

function Tile({ icon: I, tone, title, text, meta, onClick }) {
  return (
    <button onClick={onClick} className="text-left"><Card className="flex h-full gap-3 p-4 transition hover:border-clinic-300 dark:hover:border-clinic-700">
      <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-xl', tone)}><I className="h-5 w-5" /></span>
      <span><span className="block font-bold">{title}</span><span className="block text-sm text-slate-500">{text}</span><span className="mt-1 block text-xs font-semibold text-slate-400">{meta}</span></span>
    </Card></button>
  )
}

function Option({ k, text, state, onClick, disabled }) {
  const cls = state === 'right' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : state === 'wrong' ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : state === 'sel' ? 'border-clinic-500 bg-clinic-50 dark:bg-clinic-950' : 'border-slate-200 hover:border-clinic-300 dark:border-slate-700'
  return (
    <button disabled={disabled} onClick={onClick} className={cx('flex w-full items-start gap-3 rounded-xl border-2 px-3.5 py-3 text-left text-[15px] transition', cls)}>
      <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-bold', state === 'sel' ? 'bg-clinic-600 text-white' : state === 'right' ? 'bg-emerald-600 text-white' : state === 'wrong' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800')}>{'ABCD'[k]}</span>{text}
    </button>
  )
}

function Practice({ title, ids, onExit }) {
  const { content, progress, answerMcq, toggleBookmark } = useApp()
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const q = content.mcqs.find((x) => x.id === ids[i])
  if (!q) return <Empty title="Nothing here yet"><button className="text-clinic-600" onClick={onExit}>Back</button></Empty>
  const done = picked !== null
  const bm = progress.bookmarks.includes(q.id)
  const go = (d) => { if (i + d >= ids.length) return onExit(); setI(Math.max(0, i + d)); setPicked(null); window.scrollTo(0, 0) }
  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-500"><button onClick={onExit} className="hover:text-clinic-600">‹ {title}</button><span>{i + 1} / {ids.length}</span></div>
      <Card className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5"><Badge tone="blue">{q.subject}</Badge>{q.is_pyq && <Badge tone="violet">PYQ</Badge>}{q.is_important && <Badge tone="amber">★ Important</Badge>}</div>
          <button aria-label="Bookmark" onClick={() => toggleBookmark(q.id)} className={bm ? 'text-amber-500' : 'text-slate-400'}>{bm ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}</button>
        </div>
        <p className="mb-4 text-lg font-semibold leading-snug">{q.question}</p>
        <div className="space-y-2">{q.options.map((o, k) => <Option key={k} k={k} text={o} disabled={done} state={done ? (k === q.answer ? 'right' : k === picked ? 'wrong' : '') : ''} onClick={() => { setPicked(k); answerMcq(q.id, k === q.answer) }} />)}</div>
        {done && <div className="mt-4 animate-fade-in rounded-xl border-l-4 border-clinic-500 bg-slate-50 p-3.5 text-sm dark:bg-slate-800/60"><p className="mb-1 flex items-center gap-1.5 font-bold">{picked === q.answer ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" />Correct!</> : <><XCircle className="h-4 w-4 text-rose-600" />Answer: {'ABCD'[q.answer]}</>}</p>{q.explanation}
          <a href={supportMailto(`Report an error: MCQ #${q.id}`, `Question #${q.id} (${q.subject}): ${q.question}\n\nWhat's wrong:\n`)} className="mt-2 block text-xs font-semibold text-slate-400 hover:text-clinic-600">Report an error in this question</a></div>}
        <div className="mt-4 flex gap-2"><Button variant="secondary" disabled={i === 0} onClick={() => go(-1)}><ChevronLeft className="h-4 w-4" />Prev</Button><Button className="flex-1" onClick={() => go(1)}>{i === ids.length - 1 ? 'Finish' : 'Next'}<ChevronRight className="h-4 w-4" /></Button></div>
      </Card>
    </div>
  )
}

function TestSetup({ bank, neg, exam, subjects, onStart, onExit }) {
  const [src, setSrc] = useState('all'), [subj, setSubj] = useState('all'), [n, setN] = useState(20), [secs, setSecs] = useState(exam === 'ADC' ? 60 : 45)
  const pool = bank.filter((q) => (src === 'all' || (src === 'pyq' ? q.is_pyq : q.is_important)) && (subj === 'all' || q.subject === subj))
  const count = Math.min(n === 'all' ? pool.length : n, pool.length)
  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <PageHeader title="Mock test" back="#/mcq" />
      <Card className="space-y-4 p-5">
        <div><p className="mb-2 text-sm font-bold">Source</p><Segmented value={src} onChange={setSrc} options={exam === 'ADC' ? [['all', 'All'], ['imp', 'Must-know']] : [['all', 'All'], ['pyq', 'PYQs'], ['imp', 'Most Important']]} /></div>
        <div><p className="mb-2 text-sm font-bold">Subject</p><select value={subj} onChange={(e) => setSubj(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="all">All subjects</option>{subjects.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><p className="mb-2 text-sm font-bold">Questions</p><Segmented value={n} onChange={setN} options={[[10, '10'], [20, '20'], [30, '30'], ['all', 'All']]} /></div>
        <div><p className="mb-2 text-sm font-bold">Time per question</p><Segmented value={secs} onChange={setSecs} options={exam === 'ADC' ? [[60, '60 s'], [90, '90 s'], [120, '2 min']] : [[45, '45 s (NEET pace)'], [60, '60 s'], [90, '90 s']]} /></div>
        <p className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60"><b>{count} questions · {fmtTime(count * secs)} min.</b> {neg ? '+4 correct, −1 wrong, 0 skipped. NEET MDS: 240 questions in 3 hours.' : 'Scored as % correct. Read each scenario fully – ADC questions reward safe, guideline-based decisions.'}</p>
        <div className="flex gap-2"><Button variant="secondary" onClick={onExit}>Cancel</Button><Button className="flex-1" disabled={!count} onClick={() => onStart({ ids: shuffle(pool).slice(0, count).map((q) => q.id), total: count * secs, kind: `${exam === 'ADC' ? 'ADC-' : ''}${src === 'all' ? 'ALL' : src.toUpperCase()}` })}>Start test</Button></div>
      </Card>
    </div>
  )
}

function Test({ ids, total, kind, neg, onDone }) {
  const { content, answerMcq, saveMock } = useApp()
  const [i, setI] = useState(0), [ans, setAns] = useState({}), [rev, setRev] = useState({}), [left, setLeft] = useState(total), [confirm, setConfirm] = useState(false)
  const q = content.mcqs.find((x) => x.id === ids[i])

  function submit() {
    let c = 0, w = 0
    const bySub = {}
    ids.forEach((id) => {
      const qq = content.mcqs.find((x) => x.id === id), a = ans[id]
      bySub[qq.subject] ??= { c: 0, t: 0 }; bySub[qq.subject].t++
      if (a === undefined) return
      const ok = a === qq.answer; ok ? c++ : w++; if (ok) bySub[qq.subject].c++
      answerMcq(id, ok)
    })
    const n = ids.length, score = neg ? c * 4 - w : c, max = neg ? n * 4 : n
    const result = { kind, n, c, w, u: n - c - w, score, max, pct: Math.max(0, Math.round((score / max) * 100)), time: total - Math.max(0, left), created_at: new Date().toISOString() }
    saveMock(result)
    onDone({ result, bySub, ids, ans })
  }
  useEffect(() => {
    if (left <= 0) { submit(); return }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps

  const answered = Object.keys(ans).length
  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <Button size="sm" variant="secondary" onClick={() => setConfirm(true)}>Submit</Button>
        <span className={cx('rounded-lg px-3 py-1 text-sm font-extrabold tabular-nums', left < 60 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40' : 'bg-clinic-50 text-clinic-700 dark:bg-clinic-950 dark:text-clinic-300')}>⏱ {fmtTime(left)}</span>
        <span className="text-sm font-semibold text-slate-500">{i + 1} / {ids.length}</span>
      </div>
      <Card className="p-5">
        <div className="mb-3 flex gap-1.5"><Badge tone="blue">{q.subject}</Badge>{rev[q.id] && <Badge tone="violet">Marked for review</Badge>}</div>
        <p className="mb-4 text-lg font-semibold leading-snug">{q.question}</p>
        <div className="space-y-2">{q.options.map((o, k) => <Option key={k} k={k} text={o} state={ans[q.id] === k ? 'sel' : ''} onClick={() => setAns((a) => ({ ...a, [q.id]: k }))} />)}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setRev((r) => ({ ...r, [q.id]: !r[q.id] }))}>{rev[q.id] ? 'Unmark' : '🔖 Mark for review'}</Button>
          {ans[q.id] !== undefined && <Button variant="ghost" size="sm" onClick={() => setAns(({ [q.id]: _, ...rest }) => rest)}>Clear</Button>}
        </div>
        <div className="mt-3 flex gap-2"><Button variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>‹ Prev</Button><Button className="flex-1" onClick={() => (i === ids.length - 1 ? setConfirm(true) : setI(i + 1))}>{i === ids.length - 1 ? 'Submit' : 'Save & next ›'}</Button></div>
      </Card>
      <Card className="mt-3 p-4">
        <p className="text-sm font-bold">Question palette <span className="font-medium text-slate-400">· {answered} answered</span></p>
        <div className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-10">
          {ids.map((id, k) => <button key={id} onClick={() => setI(k)} className={cx('h-9 rounded-lg border text-xs font-bold', ans[id] !== undefined ? 'border-clinic-600 bg-clinic-600 text-white' : 'border-slate-200 dark:border-slate-700', rev[id] && 'border-violet-600 bg-violet-600 text-white', k === i && 'ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-slate-900')}>{k + 1}</button>)}
        </div>
      </Card>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Submit test?">
        <p className="mb-4 text-sm text-slate-500">{ids.length - answered ? `${ids.length - answered} unanswered. ` : ''}You can't change answers after submitting.</p>
        <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setConfirm(false)}>Keep going</Button><Button className="flex-1" onClick={submit}>Submit</Button></div>
      </Modal>
    </div>
  )
}

function TestResult({ result: r, bySub, ids, ans, onHome, onAgain }) {
  const { content } = useApp()
  const [review, setReview] = useState(false)
  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-4">
      <Card className="grid place-items-center p-6 text-center">
        <Ring value={Math.max(0, r.score)} max={r.max} label={r.score} sub={`of ${r.max}`} />
        <p className="mt-3 font-bold">{r.pct >= 70 ? 'Excellent work! 🎉' : r.pct >= 50 ? 'Good going – keep pushing 💪' : "Keep practising – you'll get there 📚"}</p>
        <div className="mt-4 grid w-full grid-cols-4 gap-2 text-center">{[['Correct', r.c, 'text-emerald-600'], ['Wrong', r.w, 'text-rose-600'], ['Skipped', r.u, ''], ['Time', fmtTime(r.time), '']].map(([l, v, c]) => <div key={l} className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60"><div className={cx('text-lg font-extrabold', c)}>{v}</div><div className="text-[11px] text-slate-500">{l}</div></div>)}</div>
      </Card>
      <Card className="divide-y divide-slate-100 p-2 dark:divide-slate-800">{Object.entries(bySub).map(([s, x]) => <div key={s} className="flex justify-between px-2 py-2.5 text-sm"><span>{s}</span><b>{x.c}/{x.t}</b></div>)}</Card>
      <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setReview((v) => !v)}>{review ? 'Hide' : 'Review'} answers</Button><Button className="flex-1" onClick={onAgain}>New test</Button></div>
      {review && ids.map((id, k) => { const q = content.mcqs.find((x) => x.id === id), a = ans[id]; return (
        <Card key={id} className="p-4">
          <div className="mb-2 flex gap-1.5"><Badge tone="blue">Q{k + 1} · {q.subject}</Badge>{a === undefined ? <Badge tone="amber">Skipped</Badge> : a === q.answer ? <Badge tone="green">Correct</Badge> : <Badge tone="red">Wrong</Badge>}</div>
          <p className="mb-3 font-semibold">{q.question}</p>
          <div className="space-y-1.5">{q.options.map((o, j) => <Option key={j} k={j} text={o} disabled state={j === q.answer ? 'right' : j === a ? 'wrong' : ''} />)}</div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{q.explanation}</p>
        </Card>
      ) })}
      <button onClick={onHome} className="w-full py-2 text-sm font-semibold text-slate-500">Back to MCQs</button>
    </div>
  )
}
