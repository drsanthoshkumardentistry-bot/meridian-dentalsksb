import { useEffect, useMemo, useState } from 'react'
import { Bookmark, BookmarkCheck, CheckCircle2, ChevronDown, ChevronRight, Circle, FileText, Lock, RotateCcw, Search } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { PYQ_MCQS } from '../data/pyqMcqs.js'
import { PYQ_STATS, PYQ_UNIVERSITY, PYQ_YEARS, loadPyq, pyqSubject } from '../data/pyqSubjects.js'
import { DONE, KINDS, SAVED, filterPyq, hasFlag, importance, latestKey, mcqId, paperOf, sessionKey, sessionsOf, shortSession, withFlag } from '../lib/pyq.js'
import { Badge, Card, Empty, PageHeader, Segmented, cx } from '../components/ui.jsx'

const TABS = [['imp', '★ Important'], ['10m', '10 marks'], ['5m', '5 marks'], ['2m', '2 marks'], ['mcq', 'MCQs'], ['papers', 'Papers'], ['saved', 'Saved']]
const SECTION = { '10m': 'I. Elaborate on', '5m': 'II. Write notes on', '2m': 'III. Short answers' }

/** #/pyq → year/subject list · #/pyq/<subject>/<tab>[/<session>] → subject view */
export default function Pyq({ subject, tab, session }) {
  const s = subject && pyqSubject(subject)
  if (s?.available) return <SubjectView key={s.id} subject={s} tab={TABS.some(([t]) => t === tab) ? tab : 'imp'} session={session} />
  return <PyqHome />
}

function PyqHome() {
  const { progress } = useApp()
  const total = Object.values(PYQ_STATS).reduce((n, x) => n + x.questions, 0)
  const doneBy = useMemo(() => {
    const m = {}
    for (const [id, f] of Object.entries(progress.pyq || {})) if (!id.startsWith('m:') && (f & DONE)) { const sub = id.replace(/-[0-9a-f]{8}$/, ''); m[sub] = (m[sub] || 0) + 1 }
    return m
  }, [progress.pyq])

  return (
    <div className="animate-fade-in">
      <PageHeader title="University PYQs" subtitle={`${PYQ_UNIVERSITY} · BDS theory papers 2009–2026 · ${total.toLocaleString()} questions sorted into 10, 5 and 2 marks, with repeat-based important questions and MCQs.`} />
      <div className="space-y-6">
        {PYQ_YEARS.map((y) => {
          const ready = y.subjects.some((s) => PYQ_STATS[s.id])
          return (
            <section key={y.year}>
              <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">{y.label}{!ready && <Badge tone="slate" className="normal-case tracking-normal">PYQs coming soon</Badge>}</h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {y.subjects.map((s) => {
                  const st = PYQ_STATS[s.id]
                  const done = doneBy[s.id] || 0
                  const inner = (
                    <>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-clinic-50 text-xl dark:bg-clinic-950">{s.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{s.name}</span>
                        <span className="block truncate text-xs text-slate-500">{st ? `${st.questions} questions · ${st.papers} papers · ${(PYQ_MCQS[s.id] || []).length} MCQs` : 'Awaiting question papers'}</span>
                        {st && done > 0 && <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><span className="block h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((done / st.questions) * 100)}%` }} /></span>}
                      </span>
                      {st ? <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" /> : <Lock className="h-4 w-4 shrink-0 text-slate-400" />}
                    </>
                  )
                  return st
                    ? <a key={s.id} href={`#/pyq/${s.id}`}><Card className="flex items-center gap-3 p-3.5 transition hover:border-clinic-300 dark:hover:border-clinic-700">{inner}</Card></a>
                    : <Card key={s.id} className="flex items-center gap-3 border-dashed p-3.5 opacity-60">{inner}</Card>
                })}
              </div>
            </section>
          )
        })}
      </div>
      <p className="mt-6 text-xs text-slate-400">Question wording is from the university papers. MCQs are MeriDent practice questions on the most-repeated topics. Always cross-check answers with your textbooks.</p>
    </div>
  )
}

function SubjectView({ subject, tab, session }) {
  const { progress, setPyq } = useApp()
  const pyq = progress.pyq || {}
  const [qs, setQs] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('freq')

  useEffect(() => {
    let live = true
    loadPyq(subject.id).then((d) => live && setQs(d))
    return () => { live = false }
  }, [subject.id])

  const sessions = useMemo(() => (qs ? sessionsOf(qs) : []), [qs])
  const counts = useMemo(() => (qs ? {
    imp: qs.filter((q) => q.c >= 2).length, '10m': qs.filter((q) => q.k.includes('10m')).length, '5m': qs.filter((q) => q.k.includes('5m')).length,
    '2m': qs.filter((q) => q.k.includes('2m')).length, mcq: (PYQ_MCQS[subject.id] || []).length, papers: sessions.length, saved: qs.filter((q) => hasFlag(pyq, q.id, SAVED)).length,
  } : {}), [qs, sessions, pyq, subject.id])
  const list = useMemo(() => (qs ? filterPyq(qs, { tab, query, sort, pyq }) : []), [qs, tab, query, sort, pyq])
  const done = qs ? qs.filter((q) => hasFlag(pyq, q.id, DONE)).length : 0
  const toggle = (id, flag) => setPyq({ [id]: withFlag(pyq[id], flag) || null })

  return (
    <div className="animate-fade-in">
      <PageHeader back="#/pyq" title={`${subject.icon} ${subject.name}`} subtitle={`${subject.full}${subject.paper ? ` · ${subject.paper}` : ''}${qs ? ` · ${done} of ${qs.length} done` : ''}`} />
      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-1.5">
          {TABS.map(([t, label]) => (
            <a key={t} href={`#/pyq/${subject.id}/${t}`} className={cx('whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-semibold transition',
              tab === t ? 'border-clinic-500 bg-clinic-50 text-clinic-700 dark:border-clinic-400 dark:bg-clinic-950 dark:text-clinic-300' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800')}>
              {label}{counts[t] != null && <span className="ml-1.5 text-xs font-medium opacity-60">{counts[t]}</span>}
            </a>
          ))}
        </div>
      </div>

      {!qs && <p className="py-12 text-center text-sm text-slate-500">Loading questions…</p>}
      {qs && tab === 'mcq' && <McqTab subject={subject.id} />}
      {qs && tab === 'papers' && !session && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {sessions.map((s) => (
            <a key={s} href={`#/pyq/${subject.id}/papers/${encodeURIComponent(s)}`}><Card className="flex items-center gap-2 px-3 py-3 text-sm font-semibold hover:border-clinic-300"><FileText className="h-4 w-4 text-clinic-600" />{s}</Card></a>
          ))}
        </div>
      )}
      {qs && tab === 'papers' && session && <PaperView subject={subject.id} session={session} qs={qs} pyq={pyq} toggle={toggle} />}
      {qs && !['mcq', 'papers'].includes(tab) && (
        <>
          <div className="mb-3 flex gap-2">
            <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-clinic-400 dark:border-slate-700 dark:bg-slate-900">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search topics…" className="w-full bg-transparent text-sm outline-none" />
            </label>
            <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="freq">Most asked</option><option value="recent">Most recent</option>
            </select>
          </div>
          {tab === 'imp' && <p className="mb-3 text-xs text-slate-500">Asked in 2 or more exam sessions, ranked by how often they repeat.</p>}
          <div className="space-y-2.5">
            {list.map((q, i) => <QuestionCard key={q.id} q={q} n={i + 1} pyq={pyq} toggle={toggle} showKinds={!KINDS[tab]} />)}
          </div>
          {!list.length && <Empty icon={tab === 'saved' ? 'BookMarked' : 'SearchX'} title={tab === 'saved' ? 'No saved questions yet' : 'No questions match'}>{tab === 'saved' ? 'Tap the bookmark on any question to keep it here.' : 'Try another word.'}</Empty>}
        </>
      )}
    </div>
  )
}

function QuestionCard({ q, n, pyq, toggle, showKinds = true }) {
  const [open, setOpen] = useState(false)
  const imp = importance(q.c)
  const done = hasFlag(pyq, q.id, DONE), saved = hasFlag(pyq, q.id, SAVED)
  const asked = [...q.a].sort((x, y) => sessionKey(y[0]) - sessionKey(x[0]))
  const last = asked.find((a) => sessionKey(a[0]) === latestKey(q))[0]
  return (
    <Card className={cx('p-4', done && 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20')}>
      <div className="flex items-start gap-3">
        <button aria-label={done ? 'Mark as not done' : 'Mark as done'} onClick={() => toggle(q.id, DONE)} className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600">
          {done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cx('text-[15px] leading-relaxed', done && 'text-slate-500 line-through decoration-slate-300')}>
            {n != null && <span className="mr-1.5 font-semibold text-slate-400">{n}.</span>}{q.t}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {showKinds && q.k.map((k) => <Badge key={k} tone="slate">{KINDS[k]}</Badge>)}
            {imp && <Badge tone={imp.tone}>{imp.label}</Badge>}
            <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              Asked {q.c}× · last {shortSession(last)}<ChevronDown className={cx('h-3.5 w-3.5 transition', open && 'rotate-180')} />
            </button>
          </div>
          {open && (
            <div className="mt-2 flex flex-wrap gap-1">
              {asked.map(([s, , m], i) => <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{s}{m ? ` · ${m}m` : ''}</span>)}
            </div>
          )}
        </div>
        <button aria-label={saved ? 'Remove from saved' : 'Save question'} onClick={() => toggle(q.id, SAVED)} className="shrink-0 text-slate-400 hover:text-clinic-600">
          {saved ? <BookmarkCheck className="h-5 w-5 text-clinic-600" /> : <Bookmark className="h-5 w-5" />}
        </button>
      </div>
    </Card>
  )
}

function PaperView({ subject, session, qs, pyq, toggle }) {
  const sections = paperOf(qs, session)
  return (
    <div>
      <a href={`#/pyq/${subject}/papers`} className="mb-3 inline-block text-sm font-semibold text-clinic-600 hover:underline">← All papers</a>
      <h2 className="mb-4 text-lg font-bold">{session}</h2>
      {!sections.length && <Empty icon="SearchX" title="Paper not found" />}
      {sections.map(({ kind, marks, items }) => (
        <section key={kind} className="mb-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{SECTION[kind]}{marks ? ` · ${items.length} × ${marks}` : ''}</h3>
          <div className="space-y-2.5">{items.map((q, i) => <QuestionCard key={q.id} q={q} n={i + 1} pyq={pyq} toggle={toggle} showKinds={false} />)}</div>
        </section>
      ))}
      <p className="text-xs text-slate-400">When a question was repeated in other years, the fullest wording is shown.</p>
    </div>
  )
}

function McqTab({ subject }) {
  const { progress, setPyq } = useApp()
  const pyq = progress.pyq || {}
  const list = PYQ_MCQS[subject] || []
  const [filter, setFilter] = useState('all')
  const chosen = (i) => pyq[mcqId(subject, i)]
  const attempted = list.filter((_, i) => chosen(i) != null).length
  const correct = list.filter((m, i) => chosen(i) === m.a).length
  const shown = list.map((m, i) => [m, i]).filter(([m, i]) => filter === 'all' || (filter === 'wrong' ? chosen(i) != null && chosen(i) !== m.a : chosen(i) == null))

  if (!list.length) return <Empty icon="ClipboardList" title="MCQs coming soon" />
  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center justify-between gap-2 bg-clinic-50 px-4 py-3 text-sm dark:bg-clinic-950">
        <span>Score <b>{correct}</b> / {attempted} attempted · {list.length} total</span>
        {attempted > 0 && <button onClick={() => setPyq(Object.fromEntries(list.map((_, i) => [mcqId(subject, i), null])))} className="inline-flex items-center gap-1 font-semibold text-clinic-700 hover:underline dark:text-clinic-300"><RotateCcw className="h-3.5 w-3.5" />Reset</button>}
      </Card>
      <Segmented value={filter} onChange={setFilter} options={[['all', 'All'], ['new', 'Not attempted'], ['wrong', 'Wrong']]} />
      {shown.map(([m, i]) => {
        const c = chosen(i), answered = c != null
        return (
          <Card key={i} className="p-4">
            <p className="text-[15px] font-medium"><span className="mr-1.5 text-slate-400">{i + 1}.</span>{m.q}</p>
            <div className="mt-3 grid gap-2">
              {m.o.map((opt, j) => (
                <button key={j} disabled={answered} onClick={() => setPyq({ [mcqId(subject, i)]: j })}
                  className={cx('rounded-xl border px-3 py-2 text-left text-sm transition',
                    !answered && 'border-slate-200 hover:border-clinic-300 hover:bg-clinic-50/50 dark:border-slate-700 dark:hover:bg-slate-800',
                    answered && j === m.a && 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
                    answered && j === c && j !== m.a && 'border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
                    answered && j !== m.a && j !== c && 'border-slate-200 opacity-60 dark:border-slate-700')}>
                  <span className="mr-2 font-bold">{String.fromCharCode(65 + j)}.</span>{opt}
                </button>
              ))}
            </div>
            {answered && <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"><b className={c === m.a ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>{c === m.a ? 'Correct.' : 'Not quite.'}</b> {m.e}</p>}
          </Card>
        )
      })}
      {!shown.length && <Empty icon="Inbox" title="Nothing here">No questions in this filter.</Empty>}
    </div>
  )
}
