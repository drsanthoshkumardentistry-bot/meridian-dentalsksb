import { useMemo, useState } from 'react'
import { ChevronDown, Layers3, Mic, Search } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { Badge, Button, Card, Empty, Icon, PageHeader, PriorityBadge, Segmented, cx } from '../components/ui.jsx'
import { navigate } from '../state/router.js'

// Display order + labels for the structured JSONB answer.
export const SECTIONS = [
  ['definition', 'Definition', 'BookMarked'],
  ['classification', 'Classification', 'ListTree'],
  ['etiology', 'Aetiology / Pathogenesis', 'GitBranch'],
  ['clinical_features', 'Clinical features', 'Stethoscope'],
  ['investigations', 'Investigations', 'ScanLine'],
  ['histopathology', 'Histopathology', 'Microscope'],
  ['management', 'Management', 'HeartPulse'],
  ['viva_pearls', 'Viva pearls', 'Sparkles'],
]

export function TopicHub() {
  const { content, profile } = useApp()
  const [q, setQ] = useState('')
  const [prio, setPrio] = useState('all')
  const [subj, setSubj] = useState('all')
  const subjects = content.subjects
  const subjectOf = Object.fromEntries(subjects.map((s) => [s.id, s]))

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return content.topics.filter((t) =>
      (prio === 'all' || t.priority === prio) &&
      (subj === 'all' || t.subject_id === Number(subj)) &&
      (!needle || `${t.title} ${(t.tags || []).join(' ')} ${JSON.stringify(t.content)}`.toLowerCase().includes(needle)))
  }, [content.topics, q, prio, subj])

  const grouped = subjects.map((s) => ({ s, items: list.filter((t) => t.subject_id === s.id) })).filter((g) => g.items.length)

  return (
    <div className="animate-fade-in">
      <PageHeader title="Syllabus & High-Yield Hub" subtitle={`University-pattern answers, broken down the way examiners expect${profile?.university ? ` · ${profile.university}` : ''}`} />
      <Card className="mb-5 space-y-3 p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search topics, signs, drugs…" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-clinic-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900" />
        </label>
        <Segmented value={prio} onChange={setPrio} options={[['all', 'All'], ['must_know', '🔥 Must-Know'], ['desirable', 'Desirable']]} />
        <select value={subj} onChange={(e) => setSubj(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-900 sm:w-auto">
          <option value="all">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.bds_year ? ` (Year ${s.bds_year})` : ''}</option>)}
        </select>
      </Card>

      {!grouped.length && <Empty icon="SearchX" title="No topics match">Try a different search or filter.</Empty>}
      <div className="space-y-6">
        {grouped.map(({ s, items }) => (
          <section key={s.id}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><Icon name={s.icon} className="h-4 w-4 text-clinic-600" />{s.name}<span className="font-medium text-slate-400">· {items.length}</span></h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((t) => (
                <a key={t.id} href={`#/topic/${t.slug}`}><Card className="h-full p-4 transition hover:border-clinic-300 dark:hover:border-clinic-700">
                  <div className="flex items-start justify-between gap-2"><h3 className="font-bold">{t.title}</h3><PriorityBadge priority={t.priority} /></div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.content?.definition}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{t.marks_hint && <Badge tone="blue">{t.marks_hint}</Badge>}{(t.tags || []).slice(0, 2).map((g) => <Badge key={g}>{g}</Badge>)}</div>
                </Card></a>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">Subject: {Object.keys(subjectOf).length} · Content is for revision – always cross-check with your prescribed textbooks.</p>
    </div>
  )
}

export function TopicDetail({ slug }) {
  const { content, progress } = useApp()
  const topic = content.topics.find((t) => t.slug === slug)
  const [open, setOpen] = useState(() => new Set(['definition', 'classification', 'clinical_features', 'management']))
  const [flip, setFlip] = useState({})
  if (!topic) return <Empty icon="FileQuestion" title="Topic not found"><a className="text-clinic-600" href="#/topics">Back to topics</a></Empty>
  const subject = content.subjects.find((s) => s.id === topic.subject_id)
  const cards = content.flashcards.filter((f) => f.topic_id === topic.id)
  const sections = SECTIONS.filter(([k]) => topic.content?.[k] && (Array.isArray(topic.content[k]) ? topic.content[k].length : true))
  const lastViva = progress.vivas.find((v) => v.topic_id === topic.id)
  const toggle = (k) => setOpen((o) => { const n = new Set(o); n.has(k) ? n.delete(k) : n.add(k); return n })

  return (
    <div className="animate-fade-in">
      <PageHeader back="#/topics" title={topic.title}
        subtitle={<span className="flex flex-wrap items-center gap-2"><span>{subject?.name}</span><PriorityBadge priority={topic.priority} />{topic.marks_hint && <Badge tone="blue">{topic.marks_hint}</Badge>}</span>}
        actions={<Button icon="Mic" onClick={() => navigate(`viva-session/topic/${topic.id}`)}>Face the examiner</Button>} />

      {lastViva && <Card className="mb-4 flex items-center justify-between p-3 text-sm"><span className="text-slate-500">Last viva on this topic</span><b>{Number(lastViva.overall).toFixed(1)}/10</b></Card>}

      <div className="space-y-2.5">
        {sections.map(([k, label, icon]) => {
          const val = topic.content[k], isOpen = open.has(k)
          return (
            <Card key={k} className="overflow-hidden">
              <button onClick={() => toggle(k)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                <span className={cx('grid h-8 w-8 place-items-center rounded-lg', k === 'viva_pearls' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50' : 'bg-clinic-50 text-clinic-600 dark:bg-clinic-950 dark:text-clinic-300')}><Icon name={icon} className="h-4 w-4" /></span>
                <span className="flex-1 font-bold">{label}</span>
                <ChevronDown className={cx('h-5 w-5 text-slate-400 transition', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 px-4 py-3.5 text-[15px] leading-relaxed dark:border-slate-800">
                  {Array.isArray(val)
                    ? <ul className="space-y-2">{val.map((x, i) => <li key={i} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clinic-500" /><span>{x}</span></li>)}</ul>
                    : <p>{val}</p>}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {cards.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500"><Layers3 className="h-4 w-4" />Quick-recall flashcards · tap to flip</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((c) => (
              <button key={c.id} onClick={() => setFlip((f) => ({ ...f, [c.id]: !f[c.id] }))} className="text-left">
                <Card className={cx('min-h-[96px] p-4 transition', flip[c.id] && 'border-clinic-300 bg-clinic-50/60 dark:border-clinic-800 dark:bg-clinic-950/40')}>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{flip[c.id] ? 'Answer' : 'Question'}</div>
                  <div className="mt-1 font-semibold">{flip[c.id] ? c.back : c.front}</div>
                </Card>
              </button>
            ))}
          </div>
        </section>
      )}

      <Card className="mt-6 flex flex-wrap items-center gap-3 p-4">
        <Mic className="h-6 w-6 text-clinic-600" />
        <div className="flex-1"><p className="font-bold">Ready to be grilled?</p><p className="text-sm text-slate-500">The examiner will open with this case and probe your weak answers.</p></div>
        <Button icon="Mic" onClick={() => navigate(`viva-session/topic/${topic.id}`)}>Start viva</Button>
      </Card>
    </div>
  )
}
