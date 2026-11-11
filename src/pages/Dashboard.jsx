import { ArrowRight, BookOpenCheck, ClipboardList, Flame, Layers3, Mic, ScanEye, Sparkles } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { dueCards } from '../lib/leitner.js'
import { Badge, Card, Icon, PriorityBadge } from '../components/ui.jsx'
import { cloudEnabled } from '../lib/supabase.js'

export default function Dashboard() {
  const { content, progress, profile, user } = useApp()
  const { topics, subjects, flashcards, spotters, mcqs } = content
  const due = dueCards(flashcards, progress.cards).length
  const spot = progress.spotterAttempts
  const spotAcc = spot.length ? Math.round((spot.filter((a) => a.correct).length / spot.length) * 100) : null
  const vivaAvg = progress.vivas.length ? (progress.vivas.reduce((s, v) => s + Number(v.overall || 0), 0) / progress.vivas.length).toFixed(1) : null
  const ans = Object.values(progress.answers)
  const mcqAcc = ans.length ? Math.round((ans.filter(Boolean).length / ans.length) * 100) : null
  const name = profile?.full_name?.split(' ')[0] || (user ? 'Doctor' : 'there')
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const mustKnow = topics.filter((t) => t.priority === 'must_know')
  const vivaedTopicIds = new Set(progress.vivas.map((v) => v.topic_id))
  const nextUp = mustKnow.filter((t) => !vivaedTopicIds.has(t.id)).slice(0, 3)
  const subjectOf = Object.fromEntries(subjects.map((s) => [s.id, s]))

  const stats = [
    { label: 'Cards due today', value: due, icon: Layers3, href: '#/flashcards' },
    { label: 'Viva average', value: vivaAvg ? `${vivaAvg}/10` : '–', icon: Mic, href: '#/viva' },
    { label: 'Spotter accuracy', value: spotAcc != null ? `${spotAcc}%` : '–', icon: ScanEye, href: '#/spotters' },
    { label: 'MCQ accuracy', value: mcqAcc != null ? `${mcqAcc}%` : '–', icon: ClipboardList, href: '#/mcq' },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-clinic-700 via-clinic-600 to-sky-500 p-6 text-white shadow-card sm:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/5" />
        <p className="text-sm font-semibold text-clinic-100">{greet}, {name} 👋</p>
        <h1 className="mt-1 max-w-xl text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">Walk into your viva ready for the toughest external examiner.</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="#/viva" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-clinic-700 hover:bg-clinic-50"><Mic className="h-4 w-4" />Start a mock viva</a>
          <a href="#/flashcards" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/30 hover:bg-white/25"><Layers3 className="h-4 w-4" />Review {due} cards</a>
        </div>
        {!profile?.bds_year && <a href="#/profile" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-clinic-100 underline-offset-2 hover:underline"><Sparkles className="h-3.5 w-3.5" />Set your BDS year & university to personalise this</a>}
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: I, href }) => (
          <a key={label} href={href}><Card className="p-4 transition hover:border-clinic-300 dark:hover:border-clinic-700">
            <I className="h-5 w-5 text-clinic-600 dark:text-clinic-400" />
            <div className="mt-3 text-2xl font-extrabold tabular-nums">{value}</div>
            <div className="text-xs font-medium text-slate-500">{label}</div>
          </Card></a>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Modules</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModuleCard href="#/topics" icon={BookOpenCheck} tone="from-sky-500 to-clinic-600" title="Syllabus & High-Yield Hub" text={`${topics.length} topics · ${mustKnow.length} must-know, with structured answers`} />
          <ModuleCard href="#/viva" icon={Mic} tone="from-indigo-500 to-violet-600" title="AI Viva Voce Simulator" text="Strict external examiner, follow-up probing, live scoring" />
          <ModuleCard href="#/spotters" icon={ScanEye} tone="from-rose-500 to-pink-600" title="Spotter & Image Bank" text={`${spotters.length} radiographs, slides, instruments & specimens – timed`} />
          <ModuleCard href="#/mcq" icon={ClipboardList} tone="from-teal-500 to-emerald-600" title="NEET MDS MCQs" text={`${mcqs.length} PYQ & important questions · mock tests (+4/−1)`} />
        </div>
      </section>

      {nextUp.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500"><Flame className="h-4 w-4 text-rose-500" />Must-know topics you haven't been examined on</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {nextUp.map((t) => (
              <a key={t.id} href={`#/topic/${t.slug}`}><Card className="h-full p-4 transition hover:border-clinic-300 dark:hover:border-clinic-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Icon name={subjectOf[t.subject_id]?.icon} className="h-4 w-4" />{subjectOf[t.subject_id]?.name}</div>
                <div className="mt-2 font-bold">{t.title}</div>
                <div className="mt-3 flex items-center justify-between"><PriorityBadge priority={t.priority} /><ArrowRight className="h-4 w-4 text-slate-400" /></div>
              </Card></a>
            ))}
          </div>
        </section>
      )}

      {!user && cloudEnabled && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div><p className="font-semibold">You're studying as a guest</p><p className="text-sm text-slate-500">Progress is saved on this device only. Sign in to sync across phone and laptop and unlock the AI examiner.</p></div>
          <a href="#/auth" className="rounded-xl bg-clinic-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-clinic-700">Sign in</a>
        </Card>
      )}
      {content.source === 'local' && cloudEnabled && <p className="text-center text-xs text-slate-400"><Badge>Offline content</Badge> Couldn't reach the server – showing built-in content.</p>}
    </div>
  )
}

function ModuleCard({ href, icon: I, tone, title, text }) {
  return (
    <a href={href}><Card className="group flex h-full items-center gap-4 p-4 transition hover:border-clinic-300 dark:hover:border-clinic-700">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white ${tone}`}><I className="h-6 w-6" /></span>
      <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><span className="block text-sm text-slate-500">{text}</span></span>
      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-clinic-500" />
    </Card></a>
  )
}
