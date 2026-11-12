import { useMemo, useState } from 'react'
import { BookOpen, ChevronDown, ClipboardList, Sparkles } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { PORTIONS, STATUS, completion } from '../data/portions.js'
import { Badge, Card, Ring, Segmented, cx } from '../components/ui.jsx'

const YEAR_LABEL = { 1: '1st year', 2: '2nd year', 3: '3rd year', 4: 'Final year' }
const STATUS_TONE = [
  'border-slate-200 text-slate-500 dark:border-slate-700',
  'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
  'border-clinic-300 bg-clinic-50 text-clinic-700 dark:border-clinic-800 dark:bg-clinic-950 dark:text-clinic-300',
  'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
]

/** Header switch shared by the Portions page and the Topic Hub. */
export function HubSwitch({ value }) {
  return (
    <Segmented className="mb-4" value={value} onChange={(v) => { window.location.hash = v === 'portions' ? '#/portions' : '#/topics' }}
      options={[['portions', 'Portions tracker'], ['topics', 'High-yield topics']]} />
  )
}

export default function Portions() {
  const { track, progress, setPortion, content } = useApp()
  const key = track?.key || 'University'
  const subjects = PORTIONS[key]
  const statusMap = progress.portions || {}
  const groups = key === 'University'
    ? [['all', 'All'], ...[1, 2, 3, 4].map((y) => [String(y), YEAR_LABEL[y]])]
    : [['all', 'All'], ...[...new Set(subjects.map((s) => s.group))].map((g) => [g, g])]
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)
  const shown = subjects.filter((s) => filter === 'all' || (key === 'University' ? String(s.year) === filter : s.group === filter))
  const all = subjects.flatMap((s) => s.chapters)
  const shownChapters = shown.flatMap((s) => s.chapters)
  const confident = shownChapters.filter((c) => statusMap[c.id] === 3).length
  const started = shownChapters.filter((c) => (statusMap[c.id] || 0) > 0).length

  const topicBySlug = useMemo(() => Object.fromEntries(content.topics.map((t) => [t.slug, t])), [content.topics])
  const bank = track?.mcqExam || 'NEET MDS'
  const mcqCount = useMemo(() => {
    const m = {}
    for (const q of content.mcqs) if ((q.exam || 'NEET MDS') === bank) m[q.subject] = (m[q.subject] || 0) + 1
    return m
  }, [content.mcqs, bank])

  return (
    <div className="animate-fade-in">
      <HubSwitch value="portions" />
      <div className="mb-5 flex flex-wrap items-center gap-5">
        <Ring value={completion(shownChapters, statusMap)} label={`${completion(shownChapters, statusMap)}%`} sub="complete" size={112} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{key === 'ADC' ? 'ADC portions' : key === 'NEET MDS' ? 'NEET MDS portions' : 'BDS portions'}</h1>
          <p className="text-sm text-slate-500">{key === 'ADC' ? 'Practice areas for the ADC pathway (MeriDent grouping – check the ADC website for the official scope).' : key === 'NEET MDS' ? 'All BDS subjects, grouped for MDS revision.' : 'Every subject of the BDS course, year by year (DCI curriculum – check your university syllabus).'}</p>
          <p className="mt-2 text-sm"><b>{confident}</b> of {shownChapters.length} chapters confident · <b>{started}</b> started · {all.length} chapters in total</p>
        </div>
      </div>

      <Segmented className="mb-4" value={filter} onChange={(v) => { setFilter(v); setOpen(null) }} options={groups} />
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-500">
        {STATUS.map((s, i) => <span key={s.label} className={cx('rounded-full border px-2 py-0.5 font-semibold', STATUS_TONE[i])}>{s.short} {s.label}</span>)}
        <span className="self-center">Tap a chapter's status to update it.</span>
      </div>

      <div className="space-y-2.5">
        {shown.map((s) => {
          const pct = completion(s.chapters, statusMap)
          const done = s.chapters.filter((c) => statusMap[c.id] === 3).length
          const isOpen = open === s.key
          return (
            <Card key={s.key} className="overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : s.key)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left" aria-expanded={isOpen}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-bold">{s.name}</span>{s.year && filter === 'all' && <Badge>{YEAR_LABEL[s.year]}</Badge>}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={cx('h-full rounded-full transition-all', pct >= 75 ? 'bg-emerald-500' : 'bg-sky-500')} style={{ width: `${pct}%` }} /></div>
                    <span className="w-24 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-500">{pct}% · {done}/{s.chapters.length}</span>
                  </div>
                </div>
                <ChevronDown className={cx('h-5 w-5 shrink-0 text-slate-400 transition', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <ul className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                  {s.mcq && mcqCount[s.mcq] > 0 && (
                    <li className="bg-slate-50/70 px-4 py-2.5 dark:bg-slate-800/40">
                      <a href={`#/mcq?subject=${encodeURIComponent(s.mcq)}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 dark:text-sky-300"><ClipboardList className="h-4 w-4" />Practise {mcqCount[s.mcq]} {s.mcq} MCQs</a>
                    </li>
                  )}
                  {s.chapters.map((c) => {
                    const st = statusMap[c.id] || 0
                    const topic = c.topic && topicBySlug[c.topic]
                    const n = c.mcq && c.mcq !== s.mcq ? mcqCount[c.mcq] || 0 : 0   // subject-wide MCQs are linked once above
                    return (
                      <li key={c.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={cx('min-w-0 flex-1 text-[15px]', st === 3 && 'text-slate-500')}>{c.title}</span>
                          <div className="flex shrink-0 gap-1" role="group" aria-label={`Status of ${c.title}`}>
                            {STATUS.map((x, i) => (
                              <button key={x.label} title={x.label} aria-pressed={st === i} onClick={() => setPortion(c.id, i)}
                                className={cx('h-8 min-w-[2.25rem] rounded-lg border px-2 text-xs font-bold transition', st === i ? STATUS_TONE[i] : 'border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-700')}>{x.short}</button>
                            ))}
                          </div>
                        </div>
                        {(topic || n > 0) && (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                            {topic && <a href={`#/topic/${topic.slug}`} className="inline-flex items-center gap-1 rounded-lg bg-clinic-50 px-2 py-1 text-clinic-700 dark:bg-clinic-950 dark:text-clinic-300"><BookOpen className="h-3.5 w-3.5" />Structured answer</a>}
                            {topic && <a href={`#/viva-session/topic/${topic.id}`} className="inline-flex items-center gap-1 rounded-lg bg-clinic-50 px-2 py-1 text-clinic-700 dark:bg-clinic-950 dark:text-clinic-300"><Sparkles className="h-3.5 w-3.5" />Viva with Meridee</a>}
                            {n > 0 && <a href={`#/mcq?subject=${encodeURIComponent(c.mcq)}`} className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><ClipboardList className="h-3.5 w-3.5" />{n} {c.mcq} MCQs</a>}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
