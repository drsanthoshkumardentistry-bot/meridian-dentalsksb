import { useState } from 'react'
import { ArrowRight, BookOpenCheck, ChevronDown, ClipboardList, ExternalLink, FileText, FileUp, Flame, Layers3, ScanEye, Sparkles } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { dueCards } from '../lib/leitner.js'
import { TRACKS } from '../lib/tracks.js'
import { Badge, Card, Icon, Modal, PriorityBadge } from '../components/ui.jsx'
import TrackPicker from '../components/TrackPicker.jsx'
import { PORTIONS, completion } from '../data/portions.js'
import { PYQ_STATS } from '../data/pyqSubjects.js'
import MerideeAvatar from '../components/MerideeAvatar.jsx'
import { cloudEnabled } from '../lib/supabase.js'
import { SUPPORT_EMAIL, supportMailto } from '../lib/config.js'

export default function Dashboard() {
  const { content, progress, profile, user, track, setTrack, toast } = useApp()
  const [switching, setSwitching] = useState(false)

  // First visit: choose a preparation track.
  if (!track) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in py-4">
        <div className="mb-6 flex items-center gap-3">
          <MerideeAvatar size="lg" />
          <div><p className="text-sm font-semibold text-clinic-600">Hi, I'm Meridee 👋</p><h1 className="text-2xl font-extrabold tracking-tight">What are you preparing for?</h1></div>
        </div>
        <TrackPicker value={null} onPick={(k) => setTrack(k).then(() => toast(`${TRACKS[k].label} selected`, 'success'))} />
        <p className="mt-4 text-center text-sm text-slate-500">You can switch any time from the dashboard.</p>
      </div>
    )
  }

  const { topics, subjects, flashcards, spotters, mcqs } = content
  const bank = mcqs.filter((q) => q.exam === track.mcqExam)
  const due = dueCards(flashcards, progress.cards).length
  const vivaAvg = progress.vivas.length ? (progress.vivas.reduce((s, v) => s + Number(v.overall || 0), 0) / progress.vivas.length).toFixed(1) : null
  const answered = bank.filter((q) => q.id in progress.answers)
  const mcqAcc = answered.length ? Math.round((answered.filter((q) => progress.answers[q.id]).length / answered.length) * 100) : null
  const name = profile?.full_name?.split(' ')[0] || (user ? 'Doctor' : 'there')
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const adcSubjectIds = new Set(subjects.filter((s) => s.track === 'adc').map((s) => s.id))
  const trackTopics = track.key === 'ADC' ? topics.filter((t) => adcSubjectIds.has(t.subject_id)) : topics.filter((t) => !adcSubjectIds.has(t.subject_id))
  const vivaed = new Set(progress.vivas.map((v) => v.topic_id))
  const nextUp = trackTopics.filter((t) => t.priority === 'must_know' && !vivaed.has(t.id)).slice(0, 3)
  const subjectOf = Object.fromEntries(subjects.map((s) => [s.id, s]))
  const portionChapters = PORTIONS[track.key].flatMap((s) => s.chapters)
  const portionPct = completion(portionChapters, progress.portions || {})

  const pyqTotal = Object.values(PYQ_STATS).reduce((n, x) => n + x.questions, 0)
  const MODULES = {
    pyq: { href: '#/pyq', icon: FileText, tone: 'from-violet-500 to-clinic-600', title: 'University PYQs', text: `${pyqTotal.toLocaleString()} TN MGR questions 2009–2026 · 10/5/2 marks · important repeats` },
    topics: { href: '#/portions', icon: BookOpenCheck, tone: 'from-clinic-500 to-clinic-700', title: 'Portions & high-yield topics', text: `${portionPct}% of ${portionChapters.length} chapters done · ${trackTopics.length} structured answers` },
    viva: { href: '#/viva', avatar: true, title: track.key === 'ADC' ? 'Meridee – clinical case examiner' : 'Meridee – AI viva examiner', text: track.key === 'ADC' ? 'Case scenarios judged on safety, consent and Australian guidelines' : 'Strict examiner, probing follow-ups, live scoring' },
    spotters: { href: '#/spotters', icon: ScanEye, tone: 'from-rose-500 to-pink-600', title: 'Spotter & Image Bank', text: `${spotters.length} radiographs, slides, instruments & specimens – timed` },
    study: { href: '#/study', icon: FileUp, tone: 'from-indigo-500 to-clinic-600', title: 'StudySync – your lecture PDFs', text: 'Upload slides → cited summary, flashcards and search' },
    flashcards: { href: '#/flashcards', icon: Layers3, tone: 'from-sky-400 to-sky-600', title: 'Flashcards', text: `${due} due today · spaced repetition` },
    mcq: { href: '#/mcq', icon: ClipboardList, tone: 'from-teal-500 to-emerald-600', title: track.mcqLabel, text: track.key === 'ADC' ? `${bank.length} scenario-based questions in the Australian context` : `${bank.length} PYQ & important questions · mock tests (+4/−1)` },
  }

  const stats = [
    { label: 'Cards due today', value: due, icon: Layers3, href: '#/flashcards' },
    { label: 'Meridee viva average', value: vivaAvg ? `${vivaAvg}/10` : '–', icon: Sparkles, href: '#/viva' },
    { label: track.key === 'ADC' ? 'ADC MCQ accuracy' : 'MCQ accuracy', value: mcqAcc != null ? `${mcqAcc}%` : '–', icon: ClipboardList, href: '#/mcq' },
    { label: 'Portions complete', value: `${portionPct}%`, icon: BookOpenCheck, href: '#/portions' },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-clinic-700 via-clinic-600 to-sky-500 p-6 text-white shadow-card sm:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <button onClick={() => setSwitching(true)} className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/30 hover:bg-white/25">
          <span aria-hidden>{track.emoji}</span>{track.label}<ChevronDown className="h-3.5 w-3.5" />
        </button>
        <p className="mt-3 text-sm font-semibold text-clinic-100">{greet}, {name} 👋</p>
        <h1 className="mt-1 max-w-xl text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{track.hero}</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          {track.key === 'University'
            ? <a href="#/viva" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-clinic-700 hover:bg-clinic-50"><Sparkles className="h-4 w-4" />Viva with Meridee</a>
            : <a href="#/mcq" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-clinic-700 hover:bg-clinic-50"><ClipboardList className="h-4 w-4" />{track.key === 'ADC' ? 'Practise ADC scenarios' : 'Start a mock test'}</a>}
          <a href="#/flashcards" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/30 hover:bg-white/25"><Layers3 className="h-4 w-4" />Review {due} cards</a>
        </div>
        {!profile?.bds_year && track.key === 'University' && <a href="#/profile" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-clinic-100 hover:underline"><Sparkles className="h-3.5 w-3.5" />Set your BDS year & university to personalise this</a>}
      </section>

      {track.key === 'ADC' && (
        <Card className="flex gap-3 border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900 dark:bg-sky-950/30">
          <Icon name="Stethoscope" className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
          <div className="text-sm">
            <p className="font-bold">The ADC pathway</p>
            <p className="mt-0.5 text-slate-600 dark:text-slate-300">Initial assessment → computer-based written examination (scenario-based MCQs) → practical examination (technical and clinical skills). Practice here is written for the Australian context; always confirm dates, fees and the current format on the ADC website.</p>
            <a href="https://adc.org.au/assessments/dentists/" target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline dark:text-sky-300">adc.org.au <ExternalLink className="h-3.5 w-3.5" /></a>
          </div>
        </Card>
      )}

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
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Your {track.short} plan</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {track.modules.map((k) => <ModuleCard key={k} {...MODULES[k]} />)}
        </div>
      </section>

      {nextUp.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500"><Flame className="h-4 w-4 text-rose-500" />Must-know topics Meridee hasn't examined you on</h2>
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
          <div><p className="font-semibold">You're studying as a guest</p><p className="text-sm text-slate-500">Progress is saved on this device only. Sign in to sync across devices and unlock Meridee AI.</p></div>
          <a href="#/auth" className="rounded-xl bg-clinic-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-clinic-700">Sign in</a>
        </Card>
      )}
      {content.source === 'local' && cloudEnabled && <p className="text-center text-xs text-slate-400"><Badge>Offline content</Badge> Couldn't reach the server – showing built-in content.</p>}

      <p className="pt-2 text-center text-xs text-slate-400">Questions or corrections? <a href={supportMailto('MeriDent Prep feedback')} className="font-semibold text-clinic-600 hover:underline">{SUPPORT_EMAIL}</a></p>

      <Modal open={switching} onClose={() => setSwitching(false)} title="Switch preparation track">
        <TrackPicker value={track.key} onPick={(k) => setTrack(k).then(() => { setSwitching(false); toast(`${TRACKS[k].label} selected`, 'success') })} />
      </Modal>
    </div>
  )
}

function ModuleCard({ href, icon: I, avatar, tone, title, text }) {
  return (
    <a href={href}><Card className="group flex h-full items-center gap-4 p-4 transition hover:border-clinic-300 dark:hover:border-clinic-700">
      {avatar ? <MerideeAvatar size="lg" /> : <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white ${tone}`}><I className="h-6 w-6" /></span>}
      <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><span className="block text-sm text-slate-500">{text}</span></span>
      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-clinic-500" />
    </Card></a>
  )
}
